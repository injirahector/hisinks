const express = require('express');
const router = express.Router();
const inspirationController = require('./inspiration.controller');
const { protect, restrictTo } = require('../../middleware/auth.middleware');

// ── Public routes ──────────────────────────────────────────────────────────────
// GET /api/inspirations           — list published inspirations
router.get('/', inspirationController.getPublicInspirations);

// GET /api/inspirations/categories — list all categories
router.get('/categories', inspirationController.getCategories);

// GET /api/inspirations/:id       — get single published inspiration
router.get('/:id', inspirationController.getPublicInspirationById);

module.exports = router;
