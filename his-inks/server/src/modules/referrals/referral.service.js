/**
 * referral.service.js
 *
 * All business logic for the referral system.
 * Called by:
 *   - auth.service.js       (on registration — capture referredBy)
 *   - booking.service.js    (on booking completed — processReferralEligibility)
 *   - referral.controller.js (API handlers)
 */

const crypto = require('crypto');
const User        = require('../users/user.model');
const Referral    = require('./referral.model');
const Booking     = require('../bookings/booking.model');
const Consultation = require('../consultations/consultation.model');
const { COMMISSION_RATE } = require('./referral.config');

// ── Referral code generator ───────────────────────────────────────────────────
// Produces codes like "HECTOR7K" — readable uppercase alphanumeric, 8 chars.
// The first part is derived from the user's first name (up to 6 chars),
// the remainder is random hex to guarantee uniqueness.
function generateReferralCode(firstName) {
  const namePart = (firstName || 'HI')
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, 6);
  const randomPart = crypto.randomBytes(2).toString('hex').toUpperCase(); // 4 hex chars
  return (namePart + randomPart).slice(0, 8).padEnd(8, 'X');
}

// Retry until a unique code is found (collision is extremely unlikely but
// we handle it defensively).
async function generateUniqueReferralCode(firstName) {
  let code;
  let attempts = 0;
  do {
    code = generateReferralCode(firstName);
    attempts++;
    if (attempts > 20) throw new Error('Could not generate a unique referral code.');
    // eslint-disable-next-line no-await-in-loop
  } while (await User.findOne({ referralCode: code }));
  return code;
}

// ── Called by auth.service.register ──────────────────────────────────────────
/**
 * Assigns a referral code to a newly created user and, if a valid referralCode
 * was supplied at registration, links the new user to the referrer.
 *
 * Also creates the initial 'pending' Referral record so the referrer can see
 * the pending relationship in their dashboard immediately.
 *
 * Runs AFTER the user document has been created, so errors here never
 * prevent account creation — they are caught and logged silently.
 *
 * @param {Object} user         — newly created Mongoose User document
 * @param {string} [refCode]    — referral code from the ?ref= query param (optional)
 */
async function applyReferralOnRegistration(user, refCode) {
  try {
    // 1. Always assign a referral code to new customers (never to admins)
    if (user.role === 'customer') {
      const code = await generateUniqueReferralCode(user.firstName);
      await User.findByIdAndUpdate(user._id, { referralCode: code });
    }

    // 2. If no referral code was provided, we're done
    if (!refCode) return;

    const cleanCode = refCode.trim().toUpperCase();

    // 3. Find the referrer by their referral code
    const referrer = await User.findOne({ referralCode: cleanCode });
    if (!referrer) return; // Invalid code → silent, registration still succeeds
    if (referrer.role !== 'customer') return; // Admins don't participate
    if (referrer._id.equals(user._id)) return; // Self-referral guard

    // 4. Prevent circular referrals: referrer must not have been referred by this user
    //    (covers A→B, B→A loops)
    if (referrer.referredBy && referrer.referredBy.equals(user._id)) return;

    // 5. Store the referredBy relationship on the new user
    await User.findByIdAndUpdate(user._id, { referredBy: referrer._id });

    // 6. Create the initial 'pending' referral record
    //    Using findOneAndUpdate with upsert=false equivalent — if record already
    //    exists for this referredCustomer (edge case: called twice), skip.
    const existing = await Referral.findOne({ referredCustomer: user._id });
    if (!existing) {
      await Referral.create({
        referrer:         referrer._id,
        referredCustomer: user._id,
        referralCode:     cleanCode,
        status:           'pending',
      });
    }
  } catch (err) {
    // Never let referral errors break registration
    console.error('[ReferralService] applyReferralOnRegistration error:', err.message);
  }
}

// ── Called by booking.service.updateBookingStatus when status === 'completed' ─
/**
 * Checks whether a completed booking qualifies for a referral commission and,
 * if so, transitions the referral record from 'pending' to 'eligible'.
 *
 * Idempotent: calling this multiple times for the same booking is safe.
 *
 * Eligibility conditions (ALL must be true):
 *   1. Booking status is 'completed'
 *   2. The booking's user was referred by someone (referredBy is set)
 *   3. This is the customer's FIRST qualifying completed tattoo
 *   4. A deposit was paid on the linked consultation (depositStatus === 'paid')
 *   5. The referral has not already been set to 'eligible' or 'paid'
 *
 * @param {string} bookingId
 */
async function processReferralEligibility(bookingId) {
  try {
    // 1. Load the booking
    const booking = await Booking.findById(bookingId);
    if (!booking || booking.status !== 'completed') return;
    if (!booking.userId) return; // Anonymous (walk-in) booking, no referral possible

    // 2. Check if this customer was referred
    const customer = await User.findById(booking.userId).select('referredBy');
    if (!customer || !customer.referredBy) return; // Not referred

    // 3. Find the pending referral record for this customer
    const referral = await Referral.findOne({
      referredCustomer: customer._id,
      status:           'pending',
    });
    if (!referral) return; // Already eligible/paid/cancelled, or no referral record

    // 4. Guard: only reward the FIRST qualifying completed tattoo.
    //    Check if there is already an eligible/paid referral for this customer.
    const alreadyRewarded = await Referral.findOne({
      referredCustomer: customer._id,
      status:           { $in: ['eligible', 'paid'] },
    });
    if (alreadyRewarded) return;

    // 5. Verify that payment was made: find the consultation linked to this booking
    //    and confirm depositStatus === 'paid'.
    const consultation = await Consultation.findOne({ bookingId: booking._id });
    if (!consultation || consultation.depositStatus !== 'paid') {
      // The booking is marked completed but no confirmed deposit exists
      // This covers direct bookings without a consultation (no payment tracked)
      // For now, we require a confirmed deposit; skip.
      return;
    }

    const agreedPrice = consultation.agreedPrice || 0;

    // 6. Calculate commission
    const rate             = COMMISSION_RATE;
    const commissionAmount = Math.round(agreedPrice * rate * 100) / 100;

    // 7. Transition to 'eligible' — use findOneAndUpdate for atomic update
    await Referral.findByIdAndUpdate(referral._id, {
      $set: {
        status:           'eligible',
        booking:          booking._id,
        bookingAmount:    agreedPrice,
        commissionRate:   rate,
        commissionAmount: commissionAmount,
        eligibleAt:       new Date(),
      },
    });

    // 8. Fire-and-forget notification to the referrer
    const { notifyReferralEligible } = require('../notifications/notification.service');
    notifyReferralEligible(referral.referrer, commissionAmount);
  } catch (err) {
    // Never let referral errors break booking completion
    console.error('[ReferralService] processReferralEligibility error:', err.message);
  }
}

// ── Handle booking cancellation: cancel pending/eligible referral if not paid ─
/**
 * Called when a booking is cancelled.
 * If there is a pending or eligible referral associated with this booking,
 * cancel it (unless already paid — paid commissions are not automatically clawed back).
 *
 * @param {string} bookingId
 */
async function cancelReferralForBooking(bookingId) {
  try {
    await Referral.updateOne(
      {
        booking: bookingId,
        status:  { $in: ['pending', 'eligible'] },
      },
      {
        $set: { status: 'cancelled' },
      }
    );
  } catch (err) {
    console.error('[ReferralService] cancelReferralForBooking error:', err.message);
  }
}

// ── Get referral stats for a customer (their dashboard) ──────────────────────
async function getMyReferrals(referrerId) {
  const referrals = await Referral.find({ referrer: referrerId })
    .populate('referredCustomer', 'firstName lastName email')
    .populate('booking', 'tattooIdea bookingNumber preferredDate')
    .sort({ createdAt: -1 })
    .lean();

  const stats = {
    total:              referrals.length,
    pending:            referrals.filter((r) => r.status === 'pending').length,
    eligible:           referrals.filter((r) => r.status === 'eligible').length,
    paid:               referrals.filter((r) => r.status === 'paid').length,
    cancelled:          referrals.filter((r) => r.status === 'cancelled').length,
    totalEligibleAmount: referrals
      .filter((r) => r.status === 'eligible')
      .reduce((sum, r) => sum + (r.commissionAmount || 0), 0),
    totalPaidAmount: referrals
      .filter((r) => r.status === 'paid')
      .reduce((sum, r) => sum + (r.commissionAmount || 0), 0),
  };

  return { referrals, stats };
}

// ── Get referral code (and link) for a customer ───────────────────────────────
async function getMyCode(userId) {
  // Must select 'role' so the lazy-generation guard below can evaluate it
  const user = await User.findById(userId).select('referralCode firstName role');
  if (!user) {
    const err = new Error('User not found.');
    err.statusCode = 404;
    throw err;
  }

  // Lazily generate a code if the user somehow doesn't have one (pre-migration users)
  if (!user.referralCode && user.role === 'customer') {
    const code = await generateUniqueReferralCode(user.firstName);
    await User.findByIdAndUpdate(userId, { referralCode: code });
    user.referralCode = code;
  }

  const frontendUrl =
    process.env.CLIENT_URL && process.env.CLIENT_URL !== 'http://localhost:5173'
      ? process.env.CLIENT_URL
      : 'https://hisinks.vercel.app';

  // Guard: if code is still missing (e.g. admin account), return null rather
  // than producing a broken ?ref=undefined link.
  const referralCode = user.referralCode || null;

  return {
    referralCode,
    referralLink: referralCode ? `${frontendUrl}/register?ref=${referralCode}` : null,
    commissionRate: COMMISSION_RATE,
  };
}

// ── Admin: get all referrals with pagination ──────────────────────────────────
async function getAllReferrals({ status, page = 1, limit = 20 } = {}) {
  const filter = {};
  if (status) filter.status = status;

  const skip = (page - 1) * limit;

  const [referrals, total] = await Promise.all([
    Referral.find(filter)
      .populate('referrer',         'firstName lastName email')
      .populate('referredCustomer', 'firstName lastName email')
      .populate('booking',          'tattooIdea preferredDate')
      .populate('paidBy',           'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Referral.countDocuments(filter),
  ]);

  // Summary stats for the admin page header
  const [pendingCount, eligibleCount, paidCount, cancelledCount, commissionAgg] =
    await Promise.all([
      Referral.countDocuments({ status: 'pending' }),
      Referral.countDocuments({ status: 'eligible' }),
      Referral.countDocuments({ status: 'paid' }),
      Referral.countDocuments({ status: 'cancelled' }),
      Referral.aggregate([
        { $match: { status: { $in: ['eligible', 'paid'] } } },
        { $group: { _id: null, total: { $sum: '$commissionAmount' } } },
      ]),
    ]);

  const totalCommission = commissionAgg[0]?.total || 0;

  return {
    referrals,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    summary: {
      total: total,
      pending: pendingCount,
      eligible: eligibleCount,
      paid: paidCount,
      cancelled: cancelledCount,
      totalCommission,
    },
  };
}

// ── Admin: mark a referral as paid ───────────────────────────────────────────
async function markAsPaid(referralId, adminId, { paymentReference, notes } = {}) {
  const referral = await Referral.findById(referralId);
  if (!referral) {
    const err = new Error('Referral not found.');
    err.statusCode = 404;
    throw err;
  }

  if (referral.status !== 'eligible') {
    const err = new Error(
      `Only eligible referrals can be marked as paid. Current status: ${referral.status}`
    );
    err.statusCode = 409;
    throw err;
  }

  if (!paymentReference || !paymentReference.trim()) {
    const err = new Error('Payment reference is required.');
    err.statusCode = 422;
    throw err;
  }

  referral.status           = 'paid';
  referral.paidAt           = new Date();
  referral.paidBy           = adminId;
  referral.paymentReference = paymentReference.trim();
  referral.notes            = notes ? notes.trim() : referral.notes;

  await referral.save();

  // Notify the referrer that their commission has been paid
  const { notifyReferralPaid } = require('../notifications/notification.service');
  notifyReferralPaid(referral.referrer, referral.commissionAmount);

  return referral;
}

module.exports = {
  generateUniqueReferralCode,
  applyReferralOnRegistration,
  processReferralEligibility,
  cancelReferralForBooking,
  getMyReferrals,
  getMyCode,
  getAllReferrals,
  markAsPaid,
};
