const mongoose = require('mongoose');

/**
 * Referral model
 *
 * Tracks the lifecycle of a customer referral from registration through
 * to manual commission payment by the admin.
 *
 * Statuses:
 *   pending   — referred customer registered but has not completed a qualifying tattoo yet
 *   eligible  — qualifying tattoo completed AND deposit paid → admin can now pay commission
 *   paid      — admin manually sent commission and recorded the transaction
 *   cancelled — booking was cancelled/refunded before payment; no commission owed
 */

const REFERRAL_STATUSES = ['pending', 'eligible', 'paid', 'cancelled'];

const referralSchema = new mongoose.Schema(
  {
    // ── Participants ──────────────────────────────────────────────────────
    referrer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    referredCustomer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      // Unique: one referral record per referred customer (first qualifying tattoo only)
      unique: true,
      index: true,
    },

    // The referral code that was used at registration time (audit trail)
    referralCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    // ── Qualifying booking (populated when eligible) ───────────────────
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null,
      index: true,
    },

    // Agreed price from the linked consultation (snapshot, never recalculated)
    bookingAmount: {
      type: Number,
      default: null,
      min: 0,
    },

    // Rate used when commission was calculated (snapshot of COMMISSION_RATE at time of eligibility)
    commissionRate: {
      type: Number,
      default: null,
      min: 0,
      max: 1,
    },

    // Calculated commission amount (snapshot, never automatically recalculated after save)
    commissionAmount: {
      type: Number,
      default: null,
      min: 0,
    },

    // ── Status lifecycle ──────────────────────────────────────────────────
    status: {
      type: String,
      enum: {
        values: REFERRAL_STATUSES,
        message: 'Invalid referral status',
      },
      default: 'pending',
      index: true,
    },

    // When status moved to 'eligible'
    eligibleAt: {
      type: Date,
      default: null,
    },

    // ── Manual payment fields (filled by admin) ───────────────────────────
    paidAt: {
      type: Date,
      default: null,
    },
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    // M-Pesa transaction reference entered by admin
    paymentReference: {
      type: String,
      trim: true,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
// Fast lookups for the referrer's dashboard and admin management page
referralSchema.index({ referrer: 1, status: 1 });
referralSchema.index({ status: 1, createdAt: -1 });

const Referral = mongoose.model('Referral', referralSchema);

module.exports = Referral;
module.exports.REFERRAL_STATUSES = REFERRAL_STATUSES;
