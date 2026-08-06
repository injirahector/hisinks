const express = require('express');
const router  = express.Router();
const ctrl    = require('./review.controller');
const { protect, restrictTo } = require('../../middleware/auth.middleware');

// ── Public routes ─────────────────────────────────────────────────────────────
// NOTE: /stats, /featured, /me must be declared BEFORE /:id to prevent
// Express matching them as the :id param.
router.get('/stats',    ctrl.getReviewStats);
router.get('/featured', ctrl.getFeaturedReviews);
router.get('/',         ctrl.getPublicReviews);

// ── Customer routes (authenticated) ──────────────────────────────────────────
router.post('/',     protect, restrictTo('customer'), ctrl.createReview);
router.get('/me',    protect, ctrl.getMyReviews);
router.patch('/:id', protect, restrictTo('customer'), ctrl.updateMyReview);
router.delete('/:id',protect, restrictTo('customer'), ctrl.deleteMyReview);

module.exports = router;
