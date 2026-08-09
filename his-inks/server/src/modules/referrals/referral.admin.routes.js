/**
 * referral.admin.routes.js — admin-only endpoints
 *
 * All routes require authentication AND the 'admin' role.
 * Mounted at: /api/admin/referrals
 */

const express = require('express');
const { protect, restrictTo } = require('../../middleware/auth.middleware');
const { getAllReferrals, markAsPaid } = require('./referral.controller');

const router = express.Router();

// Every route in this file is admin-only
router.use(protect, restrictTo('admin'));

// GET  /api/admin/referrals          → paginated list + summary stats
router.get('/', getAllReferrals);

// PATCH /api/admin/referrals/:id/pay → mark eligible referral as manually paid
router.patch('/:id/pay', markAsPaid);

module.exports = router;
