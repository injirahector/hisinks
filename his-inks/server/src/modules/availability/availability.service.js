const Availability = require('./availability.model');
const Booking      = require('../bookings/booking.model');

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Convert "HH:mm" to total minutes since midnight. */
function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/** Convert total minutes back to "HH:mm". */
function toHHMM(minutes) {
  const h = Math.floor(minutes / 60).toString().padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

/** Return the day-of-week name for a given Date object (local time). */
function getDayName(date) {
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][
    date.getDay()
  ];
}

// ── Default schedule data ─────────────────────────────────────────────────────

const DEFAULT_SCHEDULE = [
  { dayOfWeek: 'Monday',    isOpen: true,  openTime: '09:00', closeTime: '17:00', breakStart: '13:00', breakEnd: '14:00', slotDuration: 60 },
  { dayOfWeek: 'Tuesday',   isOpen: true,  openTime: '09:00', closeTime: '17:00', breakStart: '13:00', breakEnd: '14:00', slotDuration: 60 },
  { dayOfWeek: 'Wednesday', isOpen: true,  openTime: '09:00', closeTime: '17:00', breakStart: '13:00', breakEnd: '14:00', slotDuration: 60 },
  { dayOfWeek: 'Thursday',  isOpen: true,  openTime: '09:00', closeTime: '17:00', breakStart: '13:00', breakEnd: '14:00', slotDuration: 60 },
  { dayOfWeek: 'Friday',    isOpen: true,  openTime: '09:00', closeTime: '17:00', breakStart: '13:00', breakEnd: '14:00', slotDuration: 60 },
  { dayOfWeek: 'Saturday',  isOpen: true,  openTime: '10:00', closeTime: '15:00', breakStart: null,    breakEnd: null,    slotDuration: 60 },
  { dayOfWeek: 'Sunday',    isOpen: true,  openTime: '09:00', closeTime: '17:00', breakStart: '13:00', breakEnd: '14:00', slotDuration: 60 },
];

// ── Service functions ─────────────────────────────────────────────────────────

/**
 * Seed the default weekly schedule if the collection is empty.
 * Safe to call on every server start — no-ops when data already exists.
 */
async function initializeDefaultSchedule() {
  const count = await Availability.countDocuments();
  if (count > 0) {
    console.log('📅  Availability schedule already exists — skipping seed.');
    return;
  }
  await Availability.insertMany(DEFAULT_SCHEDULE);
  console.log('📅  Default availability schedule initialized.');
}

/**
 * Return all 7 days sorted Monday → Sunday.
 */
async function getSchedule() {
  const ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const days = await Availability.find().lean();
  return days.sort((a, b) => ORDER.indexOf(a.dayOfWeek) - ORDER.indexOf(b.dayOfWeek));
}

/**
 * Update a single day's availability settings.
 *
 * Loads the existing record first, merges the patch onto it, then calls
 * validate() + save() so Mongoose cross-field rules run against the fully
 * merged state — not just the partial patch body.
 */
async function updateDay(dayOfWeek, updates) {
  const ALLOWED = ['isOpen', 'openTime', 'closeTime', 'breakStart', 'breakEnd', 'slotDuration'];
  const filtered = {};
  ALLOWED.forEach((k) => {
    if (updates[k] !== undefined) filtered[k] = updates[k];
  });

  const existing = await Availability.findOne({ dayOfWeek });
  if (!existing) {
    const err = new Error(`No availability record found for ${dayOfWeek}.`);
    err.statusCode = 404;
    throw err;
  }

  // Merge updates onto the Mongoose document
  Object.assign(existing, filtered);

  try {
    // Run full Mongoose validation (triggers pre('validate') with merged values)
    await existing.validate();
  } catch (validationErr) {
    validationErr.statusCode = 422;
    throw validationErr;
  }

  const saved = await existing.save();
  return saved;
}

/**
 * Generate all available time slots for a given date string (YYYY-MM-DD).
 *
 * Algorithm:
 * 1. Determine the day-of-week name for the given date.
 * 2. Load that day's availability config from the DB.
 * 3. Build all slots from openTime → closeTime in slotDuration increments,
 *    skipping any slot that fully or partially overlaps the break window.
 * 4. Query existing bookings for that calendar date whose status is
 *    'pending' or 'confirmed' (the only "active" statuses in the system).
 * 5. Remove slots whose start time is already taken by a booking.
 */
async function generateAvailableSlots(dateStr) {
  // Parse the date as a local date
  const [year, month, day] = dateStr.split('-').map(Number);
  const date    = new Date(year, month - 1, day);
  const dayName = getDayName(date);

  // Load availability config for this day of week
  const config = await Availability.findOne({ dayOfWeek: dayName });
  if (!config) {
    const err = new Error(`No availability config found for ${dayName}.`);
    err.statusCode = 404;
    throw err;
  }

  if (!config.isOpen) {
    return {
      date:      dateStr,
      dayOfWeek: dayName,
      isOpen:    false,
      slots:     [],
    };
  }

  const open     = toMinutes(config.openTime);
  const close    = toMinutes(config.closeTime);
  const duration = config.slotDuration;

  const breakStart = config.breakStart ? toMinutes(config.breakStart) : null;
  const breakEnd   = config.breakEnd   ? toMinutes(config.breakEnd)   : null;

  // Build all possible slots, skipping those that overlap the break window
  const allSlots = [];
  for (let start = open; start + duration <= close; start += duration) {
    const end = start + duration;

    if (breakStart !== null && breakEnd !== null) {
      // Slot overlaps break if it starts before breakEnd AND ends after breakStart
      const overlapsBreak = start < breakEnd && end > breakStart;
      if (overlapsBreak) continue;
    }

    allSlots.push({ start: toHHMM(start), end: toHHMM(end) });
  }

  // Build UTC date range for the booking query (entire calendar day)
  const dayStart = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  const dayEnd   = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

  // ONE CUSTOMER PER DAY rule:
  // Since only agreed-consultation customers can book, any pending, confirmed,
  // or completed booking permanently blocks the day — completed sessions still
  // occupied that date and should not be re-opened for new bookings.
  const activeBookingCount = await Booking.countDocuments({
    preferredDate: { $gte: dayStart, $lte: dayEnd },
    status:        { $in: ['pending', 'confirmed', 'completed'] },
  });

  if (activeBookingCount > 0) {
    return {
      date:        dateStr,
      dayOfWeek:   dayName,
      isOpen:      true,
      fullyBooked: true,
      slots:       [],
    };
  }

  return {
    date:         dateStr,
    dayOfWeek:    dayName,
    isOpen:       true,
    fullyBooked:  false,
    openTime:     config.openTime,
    closeTime:    config.closeTime,
    breakStart:   config.breakStart || null,
    breakEnd:     config.breakEnd   || null,
    slotDuration: config.slotDuration,
    totalSlots:   allSlots.length,
    bookedCount:  0,
    slots:        allSlots,
  };
}

/**
 * Return availability status for every day in a given month.
 *
 * Response shape — a plain object keyed by "YYYY-MM-DD":
 *   "closed"    — day-of-week is marked isOpen:false in the schedule
 *   "booked"    — open day but already has an active (pending/confirmed) booking
 *   "available" — open day with no active booking
 *   "past"      — date is in the past (before today)
 *
 * Only dates from today onward show real availability; past dates are "past".
 */
async function getMonthAvailability(year, month) {
  // Load full weekly schedule once
  const schedule = await Availability.find().lean();
  const scheduleMap = {};
  schedule.forEach((d) => { scheduleMap[d.dayOfWeek] = d; });

  // Day names indexed Sunday=0 … Saturday=6 (matches Date.getDay())
  const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // How many days in this month?
  const daysInMonth = new Date(year, month, 0).getDate(); // month is 1-based here

  // Today's date string for "past" comparison
  const now       = new Date();
  const todayStr  = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // Build UTC range covering the entire month for a single booking query
  const monthStart = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
  const monthEnd   = new Date(Date.UTC(year, month - 1, daysInMonth, 23, 59, 59, 999));

  // ONE CUSTOMER PER DAY rule: pending, confirmed, AND completed bookings all
  // block the date — a completed session still occupied that day historically
  // and should never be re-opened for new bookings.
  const activeBookings = await Booking.find({
    preferredDate: { $gte: monthStart, $lte: monthEnd },
    status:        { $in: ['pending', 'confirmed', 'completed'] },
  }).select('preferredDate').lean();

  // Build a Set of date strings that already have a booking e.g. "2026-08-10"
  const bookedDates = new Set(
    activeBookings.map((b) => {
      const d = new Date(b.preferredDate);
      return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
    })
  );

  // Build the result map
  const result = {};
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr   = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayOfWeek = DAY_NAMES[new Date(year, month - 1, day).getDay()];
    const config    = scheduleMap[dayOfWeek];

    if (dateStr < todayStr) {
      result[dateStr] = 'past';
    } else if (!config || !config.isOpen) {
      result[dateStr] = 'closed';
    } else if (bookedDates.has(dateStr)) {
      result[dateStr] = 'booked';
    } else {
      result[dateStr] = 'available';
    }
  }

  return result;
}

module.exports = {
  initializeDefaultSchedule,
  getSchedule,
  updateDay,
  generateAvailableSlots,
  getMonthAvailability,
};
