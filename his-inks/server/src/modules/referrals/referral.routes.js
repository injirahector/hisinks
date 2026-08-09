/**
 * referral.routes.js — customer-facing endpoints
 *
 * All routes require the customer to be authenticated.
 * Mounted at: /api/referrals
 */

const express = require('express');
const { protect } = require('../../middleware/auth.middleware');
const { getMyCode, getMyReferrals } = require('./referral.controller');

const router = express.Router();

// GET /api/referrals/my-code   → referral code + shareable link + commission rate
router.get('/my-code', protect, getMyCode);

// GET /api/referrals/me        → full referral list + stats for the logged-in customer
router.get('/me', protect, getMyReferrals);

module.exports = router;
