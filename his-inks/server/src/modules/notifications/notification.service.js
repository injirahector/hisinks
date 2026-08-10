const Notification = require('./notification.model');
const { emitToUser } = require('../../socket/socket');

// Lazy-loaded to avoid circular-dependency issues at module init time
let _User = null;
function User() {
  if (!_User) _User = require('../users/user.model');
  return _User;
}

// ── Get all admin user IDs (cached per process lifetime) ─────────────────────
// There may be more than one admin account — notify all of them.
let _adminIds = null;
async function getAdminIds() {
  if (_adminIds) return _adminIds;
  const admins = await User().find({ role: 'admin' }).select('_id').lean();
  _adminIds = admins.map((a) => a._id);
  return _adminIds;
}

// Invalidate cache (called if admin accounts change at runtime — safety valve)
function clearAdminCache() {
  _adminIds = null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function notFound(msg) {
  const e = new Error(msg);
  e.statusCode = 404;
  return e;
}
function forbidden(msg) {
  const e = new Error(msg);
  e.statusCode = 403;
  return e;
}

// ── Create a notification (internal — called by other services) ───────────────
// Does NOT throw — notifications are fire-and-forget; failing silently is
// safer than rolling back the main operation because of a notification error.
async function createNotification({ userId, type, title, message, link = null }) {
  try {
    const notification = await Notification.create({ userId, type, title, message, link });
    // Real-time: push to the user immediately if they are connected
    emitToUser(userId, 'notification.created', {
      _id:       notification._id,
      type:      notification.type,
      title:     notification.title,
      message:   notification.message,
      link:      notification.link,
      read:      notification.read,
      createdAt: notification.createdAt,
    });
  } catch (err) {
    // Log but never propagate so the caller's transaction isn't affected
    console.error('[NotificationService] Failed to create notification:', err.message);
  }
}

// ── Get notifications for the logged-in user (paginated) ─────────────────────
async function getMyNotifications(userId, { page = 1, limit = 20 } = {}) {
  const skip = (page - 1) * limit;

  const [notifications, total] = await Promise.all([
    Notification.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Notification.countDocuments({ userId }),
  ]);

  return {
    notifications,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ── Get unread count for the badge ───────────────────────────────────────────
async function getUnreadCount(userId) {
  return Notification.countDocuments({ userId, read: false });
}

// ── Mark a single notification as read ───────────────────────────────────────
async function markAsRead(notificationId, userId) {
  const notification = await Notification.findById(notificationId);
  if (!notification) throw notFound('Notification not found.');
  // Users can only mark their own notifications
  if (notification.userId.toString() !== userId.toString()) {
    throw forbidden('Access denied.');
  }
  notification.read = true;
  await notification.save();
  return notification;
}

// ── Mark all notifications as read ───────────────────────────────────────────
async function markAllAsRead(userId) {
  const result = await Notification.updateMany(
    { userId, read: false },
    { $set: { read: true } }
  );
  return { updated: result.modifiedCount };
}

// ── Convenience wrappers used by trigger functions ────────────────────────────

function notifyBookingConfirmed(userId, preferredDate) {
  const dateStr = new Date(preferredDate).toLocaleDateString('en-KE', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  return createNotification({
    userId,
    type: 'booking_confirmed',
    title: 'Booking Confirmed 🎉',
    message: `Your tattoo session on ${dateStr} has been confirmed. We look forward to seeing you!`,
    link: '/my-bookings',
  });
}

function notifyBookingCancelled(userId, preferredDate, reason = null) {
  const dateStr = new Date(preferredDate).toLocaleDateString('en-KE', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const extra = reason ? ` Reason: ${reason}` : '';
  return createNotification({
    userId,
    type: 'booking_cancelled',
    title: 'Booking Cancelled',
    message: `Your booking for ${dateStr} has been cancelled.${extra}`,
    link: '/my-bookings',
  });
}

function notifyBookingCompleted(userId, preferredDate) {
  const dateStr = new Date(preferredDate).toLocaleDateString('en-KE', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  return createNotification({
    userId,
    type: 'booking_completed',
    title: 'Session Completed ✅',
    message: `Your tattoo session on ${dateStr} is complete. How did it go? We'd love to hear your thoughts — tap to leave a review!`,
    link: '/my-reviews',
  });
}

function notifyConsultationReply(userId) {
  return createNotification({
    userId,
    type: 'consultation_reply',
    title: 'New Message from His Inks 💬',
    message: 'The artist replied to your consultation. Tap to read and continue the conversation.',
    link: '/my-consultation',
  });
}

function notifyConsultationAgreed(userId, agreedPrice, depositAmount) {
  return createNotification({
    userId,
    type: 'consultation_agreed',
    title: 'Price Agreed — Deposit Required 💰',
    message: `The artist has agreed on a price of KES ${agreedPrice.toLocaleString()}. A deposit of KES ${depositAmount.toLocaleString()} is required to confirm your booking. Please submit your M-Pesa reference.`,
    link: '/my-consultation',
  });
}

function notifyDepositConfirmed(userId) {
  return createNotification({
    userId,
    type: 'deposit_confirmed',
    title: 'Deposit Confirmed ✅',
    message: 'Your M-Pesa deposit has been confirmed. You can now proceed to book your session!',
    link: '/my-consultation',
  });
}

function notifyDepositRejected(userId) {
  return createNotification({
    userId,
    type: 'deposit_rejected',
    title: 'Deposit Reference Not Found ⚠️',
    message: 'We could not verify your M-Pesa reference. Please double-check the code and resubmit.',
    link: '/my-consultation',
  });
}

// ── Admin notification wrappers ───────────────────────────────────────────────
// Each one looks up the admin userId first, then fires a notification.

async function notifyAdminNewBooking(customerName, tattooIdea) {
  const adminIds = await getAdminIds();
  return Promise.all(adminIds.map((adminId) =>
    createNotification({
      userId:  adminId,
      type:    'admin_new_booking',
      title:   'New Booking Request 📋',
      message: `${customerName} submitted a new booking request: "${tattooIdea}".`,
      link:    '/admin/bookings',
    })
  ));
}

async function notifyAdminConsultationMessage(customerName) {
  const adminIds = await getAdminIds();
  return Promise.all(adminIds.map((adminId) =>
    createNotification({
      userId:  adminId,
      type:    'admin_consultation_message',
      title:   'New Consultation Message 💬',
      message: `${customerName} sent a message in their consultation.`,
      link:    '/admin/consultations',
    })
  ));
}

async function notifyAdminDepositSubmitted(customerName, depositRef) {
  const adminIds = await getAdminIds();
  return Promise.all(adminIds.map((adminId) =>
    createNotification({
      userId:  adminId,
      type:    'admin_deposit_submitted',
      title:   'Deposit Reference Submitted 💰',
      message: `${customerName} submitted M-Pesa reference: ${depositRef}. Please verify and confirm.`,
      link:    '/admin/consultations',
    })
  ));
}

async function notifyAdminNewReview(customerName, rating) {
  const adminIds = await getAdminIds();
  const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
  return Promise.all(adminIds.map((adminId) =>
    createNotification({
      userId:  adminId,
      type:    'admin_new_review',
      title:   'New Review Posted ⭐',
      message: `${customerName} left a ${rating}-star review (${stars}).`,
      link:    '/admin/reviews',
    })
  ));
}

async function notifyAdminNewDirectMessage(customerName) {
  const adminIds = await getAdminIds();
  return Promise.all(adminIds.map((adminId) =>
    createNotification({
      userId:  adminId,
      type:    'admin_direct_message',
      title:   'New Direct Message 💬',
      message: `${customerName} sent you a direct message.`,
      link:    '/admin/messages',
    })
  ));
}

function notifyCustomerDirectMessageReply(userId) {
  return createNotification({
    userId,
    type:    'direct_message_reply',
    title:   'New Message from His Inks 📩',
    message: 'The studio replied to your message. Tap to read.',
    link:    '/messages',
  });
}

// ── Referral notification ─────────────────────────────────────────────────────
function notifyReferralEligible(userId, commissionAmount) {
  const amount = commissionAmount
    ? `KES ${Number(commissionAmount).toLocaleString('en-KE')}`
    : 'a commission';
  return createNotification({
    userId,
    type:    'referral_commission_eligible',
    title:   'Referral Reward Eligible 🎉',
    message: `Your referral has completed their tattoo and payment. You have earned ${amount} in referral commission. The payment will be processed manually by His Inks.`,
    link:    '/referrals',
  });
}

module.exports = {
  createNotification,
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  // Customer wrappers
  notifyBookingConfirmed,
  notifyBookingCancelled,
  notifyBookingCompleted,
  notifyConsultationReply,
  notifyConsultationAgreed,
  notifyDepositConfirmed,
  notifyDepositRejected,
  // Admin wrappers
  notifyAdminNewBooking,
  notifyAdminConsultationMessage,
  notifyAdminDepositSubmitted,
  notifyAdminNewReview,
  notifyAdminNewDirectMessage,
  // Direct message wrappers
  notifyCustomerDirectMessageReply,
  // Referral wrappers
  notifyReferralEligible,
  clearAdminCache,
};
