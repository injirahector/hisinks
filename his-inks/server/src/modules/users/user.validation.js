const validator = require('validator');

// ── Profile update validation ─────────────────────────────────────────────────
// Customers and admin can update the same set of profile fields.
function validateProfileUpdate(data) {
  const errors = {};

  if (data.firstName !== undefined) {
    const v = (data.firstName || '').trim();
    if (!v) errors.firstName = 'First name cannot be empty.';
    else if (v.length > 50) errors.firstName = 'First name cannot exceed 50 characters.';
  }

  if (data.lastName !== undefined) {
    const v = (data.lastName || '').trim();
    if (!v) errors.lastName = 'Last name cannot be empty.';
    else if (v.length > 50) errors.lastName = 'Last name cannot exceed 50 characters.';
  }

  if (data.phone !== undefined && data.phone !== '') {
    if (!validator.isMobilePhone(String(data.phone), 'any', { strictMode: false })) {
      errors.phone = 'Please provide a valid phone number.';
    }
  }

  if (data.bio !== undefined && data.bio.length > 500) {
    errors.bio = 'Bio cannot exceed 500 characters.';
  }

  if (data.location !== undefined && data.location.length > 100) {
    errors.location = 'Location cannot exceed 100 characters.';
  }

  return { errors, isValid: Object.keys(errors).length === 0 };
}

module.exports = { validateProfileUpdate };
