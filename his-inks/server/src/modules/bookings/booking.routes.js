const express = require('express');
const router = express.Router();
const bookingController = require('./booking.controller');
const { protect, restrictTo } = require('../../middleware/auth.middleware');

// ── Optional auth middleware ───────────────────────────────────────────────────
// Attaches req.user if a valid token is present, but does NOT block the request
// if there is no token. Used so logged-in customers get userId attached to bookings.
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token =
    (authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null) ||
    (req.cookies && req.cookies.token ? req.cookies.token : null);

  if (!token) return next(); // guest — no user attached, that's fine

  const { verifyToken } = require('../../utils/jwt.utils');
  const User = require('../users/user.model');

  try {
    const decoded = verifyToken(token);
    User.findById(decoded.id)
      .then((user) => {
        if (user) req.user = user;
        next();
      })
      .catch(() => next());
  } catch {
    next(); // invalid token — treat as guest
  }
}

// ── Public (guests allowed, token optional) ───────────────────────────────────
router.post('/', optionalAuth, bookingController.createBooking);

// ── Admin only ────────────────────────────────────────────────────────────────
router.get( '/',            protect, restrictTo('admin'), bookingController.getAllBookings);
router.get( '/:id',         protect, restrictTo('admin'), bookingController.getBookingById);
router.patch('/:id/status', protect, restrictTo('admin'), bookingController.updateBookingStatus);
router.delete('/:id',       protect, restrictTo('admin'), bookingController.deleteBooking);

module.exports = router;
