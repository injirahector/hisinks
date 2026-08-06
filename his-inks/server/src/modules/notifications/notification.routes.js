const { Router } = require('express');
const { protect } = require('../../middleware/auth.middleware');
const {
  getMyNotificationsHandler,
  getUnreadCountHandler,
  markAsReadHandler,
  markAllAsReadHandler,
} = require('./notification.controller');

const router = Router();

// All notification routes require authentication
router.use(protect);

// GET  /api/notifications              — paginated notification list
router.get('/', getMyNotificationsHandler);

// GET  /api/notifications/unread-count — badge count (polled by frontend)
router.get('/unread-count', getUnreadCountHandler);

// PATCH /api/notifications/read-all   — mark every notification as read
// NOTE: This route must come before /:id to avoid "read-all" being parsed as an id
router.patch('/read-all', markAllAsReadHandler);

// PATCH /api/notifications/:id/read   — mark one notification as read
router.patch('/:id/read', markAsReadHandler);

module.exports = router;
