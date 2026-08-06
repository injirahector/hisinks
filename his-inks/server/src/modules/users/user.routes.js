const express = require('express');
const router = express.Router();
const userController = require('./user.controller');
const { protect, restrictTo } = require('../../middleware/auth.middleware');

// GET  /api/users/me          — get own profile
// PATCH /api/users/me         — update own profile
// GET  /api/users/my-bookings — get own bookings
router.get('/me',           protect, userController.getMe);
router.patch('/me',         protect, userController.updateMe);
router.get('/my-bookings',  protect, userController.getMyBookings);

// GET /api/users       — admin only
router.get('/',    protect, restrictTo('admin'), userController.getAllUsers);

// GET /api/users/:id
router.get('/:id', protect, userController.getUserById);

module.exports = router;
