const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const authController = require('./auth.controller');
const { protect } = require('../../middleware/auth.middleware');

// ── Rate limiters ─────────────────────────────────────────────────────────────
// Forgot password: max 5 requests per IP per 15 minutes.
// Prevents abuse of the email-sending endpoint without locking out real users.
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many password reset requests. Please wait 15 minutes and try again.',
  },
});

// Reset password: max 10 attempts per IP per 15 minutes.
// Token validation is fast; this prevents brute-forcing token guesses.
const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many attempts. Please wait 15 minutes and try again.',
  },
});

// Account deletion rate limiter: max 5 attempts per IP per hour.
// Prevents brute-force password guessing through the deletion endpoint.
const deleteAccountLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many account deletion attempts. Please wait an hour and try again.',
  },
});

// POST /api/auth/register
router.post('/register', authController.register);

// POST /api/auth/login
router.post('/login', authController.login);

// POST /api/auth/google  — Google Identity Services token verification
router.post('/google', authController.googleAuth);

// GET /api/auth/me  — protected
router.get('/me', protect, authController.getMe);

// POST /api/auth/logout
router.post('/logout', authController.logout);

// POST /api/auth/forgot-password  — no auth required; rate limited
router.post('/forgot-password', forgotPasswordLimiter, authController.forgotPassword);

// POST /api/auth/reset-password  — no auth required; rate limited
router.post('/reset-password', resetPasswordLimiter, authController.resetPassword);

// DELETE /api/auth/account  — protected, customer only, rate limited
// Body: { confirmation: 'DELETE', password?: string }
// Identity comes from the verified JWT — client-supplied IDs are never trusted.
const { restrictTo } = require('../../middleware/auth.middleware');
router.delete(
  '/account',
  protect,
  restrictTo('customer'),
  deleteAccountLimiter,
  authController.deleteAccount
);

module.exports = router;
