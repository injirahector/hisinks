const express = require('express');
const router = express.Router();
const inspirationController = require('./inspiration.controller');
const { protect, restrictTo } = require('../../middleware/auth.middleware');

// ── Admin routes ───────────────────────────────────────────────────────────────
// GET /api/admin/inspirations     — list all inspirations (admin only)
router.get(
  '/',
  protect,
  restrictTo('admin'),
  inspirationController.getAllInspirations
);

// POST /api/admin/inspirations    — create inspiration (admin only)
router.post(
  '/',
  protect,
  restrictTo('admin'),
  inspirationController.createInspirationAdmin
);

// PATCH /api/admin/inspirations/reorder — reorder inspirations (admin only)
// IMPORTANT: Must be defined BEFORE /:id routes so Express does not treat
// the literal string "reorder" as a Mongo document ID.
router.patch(
  '/reorder',
  protect,
  restrictTo('admin'),
  inspirationController.reorderInspirationsAdmin
);

// GET /api/admin/inspirations/:id — get single inspiration (admin only)
router.get(
  '/:id',
  protect,
  restrictTo('admin'),
  inspirationController.getInspirationById
);

// PATCH /api/admin/inspirations/:id — update inspiration (admin only)
router.patch(
  '/:id',
  protect,
  restrictTo('admin'),
  inspirationController.updateInspirationAdmin
);

// DELETE /api/admin/inspirations/:id — delete inspiration (admin only)
router.delete(
  '/:id',
  protect,
  restrictTo('admin'),
  inspirationController.deleteInspirationAdmin
);

// PATCH /api/admin/inspirations/:id/publish — toggle publish (admin only)
router.patch(
  '/:id/publish',
  protect,
  restrictTo('admin'),
  inspirationController.togglePublishInspirationAdmin
);

module.exports = router;
