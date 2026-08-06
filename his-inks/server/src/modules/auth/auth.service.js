const User = require('../users/user.model');
const { generateToken } = require('../../utils/jwt.utils');

/**
 * Builds the standard auth response payload.
 */
function buildAuthResponse(user) {
  const token = generateToken({ id: user._id, role: user.role });
  return { user: user.toSafeObject(), token };
}

// ── Register ──────────────────────────────────────────────────────────────────
// Public registration always creates a customer account.
// The admin account is managed directly by the studio owner.
async function register({ firstName, lastName, email, phone, password }) {
  // Duplicate email check
  const existingEmail = await User.findOne({ email: email.toLowerCase().trim() });
  if (existingEmail) {
    const err = new Error('An account with this email already exists.');
    err.statusCode = 409;
    throw err;
  }

  // Duplicate phone check
  if (phone) {
    const existingPhone = await User.findOne({ phone: phone.trim() });
    if (existingPhone) {
      const err = new Error('An account with this phone number already exists.');
      err.statusCode = 409;
      throw err;
    }
  }

  const user = await User.create({
    firstName: firstName.trim(),
    lastName:  lastName.trim(),
    email:     email.toLowerCase().trim(),
    phone:     phone ? phone.trim() : undefined,
    password,  // hashed by pre-save hook
    role:      'customer',
  });

  return buildAuthResponse(user);
}

// ── Login ─────────────────────────────────────────────────────────────────────
async function login({ email, password }) {
  const user = await User.findByEmailWithPassword(email);

  if (!user) {
    const err = new Error('Invalid email or password.');
    err.statusCode = 401;
    throw err;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    const err = new Error('Invalid email or password.');
    err.statusCode = 401;
    throw err;
  }

  return buildAuthResponse(user);
}

// ── Get current user ──────────────────────────────────────────────────────────
async function getMe(userId) {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error('User not found.');
    err.statusCode = 404;
    throw err;
  }
  return user.toSafeObject();
}

module.exports = { register, login, getMe };
