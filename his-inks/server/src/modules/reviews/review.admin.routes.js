const express = require('express');
const router  = express.Router();
const ctrl    = require('./review.controller');
const { protect, restrictTo } = require('../../middleware/auth.middleware');

// ── Admin routes ─────────────────────────────────────────────────────────────
// All routes here require admin authentication
router.get('/',                    protect, restrictTo('admin'), ctrl.getAllReviews);
router.patch('/:id/reply',         protect, restrictTo('admin'), ctrl.replyToReview);
router.patch('/:id/visibility',    protect, restrictTo('admin'), ctrl.toggleVisibility);

module.exports = router;
