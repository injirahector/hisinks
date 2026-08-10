const validator = require('validator');

// ── Register ──────────────────────────────────────────────────────────────────
// All public registrations create customer accounts.
// Admin accounts are created directly in the database by the studio owner.
function validateRegister(data) {
  const errors = {};

  const firstName = (data.firstName || '').trim();
  const lastName  = (data.lastName  || '').trim();
  const email     = (data.email     || '').trim();
  const phone     = (data.phone     || '').trim();
  const password  = (data.password  || '');

  if (!firstName) errors.firstName = 'First name is required.';
  else if (firstName.length > 50) errors.firstName = 'First name cannot exceed 50 characters.';

  if (!lastName) errors.lastName = 'Last name is required.';
  else if (lastName.length > 50) errors.lastName = 'Last name cannot exceed 50 characters.';

  if (!email) {
    errors.email = 'Email is required.';
  } else if (!validator.isEmail(email)) {
    errors.email = 'Please provide a valid email address.';
  }

  if (phone && !validator.isMobilePhone(phone, 'any', { strictMode: false })) {
    errors.phone = 'Please provide a valid phone number.';
  }

  if (!password) {
    errors.password = 'Password is required.';
  } else if (password.length < 8) {
    errors.password = 'Password must be at least 8 characters.';
  } else if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    errors.password = 'Password must contain at least one letter and one number.';
  }

  return { errors, isValid: Object.keys(errors).length === 0 };
}

// ── Login ─────────────────────────────────────────────────────────────────────
function validateLogin(data) {
  const errors = {};

  const email    = (data.email    || '').trim();
  const password = (data.password || '');

  if (!email) {
    errors.email = 'Email is required.';
  } else if (!validator.isEmail(email)) {
    errors.email = 'Please provide a valid email address.';
  }

  if (!password) {
    errors.password = 'Password is required.';
  }

  return { errors, isValid: Object.keys(errors).length === 0 };
}

// ── Forgot Password ───────────────────────────────────────────────────────────
function validateForgotPassword(data) {
  const errors = {};
  const email = (data.email || '').trim();

  if (!email) {
    errors.email = 'Email is required.';
  } else if (!validator.isEmail(email)) {
    errors.email = 'Please provide a valid email address.';
  }

  return { errors, isValid: Object.keys(errors).length === 0 };
}

// ── Reset Password ────────────────────────────────────────────────────────────
function validateResetPassword(data) {
  const errors = {};
  const token    = (data.token    || '').trim();
  const password = (data.password || '');
  const confirm  = (data.confirmPassword || '');

  if (!token) {
    errors.token = 'Reset token is required.';
  }

  if (!password) {
    errors.password = 'Password is required.';
  } else if (password.length < 8) {
    errors.password = 'Password must be at least 8 characters.';
  } else if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    errors.password = 'Password must contain at least one letter and one number.';
  }

  // confirmPassword is optional — only validate if provided
  if (confirm && confirm !== password) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  return { errors, isValid: Object.keys(errors).length === 0 };
}

module.exports = { validateRegister, validateLogin, validateForgotPassword, validateResetPassword };
