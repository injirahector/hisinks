const {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} = require('./notification.service');

// GET /api/notifications
// Returns paginated list of notifications for the logged-in user
async function getMyNotificationsHandler(req, res, next) {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));

    const result = await getMyNotifications(req.user._id, { page, limit });

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// GET /api/notifications/unread-count
// Lightweight endpoint polled by the bell badge
async function getUnreadCountHandler(req, res, next) {
  try {
    const count = await getUnreadCount(req.user._id);
    res.status(200).json({ success: true, data: { count } });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/notifications/:id/read
// Mark a single notification as read
async function markAsReadHandler(req, res, next) {
  try {
    const notification = await markAsRead(req.params.id, req.user._id);
    res.status(200).json({ success: true, data: { notification } });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/notifications/read-all
// Mark all of the logged-in user's notifications as read
async function markAllAsReadHandler(req, res, next) {
  try {
    const result = await markAllAsRead(req.user._id);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getMyNotificationsHandler,
  getUnreadCountHandler,
  markAsReadHandler,
  markAllAsReadHandler,
};
