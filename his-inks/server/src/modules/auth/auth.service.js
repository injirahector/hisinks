const User = require('../users/user.model');
const { generateToken } = require('../../utils/jwt.utils');
const { verifyGoogleToken } = require('./google.strategy');
// Lazy-loaded to avoid circular dependency issues at startup
let _referralService = null;
function getReferralService() {
  if (!_referralService) _referralService = require('../referrals/referral.service');
  return _referralService;
}

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
  // Duplicate email check
  const existingEmail = await User.findOne({ email: email.toLowerCase().trim() });
  if (existingEmail) {
    const err = new Error('An account with this email already exists.');
    err.statusCode = 409;
    throw err;
  }

  // Duplicate phone check
  if (phone) {
    const existingPhone = await User.findOne({ phone: phone.trim() });
    if (existingPhone) {
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
  const user = await User.findByEmailWithPassword(email);

  if (!user) {
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
//   2. Look up by googleId           → existing linked user → log in
//   3. Look up by email              → existing local user  → link Google, log in
//   4. Neither found                 → create new customer account
//   Referral code is applied only for brand-new accounts (step 4).
async function googleAuth({ credential, referralCode }) {
  // Step 1: verify with Google
  const profile = await verifyGoogleToken(credential);
  const { googleId, email, firstName, lastName, picture } = profile;

  // Step 2: find by googleId — fastest path for returning Google users
  let user = await User.findOne({ googleId });
  if (user) {
    return buildAuthResponse(user);
  }

  // Step 3: find by email — account exists with password login
  user = await User.findOne({ email });
  if (user) {
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

module.exports = { register, login, getMe, googleAuth };
