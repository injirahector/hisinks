const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 12;

// ── User schema ───────────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    // Password is only required for local (email/password) accounts.
    // Google-authenticated users have no password — authProvider differentiates them.
    password: {
      type: String,
      required: false,
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },

    // ── OAuth / social login fields ────────────────────────────────────────
    // 'local'  — registered with email + password
    // 'google' — registered / logged in via Google OAuth
    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },

    // Google's unique user ID — used to look up returning Google users.
    googleId: {
      type: String,
      unique: true,
      sparse: true,  // allows null for local accounts; only indexed when present
      index: true,
    },

    // Two roles only:
    //   customer — can browse tattoos and create bookings
    //   admin    — the studio owner; manages tattoos, bookings, and studio info
    role: {
      type: String,
      enum: {
        values: ['customer', 'admin'],
        message: 'Role must be customer or admin',
      },
      default: 'customer',
    },

    // ── Profile fields ─────────────────────────────────────────────────────
    profileImage: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
      default: null,
    },
    location: {
      type: String,
      trim: true,
      maxlength: [100, 'Location cannot exceed 100 characters'],
      default: null,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    // ── Referral fields ────────────────────────────────────────────────────
    // Unique short code that this customer can share (e.g. "HECTOR7K").
    // Generated once on account creation; permanent unless explicitly changed.
    referralCode: {
      type: String,
      unique: true,
      sparse: true,  // allows null for admin accounts and legacy rows during migration
      trim: true,
      uppercase: true,
      index: true,
    },

    // The User._id of the customer who referred this person.
    // Set once at registration time; never changed afterwards.
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // ── Password reset fields ──────────────────────────────────────────────
    // SHA-256 hash of the one-time reset token.
    // The raw token is ONLY sent to the user's email — never stored.
    // select: false so it is never returned in normal queries.
    passwordResetToken: {
      type: String,
      select: false,
    },

    // Expiry timestamp for the reset token.
    // Set to Date.now() + PASSWORD_RESET_EXPIRES_MINUTES (default 15 min).
    passwordResetExpires: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// ── Pre-save hook: hash password ──────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
  next();
});

// ── Instance method: compare password ────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ── Instance method: safe public object (no password) ────────────────────────
userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

// ── Static: find by email with password included ──────────────────────────────
userSchema.statics.findByEmailWithPassword = function (email) {
  return this.findOne({ email: email.toLowerCase().trim() }).select('+password');
};

const User = mongoose.model('User', userSchema);

module.exports = User;
