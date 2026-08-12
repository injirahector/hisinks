const mongoose = require('mongoose');

// ── Embedded message schema ───────────────────────────────────────────────────
const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: String,
      enum: ['customer', 'admin'],
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },
  },
  { timestamps: true }
);

// ── Consultation schema ───────────────────────────────────────────────────────
const consultationSchema = new mongoose.Schema(
  {
    // Multiple consultations allowed per customer — most recent is the active one.
    // No unique index on userId.
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Customer snapshot (so admin sees name/contact without extra lookup)
    customerName: { type: String, required: true, trim: true },
    phone:        { type: String, trim: true, default: '' },
    email:        { type: String, trim: true, lowercase: true, default: null },

    // The thread — all messages in chronological order
    messages: [messageSchema],

    // Lifecycle status
    // open → agreed → deposit_pending → deposit_paid → booked | closed
    status: {
      type: String,
      enum: ['open', 'agreed', 'deposit_pending', 'deposit_paid', 'booked', 'closed'],
      default: 'open',
    },

    // Set by admin when they mark consultation as agreed
    agreedPrice: {
      type: Number,
      default: null,
      min: [0, 'Price cannot be negative'],
    },

    // Deposit — 20% of agreedPrice, paid via M-Pesa before booking is unlocked
    depositAmount: {
      type: Number,
      default: null,
    },
    // M-Pesa transaction code submitted by customer (e.g. SLK1234XYZ)
    depositRef: {
      type: String,
      trim: true,
      default: null,
    },
    // none | pending | paid
    depositStatus: {
      type: String,
      enum: ['none', 'pending', 'paid'],
      default: 'none',
    },
    // When admin confirmed the deposit
    depositConfirmedAt: {
      type: Date,
      default: null,
    },

    // Linked booking — set when customer books after agreement
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null,
    },

    // Sequential number per customer (1, 2, 3…) — set on creation
    consultationNumber: {
      type: Number,
      default: 1,
    },

    // Optional tattoo reference from the portfolio — set on first message
    // when customer arrives via "Book This Style"
    tattooRef: {
      title:       { type: String, default: null },
      image:       { type: String, default: null },
      category:    { type: String, default: null },
      description: { type: String, default: null },
    },

    // Optional inspiration reference from inspiration gallery — set on first message
    // when customer arrives via inspiration details page
    inspirationRef: {
      _id:          { type: mongoose.Schema.Types.ObjectId, ref: 'Inspiration', default: null },
      title:        { type: String, default: null },
      image:        { type: String, default: null },
      category:     { type: String, default: null },
      description:  { type: String, default: null },
      estimatedSize: { type: String, default: null },
      suggestedPlacement: { type: String, default: null },
    },
  },
  { timestamps: true }
);

// Index for fast "get latest consultation for user" queries
consultationSchema.index({ userId: 1, createdAt: -1 });

const Consultation = mongoose.model('Consultation', consultationSchema);
module.exports = Consultation;
