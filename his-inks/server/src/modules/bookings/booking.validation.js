const validator = require('validator');

const VALID_SIZES = ['Small', 'Medium', 'Large', 'Extra Large', 'Full Sleeve', 'Half Sleeve'];
const VALID_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'];

// ── Create booking validation ─────────────────────────────────────────────────
function validateCreateBooking(data) {
  const errors = {};

  const customerName  = (data.customerName  || '').trim();
  const phone         = (data.phone         || '').trim();
  const email         = (data.email         || '').trim();
  const tattooIdea    = (data.tattooIdea    || '').trim();
  const description   = (data.description   || '').trim();
  const placement     = (data.placement     || '').trim();
  const size          = (data.size          || '').trim();
  const preferredDate = (data.preferredDate || '').toString().trim();

  // customerName
  if (!customerName) {
    errors.customerName = 'Customer name is required.';
  } else if (customerName.length > 100) {
    errors.customerName = 'Customer name cannot exceed 100 characters.';
  }

  // phone
  if (!phone) {
    errors.phone = 'Phone number is required.';
  } else if (!validator.isMobilePhone(phone, 'any', { strictMode: false })) {
    errors.phone = 'Please provide a valid phone number.';
  }

  // email (optional)
  if (email && !validator.isEmail(email)) {
    errors.email = 'Please provide a valid email address.';
  }

  // tattooIdea
  if (!tattooIdea) {
    errors.tattooIdea = 'Tattoo idea is required.';
  } else if (tattooIdea.length > 200) {
    errors.tattooIdea = 'Tattoo idea cannot exceed 200 characters.';
  }

  // description
  if (!description) {
    errors.description = 'Description is required.';
  } else if (description.length > 1000) {
    errors.description = 'Description cannot exceed 1000 characters.';
  }

  // placement
  if (!placement) {
    errors.placement = 'Placement is required.';
  } else if (placement.length > 100) {
    errors.placement = 'Placement cannot exceed 100 characters.';
  }

  // size
  if (!size) {
    errors.size = 'Size is required.';
  } else if (!VALID_SIZES.includes(size)) {
    errors.size = `Size must be one of: ${VALID_SIZES.join(', ')}.`;
  }

  // preferredDate
  if (!preferredDate) {
    errors.preferredDate = 'Preferred date is required.';
  } else {
    const parsed = new Date(preferredDate);
    if (isNaN(parsed.getTime())) {
      errors.preferredDate = 'Preferred date is not a valid date.';
    } else if (parsed < new Date(new Date().setHours(0, 0, 0, 0))) {
      errors.preferredDate = 'Preferred date cannot be in the past.';
    }
  }

  return { errors, isValid: Object.keys(errors).length === 0 };
}

// ── Status update validation ──────────────────────────────────────────────────
function validateStatusUpdate(data) {
  const errors = {};
  const status = (data.status || '').trim();

  if (!status) {
    errors.status = 'Status is required.';
  } else if (!VALID_STATUSES.includes(status)) {
    errors.status = `Status must be one of: ${VALID_STATUSES.join(', ')}.`;
  }

  return { errors, isValid: Object.keys(errors).length === 0 };
}

module.exports = { validateCreateBooking, validateStatusUpdate, VALID_SIZES, VALID_STATUSES };
