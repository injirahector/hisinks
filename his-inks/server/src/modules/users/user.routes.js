const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const userController = require('./user.controller');
const { protect, restrictTo } = require('../../middleware/auth.middleware');

// ── Rate limiter for admin delete operations ──────────────────────────────────
// Max 10 deletion attempts per IP per hour.
// Prevents accidental or malicious bulk deletion attempts.
const adminDeleteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many deletion attempts. Please wait an hour and try again.',
  },
});

// GET  /api/users/me          — get own profile
// PATCH /api/users/me         — update own profile
// GET  /api/users/my-bookings — get own bookings
router.get('/me',           protect, userController.getMe);
router.patch('/me',         protect, userController.updateMe);
router.get('/my-bookings',  protect, userController.getMyBookings);

// GET /api/users       — admin only
router.get('/',    protect, restrictTo('admin'), userController.getAllUsers);

// GET /api/users/:id  — admin only
router.get('/:id', protect, restrictTo('admin'), userController.getUserById);

// DELETE /api/users/:id  — admin only, rate limited
// Soft-deletes a customer account on behalf of an administrator.
// Body: { deletionReason?: string }
router.delete(
  '/:id',
  protect,
  restrictTo('admin'),
  adminDeleteLimiter,
  userController.deleteCustomer
);

module.exports = router;
