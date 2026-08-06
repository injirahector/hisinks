const express = require('express');
const router = express.Router();
const tattooController = require('./tattoo.controller');
const { protect, restrictTo } = require('../../middleware/auth.middleware');

// ── Public routes ─────────────────────────────────────────────────────────────
router.get('/',    tattooController.getAllTattoos);
router.get('/:id', tattooController.getTattooById);

// ── Admin-only routes ─────────────────────────────────────────────────────────
router.post(  '/',    protect, restrictTo('admin'), tattooController.createTattoo);
router.patch( '/:id', protect, restrictTo('admin'), tattooController.updateTattoo);
router.delete('/:id', protect, restrictTo('admin'), tattooController.deleteTattoo);

module.exports = router;
