const mongoose = require('mongoose');

// ── Embedded message schema ───────────────────────────────────────────────────
const messageEntrySchema = new mongoose.Schema(
  {
    sender: {
      type: String,
      enum: ['customer', 'admin'],
      required: true,
    },
    text: {
      type: String,
      trim: true,
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
      default: null,
    },
    // Optional image attachment (Cloudinary URL)
    image: {
      type: String,
      trim: true,
      default: null,
    },
    // Whether the OTHER party has read this message
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// ── Thread schema — one document per customer ─────────────────────────────────
// A thread is lazily created when the customer sends their first direct message.
const messageThreadSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // one thread per customer
    },
    // Customer snapshot for admin list view (avoid extra populate)
    customerName: { type: String, required: true, trim: true },
    phone:        { type: String, trim: true, default: '' },
    email:        { type: String, trim: true, lowercase: true, default: null },

    messages: [messageEntrySchema],

    // Quick-access counters for unread badges
    unreadByAdmin:    { type: Number, default: 0 }, // messages sent by customer, unread by admin
    unreadByCustomer: { type: Number, default: 0 }, // messages sent by admin, unread by customer

    // Timestamp of the last message — used for sorting
    lastMessageAt: { type: Date, default: null },
  },
  { timestamps: true }
);

messageThreadSchema.index({ lastMessageAt: -1 });

const MessageThread = mongoose.model('MessageThread', messageThreadSchema);
module.exports = MessageThread;
