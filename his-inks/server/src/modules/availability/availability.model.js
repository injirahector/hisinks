const mongoose = require('mongoose');

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// HH:mm regex — 00:00 through 23:59
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * Convert "HH:mm" to total minutes since midnight for comparison.
 */
function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

const availabilitySchema = new mongoose.Schema(
  {
    dayOfWeek: {
      type: String,
      required: [true, 'Day of week is required'],
      enum: { values: DAYS, message: 'dayOfWeek must be Monday–Sunday' },
      unique: true,
    },

    isOpen: {
      type: Boolean,
      default: true,
    },

    openTime: {
      type: String,
      default: '09:00',
      validate: {
        validator: (v) => TIME_RE.test(v),
        message: 'openTime must be in HH:mm format',
      },
    },

    closeTime: {
      type: String,
      default: '17:00',
      validate: {
        validator: (v) => TIME_RE.test(v),
        message: 'closeTime must be in HH:mm format',
      },
    },

    breakStart: {
      type: String,
      default: null,
      validate: {
        validator: (v) => v === null || v === undefined || TIME_RE.test(v),
        message: 'breakStart must be in HH:mm format or null',
      },
    },

    breakEnd: {
      type: String,
      default: null,
      validate: {
        validator: (v) => v === null || v === undefined || TIME_RE.test(v),
        message: 'breakEnd must be in HH:mm format or null',
      },
    },

    slotDuration: {
      type: Number,
      default: 60,
      min: [15,  'slotDuration must be at least 15 minutes'],
      max: [240, 'slotDuration cannot exceed 240 minutes'],
    },
  },
  {
    timestamps: true,
  }
);

// ── Cross-field validation ─────────────────────────────────────────────────────
availabilitySchema.pre('validate', function (next) {
  // Only validate time logic when the day is open
  if (!this.isOpen) return next();

  // openTime < closeTime
  if (this.openTime && this.closeTime) {
    if (toMinutes(this.openTime) >= toMinutes(this.closeTime)) {
      this.invalidate('openTime', 'openTime must be before closeTime');
      return next();
    }
  }

  // Break: both or neither
  const hasBreakStart = this.breakStart != null && this.breakStart !== '';
  const hasBreakEnd   = this.breakEnd   != null && this.breakEnd   !== '';

  if (hasBreakStart !== hasBreakEnd) {
    this.invalidate('breakStart', 'breakStart and breakEnd must both be provided together');
    return next();
  }

  // Break must fall within working hours
  if (hasBreakStart && hasBreakEnd) {
    const open  = toMinutes(this.openTime);
    const close = toMinutes(this.closeTime);
    const bs    = toMinutes(this.breakStart);
    const be    = toMinutes(this.breakEnd);

    if (bs >= be) {
      this.invalidate('breakStart', 'breakStart must be before breakEnd');
      return next();
    }
    if (bs < open || be > close) {
      this.invalidate('breakStart', 'Break period must fall within working hours');
      return next();
    }
  }

  next();
});

availabilitySchema.statics.DAYS = DAYS;

const Availability = mongoose.model('Availability', availabilitySchema);

module.exports = Availability;
