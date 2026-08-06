const availabilityService = require('./availability.service');
const {
  validateUpdateDay,
  validateDateParam,
  validateDayParam,
} = require('./availability.validation');

// ── GET /api/availability  (public) ──────────────────────────────────────────
/**
 * Returns the full weekly schedule (all 7 days), sorted Monday → Sunday.
 */
async function getSchedule(req, res, next) {
  try {
    const schedule = await availabilityService.getSchedule();
    return res.status(200).json({
      success: true,
      count: schedule.length,
      data: { schedule },
    });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/availability/slots?date=YYYY-MM-DD  (public) ────────────────────
/**
 * Returns available time slots for a specific date.
 * Closed days return { isOpen: false, slots: [] }.
 */
async function getAvailableSlots(req, res, next) {
  try {
    const { error } = validateDateParam(req.query.date);
    if (error) {
      return res.status(422).json({ success: false, message: error });
    }

    const result = await availabilityService.generateAvailableSlots(req.query.date);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// ── PATCH /api/availability/:day  (admin only) ────────────────────────────────
/**
 * Updates a single day's availability settings.
 * :day is case-insensitive (e.g. "monday", "Monday", "MONDAY" all work).
 */
async function updateDay(req, res, next) {
  try {
    // Validate and normalise day name
    const { error: dayError, day } = validateDayParam(req.params.day);
    if (dayError) {
      return res.status(422).json({ success: false, message: dayError });
    }

    // Validate request body fields
    const { errors, isValid } = validateUpdateDay(req.body);
    if (!isValid) {
      return res.status(422).json({ success: false, errors });
    }

    const updated = await availabilityService.updateDay(day, req.body);
    return res.status(200).json({
      success: true,
      message: `${day} availability updated.`,
      data: { day: updated },
    });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/availability/month?year=YYYY&month=MM  (public) ─────────────────
/**
 * Returns a date-keyed map of availability for every day in the month.
 * Values: "available" | "booked" | "closed" | "past"
 */
async function getMonthAvailability(req, res, next) {
  try {
    const now          = new Date();
    const yearParam    = req.query.year;
    const monthParam   = req.query.month;

    // Default to current month if not provided
    const year  = yearParam  ? parseInt(yearParam,  10) : now.getFullYear();
    const month = monthParam ? parseInt(monthParam, 10) : now.getMonth() + 1;

    if (isNaN(year) || year < 2000 || year > 2100) {
      return res.status(422).json({ success: false, message: 'year must be a number between 2000 and 2100.' });
    }
    if (isNaN(month) || month < 1 || month > 12) {
      return res.status(422).json({ success: false, message: 'month must be a number between 1 and 12.' });
    }

    const data = await availabilityService.getMonthAvailability(year, month);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

module.exports = { getSchedule, getAvailableSlots, getMonthAvailability, updateDay };
