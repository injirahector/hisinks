const express = require('express');

const router                 = express.Router();
const availabilityController = require('./availability.controller');
const { protect, restrictTo }= require('../../middleware/auth.middleware');

// ── Public routes ─────────────────────────────────────────────────────────────

// GET /api/availability — full weekly schedule
router.get('/', availabilityController.getSchedule);

// GET /api/availability/slots?date=YYYY-MM-DD — available slots for a date
// MUST be declared before /:day to prevent Express matching "slots" as a day param
router.get('/slots', availabilityController.getAvailableSlots);

// GET /api/availability/month?year=YYYY&month=MM — full month availability map
// MUST also be declared before /:day
router.get('/month', availabilityController.getMonthAvailability);

// ── Admin-only routes ─────────────────────────────────────────────────────────

// PATCH /api/availability/:day — update a single day's settings
router.patch('/:day', protect, restrictTo('admin'), availabilityController.updateDay);

module.exports = router;
