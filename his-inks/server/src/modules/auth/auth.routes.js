const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const { protect } = require('../../middleware/auth.middleware');

// POST /api/auth/register
router.post('/register', authController.register);

// POST /api/auth/login
router.post('/login', authController.login);

// GET /api/auth/me  — protected
router.get('/me', protect, authController.getMe);

// POST /api/auth/logout
router.post('/logout', authController.logout);

module.exports = router;
