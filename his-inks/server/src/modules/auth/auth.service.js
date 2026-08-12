const crypto = require('crypto');
const User = require('../users/user.model');
const { generateToken } = require('../../utils/jwt.utils');
const { verifyGoogleToken } = require('./google.strategy');
const { sendPasswordResetEmail } = require('../../services/email.service');

// Lazy-loaded to avoid circular dependency issues at startup
let _referralService = null;
function getReferralService() {
  if (!_referralService) _referralService = require('../referrals/referral.service');
  return _referralService;
}

// Lazy-loaded models used only in deleteAccount — loaded at call time, not at startup
function getBooking()       { return require('../bookings/booking.model'); }
function getConsultation()  { return require('../consultations/consultation.model'); }
function getMessageThread() { return require('../messages/message.model'); }
function getNotification()  { return require('../notifications/notification.model'); }

/**
 * Builds the standard auth response payload.
 */
function buildAuthResponse(user) {
  const token = generateToken({ id: user._id, role: user.role });
  return { user: user.toSafeObject(), token };
}

// ── Register ──────────────────────────────────────────────────────────────────
// Public registration always creates a customer account.
// The admin account is managed directly by the studio owner.
async function register({ firstName, lastName, email, phone, password, referralCode }) {
  // Duplicate email check — but skip anonymized deleted-account emails so a
  // genuinely new customer can reuse the same address after deletion.
  const existingEmail = await User.findOne({ email: email.toLowerCase().trim() }).select('+deletedAt');
  if (existingEmail && !existingEmail.deletedAt) {
    const err = new Error('An account with this email already exists.');
    err.statusCode = 409;
    throw err;
  }

  // Duplicate phone check — same rule: ignore deleted accounts
  if (phone) {
    const existingPhone = await User.findOne({ phone: phone.trim() }).select('+deletedAt');
    if (existingPhone && !existingPhone.deletedAt) {
      const err = new Error('An account with this phone number already exists.');
      err.statusCode = 409;
      throw err;
    }
  }

  const user = await User.create({
    firstName: firstName.trim(),
    lastName:  lastName.trim(),
    email:     email.toLowerCase().trim(),
    phone:     phone ? phone.trim() : undefined,
    password,  // hashed by pre-save hook
    role:      'customer',
  });

  // Assign referral code and link referrer — fire-and-forget, never blocks registration
  getReferralService().applyReferralOnRegistration(user, referralCode || null);

  return buildAuthResponse(user);
}

// ── Login ─────────────────────────────────────────────────────────────────────
async function login({ email, password }) {
  // Select deletedAt so we can block deleted accounts before any other check
  const user = await User.findByEmailWithPassword(email);

  if (!user) {
    const err = new Error('Invalid email or password.');
    err.statusCode = 401;
    throw err;
  }

  // Block deleted accounts — return a generic 401 so we don't reveal the
  // account's anonymized state to an attacker
  if (user.deletedAt) {
    const err = new Error('Invalid email or password.');
    err.statusCode = 401;
    throw err;
  }

  // If the account was created via Google, it has no password — bcrypt.compare
  // would throw a TypeError. Return a clear message instead of crashing.
  if (user.authProvider === 'google' && !user.password) {
    const err = new Error('This account uses Google sign-in. Please continue with Google.');
    err.statusCode = 401;
    throw err;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    const err = new Error('Invalid email or password.');
    err.statusCode = 401;
    throw err;
  }

  return buildAuthResponse(user);
}

// ── Get current user ──────────────────────────────────────────────────────────
async function getMe(userId) {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error('User not found.');
    err.statusCode = 404;
    throw err;
  }
  return user.toSafeObject();
}

// ── Google OAuth ──────────────────────────────────────────────────────────────
// Called from POST /api/auth/google
// Strategy:
//   1. Verify the Google ID token — get { googleId, email, firstName, lastName, picture }
//   2. Look up by googleId           → existing linked user → log in (unless deleted)
//   3. Look up by email              → existing local user  → link Google, log in (unless deleted)
//   4. Neither found                 → create new customer account
//   Referral code is applied only for brand-new accounts (step 4).
async function googleAuth({ credential, referralCode }) {
  // Step 1: verify with Google
  const profile = await verifyGoogleToken(credential);
  const { googleId, email, firstName, lastName, picture } = profile;

  // Step 2: find by googleId — fastest path for returning Google users
  let user = await User.findOne({ googleId }).select('+deletedAt');
  if (user) {
    // Block deleted accounts — do not re-authenticate them
    if (user.deletedAt) {
      const err = new Error('This Google account has been deleted. Please register a new account.');
      err.statusCode = 401;
      throw err;
    }
    return buildAuthResponse(user);
  }

  // Step 3: find by email — account exists with password login
  user = await User.findOne({ email }).select('+deletedAt');
  if (user) {
    // If this email now belongs to a deleted/anonymized account, do NOT link
    // Google to it.  The original email was changed to deleted-user-{id}@deleted.local
    // during anonymization, so in practice this branch won't match a deleted account
    // via the original email.  The guard below is a belt-and-suspenders safety net
    // in case the lookup somehow returns an anonymized record.
    if (user.deletedAt) {
      const err = new Error('This Google account has been deleted. Please register a new account.');
      err.statusCode = 401;
      throw err;
    }

    // Link Google to the existing account — safe merge, no data loss
    user.googleId      = googleId;
    user.authProvider  = 'google';
    // Update profile picture only if the user doesn't have a custom one
    if (!user.profileImage && picture) {
      user.profileImage = picture;
    }
    await user.save();
    return buildAuthResponse(user);
  }

  // Step 4: new user — create a customer account
  user = await User.create({
    firstName,
    lastName,
    email,
    profileImage: picture || null,
    role:         'customer',
    authProvider: 'google',
    googleId,
    // password intentionally omitted — not required for Google accounts
  });

  // Apply referral (fire-and-forget) — same path as email registration
  getReferralService().applyReferralOnRegistration(user, referralCode || null);

  return buildAuthResponse(user);
}

// ── Request Password Reset ────────────────────────────────────────────────────
// Generates a cryptographically secure one-time token, stores its SHA-256 hash
// in the database, and sends the raw token to the user's email.
//
// Security: always returns the same generic success message regardless of
// whether the email exists — prevents account enumeration.
async function requestPasswordReset(email) {
  const EXPIRES_MIN = parseInt(process.env.PASSWORD_RESET_EXPIRES_MINUTES, 10) || 15;

  const normalised = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalised }).select(
    '+passwordResetToken +passwordResetExpires +authProvider +password +deletedAt'
  );

  // Always resolve successfully — never reveal whether the email exists
  if (!user) return;

  // Do not send a reset email to a deleted/anonymized account — the anonymized
  // email is an internal placeholder, not a real address, so the email would
  // bounce anyway.  Silently return without error (same enumeration-safe pattern).
  if (user.deletedAt) return;

  // Google-only accounts have no password — do not send a reset email that
  // would create a confusing / misleading auth flow for them.
  if (user.authProvider === 'google' && !user.password) return;

  // Generate a secure 32-byte raw token (64 hex chars)
  const rawToken = crypto.randomBytes(32).toString('hex');

  // Store only the SHA-256 hash — raw token never touches the database
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

  user.passwordResetToken   = hashedToken;
  user.passwordResetExpires = new Date(Date.now() + EXPIRES_MIN * 60 * 1000);
  await user.save({ validateBeforeSave: false });

  // Build the reset URL using CLIENT_URL env var so it works in all environments
  const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');
  const resetUrl  = `${clientUrl}/reset-password?token=${rawToken}`;

  try {
    await sendPasswordResetEmail({
      to:         user.email,
      firstName:  user.firstName,
      resetUrl,
      expiresMin: EXPIRES_MIN,
    });
  } catch (emailErr) {
    // If email fails, clear the token so the user can try again immediately
    user.passwordResetToken   = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    // Re-throw so the controller can log it; the controller will NOT expose this
    // error message to the client — it still returns the generic response.
    throw emailErr;
  }
}

// ── Reset Password ────────────────────────────────────────────────────────────
// Accepts the raw token from the email link, hashes it, looks up the user,
// validates expiry, and sets the new password.
//
// Security:
//   - Client-provided userId is NEVER trusted — user is found only by token hash
//   - Token is one-time: cleared immediately on success
//   - Generic error for invalid/expired tokens
//   - Deleted accounts cannot reset their password (deletedAt guard)
async function resetPassword(rawToken, newPassword) {
  if (!rawToken || typeof rawToken !== 'string') {
    const err = new Error('Invalid or expired password reset link.');
    err.statusCode = 400;
    throw err;
  }

  // Hash the incoming token to compare against the stored hash
  const hashedToken = crypto.createHash('sha256').update(rawToken.trim()).digest('hex');

  // Find user by hashed token AND ensure expiry is still in the future
  const user = await User.findOne({
    passwordResetToken:   hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  }).select('+password +passwordResetToken +passwordResetExpires +deletedAt');

  if (!user) {
    const err = new Error('Invalid or expired password reset link.');
    err.statusCode = 400;
    throw err;
  }

  // Deleted accounts must not be reactivated via password reset
  if (user.deletedAt) {
    const err = new Error('Invalid or expired password reset link.');
    err.statusCode = 400;
    throw err;
  }

  // Set the new password — the pre-save hook will hash it
  user.password             = newPassword;
  user.passwordResetToken   = undefined;
  user.passwordResetExpires = undefined;

  // If this was a Google-only account that is now establishing a password,
  // keep authProvider as-is. The user can now log in with email+password too.
  // We do NOT force authProvider to 'local' — it reflects how the account was created.

  await user.save();
}

// ── Delete Account ────────────────────────────────────────────────────────────
//
// Permanently anonymizes a customer account and removes personal data.
//
// Security model:
//   - Only callable for role === 'customer' (enforced by restrictTo in the route)
//   - User is identified from req.user (JWT), never from a client-supplied ID
//   - Requires { confirmation: 'DELETE' } in the request body
//   - Local accounts additionally require the current password
//   - Active bookings (pending/confirmed) block deletion
//   - Active consultations with a paid deposit block deletion
//
// Data strategy:
//   ANONYMIZE (keep record, remove PII):
//     - User document itself — deletedAt set so all auth paths reject it immediately
//     - Bookings (customerName, email, phone fields; userId unset)
//     - Consultations (customerName, email, phone fields; userId kept for history)
//     - Reviews (customer ObjectId reference preserved but author name gone)
//     - MessageThread (customerName, email, phone anonymized)
//     - Referral records (referrer/referredCustomer ObjectIds preserved for audit)
//   DELETE (safe to remove entirely):
//     - Notifications (personal inbox — no business value after account gone)
//
async function deleteAccount(userId, { confirmation, password } = {}) {
  // ── 1. Validate confirmation token ────────────────────────────────────────
  if (!confirmation || confirmation !== 'DELETE') {
    const err = new Error('Please type DELETE to confirm account deletion.');
    err.statusCode = 400;
    throw err;
  }

  // ── 2. Load the user (with password for local accounts) ───────────────────
  const user = await User.findById(userId).select('+password +deletedAt');
  if (!user) {
    const err = new Error('User not found.');
    err.statusCode = 404;
    throw err;
  }

  // Guard: only customers can delete via this endpoint (belt-and-suspenders
  // on top of the restrictTo('customer') middleware in the route)
  if (user.role !== 'customer') {
    const err = new Error('Account deletion is only available for customer accounts.');
    err.statusCode = 403;
    throw err;
  }

  // ── 3. Password verification (local accounts only) ────────────────────────
  // Google-only accounts have authProvider === 'google' and no password field.
  // We skip password verification for those accounts entirely.
  if (user.authProvider === 'local' || user.password) {
    if (!password) {
      const err = new Error('Please enter your current password to confirm account deletion.');
      err.statusCode = 400;
      throw err;
    }
    if (!user.password) {
      // Edge case: local account that somehow has no hashed password — block safely
      const err = new Error('Password verification failed. Please contact support.');
      err.statusCode = 400;
      throw err;
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      const err = new Error('Incorrect password. Please try again.');
      err.statusCode = 401;
      throw err;
    }
  }

  // ── 4. Active booking check ───────────────────────────────────────────────
  const Booking = getBooking();
  const activeBooking = await Booking.findOne({
    userId,
    status: { $in: ['pending', 'confirmed'] },
  });
  if (activeBooking) {
    const err = new Error(
      'Your account cannot be deleted while you have an active booking. ' +
      'Please complete or cancel the booking first.'
    );
    err.statusCode = 409;
    throw err;
  }

  // ── 5. Active consultation/deposit check ──────────────────────────────────
  // Block deletion only when a deposit has been confirmed but no booking has
  // been created yet (status === 'deposit_paid').  Once the consultation moves
  // to 'booked', a real Booking record exists and the booking check above
  // already handles that case — no need to block here again.
  const Consultation = getConsultation();
  const activeConsultation = await Consultation.findOne({
    userId,
    status: 'deposit_paid',
  });
  if (activeConsultation) {
    const err = new Error(
      'Your account cannot be deleted while you have a confirmed deposit awaiting booking. ' +
      'Please complete your booking or contact the studio to resolve this first.'
    );
    err.statusCode = 409;
    throw err;
  }

  // ── 6. Build a stable anonymized identifier for this user ─────────────────
  // Using the last 8 hex chars of the userId to keep uniqueness across all
  // anonymized records (avoids violating the email unique index on User).
  const anonId    = userId.toString().slice(-8);
  const anonEmail = `deleted-user-${anonId}@deleted.local`;
  const anonName  = 'Deleted User';

  // ── 7. Anonymize the User document and set deletedAt ─────────────────────
  // deletedAt is set FIRST — this is the gate that immediately blocks all auth
  // paths (protect middleware, login, googleAuth, requestPasswordReset,
  // resetPassword) from accepting this account again.
  //
  // We use findByIdAndUpdate with explicit $set/$unset instead of document.save()
  // because Mongoose does not reliably $unset sparse-indexed fields (phone,
  // googleId, referralCode) when set to undefined in memory — it may store null
  // instead, causing E11000 duplicate key errors on the second account deletion.
  await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        deletedAt:    new Date(),
        deletedBy:    userId,   // self-delete: the customer is their own deletedBy
        firstName:    anonName,
        lastName:     '',
        email:        anonEmail,
        profileImage: null,
        bio:          null,
        location:     null,
        authProvider: 'local',
      },
      $unset: {
        // sparse unique indexes — must be absent, not null
        phone:                '',
        googleId:             '',
        referralCode:         '',
        // credentials / tokens — remove entirely
        password:             '',
        passwordResetToken:   '',
        passwordResetExpires: '',
      },
    },
    { runValidators: false }
  );

  // ── 8. Anonymize Bookings (preserve historical records for admin) ─────────
  await Booking.updateMany(
    { userId },
    {
      $set: {
        customerName: anonName,
        email:        anonEmail,
        phone:        'removed',
      },
      // Null out the userId foreign key so the booking no longer links to the
      // (now-anonymous) user document.  Historical data stays intact for admin.
      $unset: { userId: '' },
    }
  );

  // ── 9. Anonymize Consultations (preserve history) ────────────────────────
  await Consultation.updateMany(
    { userId },
    {
      $set: {
        customerName: anonName,
        email:        anonEmail,
        phone:        'removed',
      },
      // userId is kept intentionally (it still points to the anonymized user doc)
    }
  );

  // ── 10. Anonymize MessageThread ───────────────────────────────────────────
  const MessageThread = getMessageThread();
  await MessageThread.updateMany(
    { userId },
    {
      $set: {
        customerName: anonName,
        email:        anonEmail,
        phone:        'removed',
      },
    }
  );

  // ── 11. Reviews — preserve, customer ObjectId reference stays ────────────
  // The review.customer field is an ObjectId that now points to the anonymized
  // user.  Admin review pages display user.firstName + user.lastName =
  // 'Deleted User'.  No structural change needed.

  // ── 12. Delete Notifications (personal inbox, no business value) ─────────
  const Notification = getNotification();
  await Notification.deleteMany({ userId });

  // ── 13. Referrals — preserve for commission audit trail ──────────────────
  // Referral records reference this user via ObjectId.  Those now point to the
  // anonymized user doc.  No structural changes needed.

  // Log deletion event (minimal — no PII, no JWT, no password)
  console.info(
    `[ACCOUNT_DELETED] userId=${userId} timestamp=${new Date().toISOString()}`
  );
}

// ── Admin: Delete Customer Account ───────────────────────────────────────────
//
// Allows an administrator to soft-delete any customer account on their behalf
// (e.g. when a customer requests deletion but cannot access their own account).
//
// Reuses the same anonymization pipeline as deleteAccount():
//   - skips password verification (admin is already authenticated)
//   - skips active-booking / active-consultation checks (admin decision)
//   - records deletedBy (admin id) and optional deletionReason
//
// Security model:
//   - adminId must be a verified admin (enforced by protect + restrictTo in route)
//   - targetId comes from the URL param — never from the request body
//   - Cannot be used on admin accounts
//
async function adminDeleteAccount(adminId, targetId, { deletionReason } = {}) {
  // ── 1. Load the target user ───────────────────────────────────────────────
  const user = await User.findById(targetId).select('+deletedAt');
  if (!user) {
    const err = new Error('Customer not found.');
    err.statusCode = 404;
    throw err;
  }

  // Only customer accounts may be deleted via this endpoint
  if (user.role !== 'customer') {
    const err = new Error('Only customer accounts can be deleted by an admin.');
    err.statusCode = 403;
    throw err;
  }

  // Already deleted — idempotent guard
  if (user.deletedAt) {
    const err = new Error('This account has already been deleted.');
    err.statusCode = 409;
    throw err;
  }

  // ── 2. Build anonymized identifier (same scheme as self-delete) ───────────
  const anonId    = targetId.toString().slice(-8);
  const anonEmail = `deleted-user-${anonId}@deleted.local`;
  const anonName  = 'Deleted User';

  // ── 3. Anonymize the User document ───────────────────────────────────────
  await User.findByIdAndUpdate(
    targetId,
    {
      $set: {
        deletedAt:      new Date(),
        deletedBy:      adminId,
        deletionReason: deletionReason ? deletionReason.trim() : null,
        firstName:      anonName,
        lastName:       '',
        email:          anonEmail,
        profileImage:   null,
        bio:            null,
        location:       null,
        authProvider:   'local',
      },
      $unset: {
        phone:                '',
        googleId:             '',
        referralCode:         '',
        password:             '',
        passwordResetToken:   '',
        passwordResetExpires: '',
      },
    },
    { runValidators: false }
  );

  // ── 4. Anonymize Bookings ─────────────────────────────────────────────────
  const Booking = getBooking();
  await Booking.updateMany(
    { userId: targetId },
    {
      $set: {
        customerName: anonName,
        email:        anonEmail,
        phone:        'removed',
      },
      $unset: { userId: '' },
    }
  );

  // ── 5. Anonymize Consultations ────────────────────────────────────────────
  const Consultation = getConsultation();
  await Consultation.updateMany(
    { userId: targetId },
    {
      $set: {
        customerName: anonName,
        email:        anonEmail,
        phone:        'removed',
      },
    }
  );

  // ── 6. Anonymize MessageThread ────────────────────────────────────────────
  const MessageThread = getMessageThread();
  await MessageThread.updateMany(
    { userId: targetId },
    {
      $set: {
        customerName: anonName,
        email:        anonEmail,
        phone:        'removed',
      },
    }
  );

  // ── 7. Delete Notifications ───────────────────────────────────────────────
  const Notification = getNotification();
  await Notification.deleteMany({ userId: targetId });

  // ── 8. Audit log ──────────────────────────────────────────────────────────
  console.info(
    `[ADMIN_ACCOUNT_DELETED] adminId=${adminId} targetUserId=${targetId} ` +
    `reason="${deletionReason || ''}" timestamp=${new Date().toISOString()}`
  );
}

module.exports = {
  register,
  login,
  getMe,
  googleAuth,
  requestPasswordReset,
  resetPassword,
  deleteAccount,
  adminDeleteAccount,
};
