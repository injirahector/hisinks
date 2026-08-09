const mongoose = require('mongoose');

// ── Notification types ────────────────────────────────────────────────────────
// booking_confirmed       — admin confirmed the booking
// booking_cancelled       — booking was cancelled (auto or manual)
// booking_completed       — booking marked completed
// consultation_reply      — admin replied in the consultation chat
// consultation_agreed     — admin set a price and marked as agreed
// deposit_confirmed       — admin confirmed M-Pesa deposit
// deposit_rejected        — admin rejected M-Pesa deposit (resubmit needed)

const NOTIFICATION_TYPES = [
  'booking_confirmed',
  'booking_cancelled',
  'booking_completed',
  'consultation_reply',
  'consultation_agreed',
  'deposit_confirmed',
  'deposit_rejected',
  // Admin-facing types
  'admin_new_booking',
  'admin_consultation_message',
  'admin_deposit_submitted',
  'admin_new_review',
  // Referral types
  'referral_commission_eligible',
];

const notificationSchema = new mongoose.Schema(
  {
    // Recipient (always a customer — admin has the dashboard)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: {
        values: NOTIFICATION_TYPES,
        message: 'Unknown notification type',
      },
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: [400, 'Message cannot exceed 400 characters'],
    },

    // Optional deep-link for the frontend (e.g. "/my-bookings", "/my-consultation")
    link: {
      type: String,
      trim: true,
      default: null,
    },

    read: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient per-user queries
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, read: 1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
