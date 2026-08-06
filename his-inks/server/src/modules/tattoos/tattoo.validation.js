const VALID_CATEGORIES = [
  'Fine Line',
  'Black & Grey',
  'Neo-Traditional',
  'Traditional',
  'Geometric',
  'Watercolor',
  'Tribal',
  'Realism',
  'Minimalist',
  'Other',
];

// ── Create validation ─────────────────────────────────────────────────────────
function validateCreateTattoo(data) {
  const errors = {};

  const title      = (data.title      || '').trim();
  const category   = (data.category   || '').trim();
  const image      = (data.image      || '').trim();
  const priceRange = (data.priceRange || '').trim();
  const description = (data.description || '').trim();

  if (!title) {
    errors.title = 'Title is required.';
  } else if (title.length > 100) {
    errors.title = 'Title cannot exceed 100 characters.';
  }

  if (!category) {
    errors.category = 'Category is required.';
  } else if (!VALID_CATEGORIES.includes(category)) {
    errors.category = `Category must be one of: ${VALID_CATEGORIES.join(', ')}.`;
  }

  if (!image) {
    errors.image = 'Image URL is required.';
  }

  if (description && description.length > 1000) {
    errors.description = 'Description cannot exceed 1000 characters.';
  }

  if (priceRange && priceRange.length > 50) {
    errors.priceRange = 'Price range cannot exceed 50 characters.';
  }

  return { errors, isValid: Object.keys(errors).length === 0 };
}

// ── Update validation (all fields optional) ───────────────────────────────────
function validateUpdateTattoo(data) {
  const errors = {};

  if (data.title !== undefined) {
    const title = (data.title || '').trim();
    if (!title) {
      errors.title = 'Title cannot be empty.';
    } else if (title.length > 100) {
      errors.title = 'Title cannot exceed 100 characters.';
    }
  }

  if (data.category !== undefined) {
    const category = (data.category || '').trim();
    if (!category) {
      errors.category = 'Category cannot be empty.';
    } else if (!VALID_CATEGORIES.includes(category)) {
      errors.category = `Category must be one of: ${VALID_CATEGORIES.join(', ')}.`;
    }
  }

  if (data.image !== undefined) {
    const image = (data.image || '').trim();
    if (!image) {
      errors.image = 'Image URL cannot be empty.';
    }
  }

  if (data.description !== undefined && data.description.length > 1000) {
    errors.description = 'Description cannot exceed 1000 characters.';
  }

  if (data.priceRange !== undefined && data.priceRange.length > 50) {
    errors.priceRange = 'Price range cannot exceed 50 characters.';
  }

  return { errors, isValid: Object.keys(errors).length === 0 };
}

module.exports = { validateCreateTattoo, validateUpdateTattoo, VALID_CATEGORIES };
