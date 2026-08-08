const express = require('express');
const { protect, restrictTo } = require('../../middleware/auth.middleware');
const ctrl = require('./message.controller');

const router = express.Router();

// All message routes require authentication
router.use(protect);

// ── Customer routes ───────────────────────────────────────────────────────────
router.get('/my',           ctrl.getMyThread);
router.post('/my',          ctrl.customerSendMessage);
router.patch('/my/read',    ctrl.customerMarkRead);

// ── Admin routes ──────────────────────────────────────────────────────────────
router.get('/unread-count', restrictTo('admin'), ctrl.getAdminUnreadCount);
router.get('/',             restrictTo('admin'), ctrl.getAllThreads);
router.get('/:id',          restrictTo('admin'), ctrl.getThreadById);
router.post('/:id/reply',   restrictTo('admin'), ctrl.adminSendMessage);
router.patch('/:id/read',   restrictTo('admin'), ctrl.adminMarkRead);

module.exports = router;
