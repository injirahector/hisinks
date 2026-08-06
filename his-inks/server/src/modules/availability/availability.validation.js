const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// HH:mm regex — 00:00 through 23:59
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Validate PATCH /api/availability/:day body.
 * All fields are optional — only validate what is provided.
 * Cross-field rules are applied only when both values in a pair are present in
 * the body (the service layer merges with DB values for full validation).
 */
function validateUpdateDay(body) {
  const errors = {};

  const { isOpen, openTime, closeTime, breakStart, breakEnd, slotDuration } = body;

  // isOpen — must be a boolean (not just truthy/falsy)
  if (isOpen !== undefined && typeof isOpen !== 'boolean') {
    errors.isOpen = 'isOpen must be a boolean.';
  }

  // openTime
  if (openTime !== undefined && !TIME_RE.test(openTime)) {
    errors.openTime = 'openTime must be in HH:mm format (e.g. 09:00).';
  }

  // closeTime
  if (closeTime !== undefined && !TIME_RE.test(closeTime)) {
    errors.closeTime = 'closeTime must be in HH:mm format (e.g. 17:00).';
  }

  // breakStart — null is explicitly allowed (to clear a break)
  if (breakStart !== undefined && breakStart !== null && !TIME_RE.test(breakStart)) {
    errors.breakStart = 'breakStart must be in HH:mm format or null.';
  }

  // breakEnd — null is explicitly allowed
  if (breakEnd !== undefined && breakEnd !== null && !TIME_RE.test(breakEnd)) {
    errors.breakEnd = 'breakEnd must be in HH:mm format or null.';
  }

  // slotDuration — integer 15–240
  if (slotDuration !== undefined) {
    const n = Number(slotDuration);
    if (!Number.isInteger(n) || n < 15 || n > 240) {
      errors.slotDuration = 'slotDuration must be an integer between 15 and 240 minutes.';
    }
  }

  // ── Cross-field checks ──────────────────────────────────────────────────────
  // Only run if no field-level errors so messages are not stacked
  if (Object.keys(errors).length === 0) {
    // openTime < closeTime (only when both are present in this request)
    if (openTime && closeTime) {
      if (toMinutes(openTime) >= toMinutes(closeTime)) {
        errors.openTime = 'openTime must be before closeTime.';
      }
    }

    // Break: both or neither (only when at least one is present in this request)
    const bsPresent = breakStart !== undefined;
    const bePresent = breakEnd   !== undefined;
    if (bsPresent || bePresent) {
      const hasBS = breakStart != null && breakStart !== '';
      const hasBE = breakEnd   != null && breakEnd   !== '';
      if (hasBS !== hasBE) {
        errors.breakStart = 'breakStart and breakEnd must both be provided together.';
      }

      // Break within hours (only if both break and hours are in this request)
      if (hasBS && hasBE && openTime && closeTime) {
        const open  = toMinutes(openTime);
        const close = toMinutes(closeTime);
        const bs    = toMinutes(breakStart);
        const be    = toMinutes(breakEnd);

        if (bs >= be) {
          errors.breakStart = 'breakStart must be before breakEnd.';
        } else if (bs < open || be > close) {
          errors.breakStart = 'Break period must fall within working hours.';
        }
      }
    }
  }

  return { errors, isValid: Object.keys(errors).length === 0 };
}

/**
 * Validate the ?date= query param for slot generation.
 * Returns { error: string | null }.
 */
function validateDateParam(dateStr) {
  if (!dateStr) {
    return { error: 'date query parameter is required (YYYY-MM-DD).' };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return { error: 'date must be in YYYY-MM-DD format.' };
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    return { error: 'date is not a valid calendar date.' };
  }
  return { error: null };
}

/**
 * Validate the :day route parameter.
 * Normalises capitalisation and returns the canonical day name.
 * Returns { error: string | null, day?: string }.
 */
function validateDayParam(day) {
  if (!day) return { error: 'Day parameter is required.' };
  const capitalised = day.charAt(0).toUpperCase() + day.slice(1).toLowerCase();
  if (!DAYS.includes(capitalised)) {
    return { error: `Day must be one of: ${DAYS.join(', ')}.` };
  }
  return { error: null, day: capitalised };
}

module.exports = { validateUpdateDay, validateDateParam, validateDayParam };
