// ── Validate inspiration creation ──────────────────────────────────────────────
function validateInspirationCreate(data) {
  const errors = {};

  // Title validation
  if (!data.title || !data.title.trim()) {
    errors.title = 'Title is required';
  } else if (data.title.trim().length > 150) {
    errors.title = 'Title cannot exceed 150 characters';
  }

  // Description validation
  if (data.description && data.description.trim().length > 1000) {
    errors.description = 'Description cannot exceed 1000 characters';
  }

  // Category validation
  const validCategories = [
    'Minimalist',
    'Fine Line',
    'Black & Grey',
    'Realism',
    'Floral',
    'Geometric',
    'Tribal',
    'Lettering',
    'Portrait',
    'Japanese',
    'Animal',
    'Traditional',
    'Abstract',
    'Sleeve',
    'Small Tattoos',
    'Custom Ideas',
  ];

  if (!data.category) {
    errors.category = 'Category is required';
  } else if (!validCategories.includes(data.category)) {
    errors.category = 'Invalid category selected';
  }

  // Image validation
  if (!data.image || !data.image.trim()) {
    errors.image = 'Image URL is required';
  }

  // PublicId validation
  if (!data.publicId || !data.publicId.trim()) {
    errors.publicId = 'Cloudinary public ID is required';
  }

  // EstimatedSize validation (optional)
  if (data.estimatedSize) {
    const validSizes = ['Small', 'Medium', 'Large', 'Extra Large', 'Full Sleeve', 'Half Sleeve'];
    if (!validSizes.includes(data.estimatedSize)) {
      errors.estimatedSize = 'Invalid estimated size';
    }
  }

  // SuggestedPlacement validation (optional)
  if (data.suggestedPlacement && data.suggestedPlacement.trim().length > 50) {
    errors.suggestedPlacement = 'Suggested placement cannot exceed 50 characters';
  }

  // Keywords validation (optional)
  if (data.keywords) {
    if (!Array.isArray(data.keywords)) {
      errors.keywords = 'Keywords must be an array';
    } else if (data.keywords.some((k) => typeof k !== 'string')) {
      errors.keywords = 'All keywords must be strings';
    }
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
  };
}

// ── Validate inspiration update ────────────────────────────────────────────────
function validateInspirationUpdate(data) {
  const errors = {};

  // Title validation (if provided)
  if (data.title !== undefined) {
    if (!data.title.trim()) {
      errors.title = 'Title cannot be empty';
    } else if (data.title.trim().length > 150) {
      errors.title = 'Title cannot exceed 150 characters';
    }
  }

  // Description validation (if provided)
  if (data.description !== undefined && data.description && data.description.trim().length > 1000) {
    errors.description = 'Description cannot exceed 1000 characters';
  }

  // Category validation (if provided)
  if (data.category) {
    const validCategories = [
      'Minimalist',
      'Fine Line',
      'Black & Grey',
      'Realism',
      'Floral',
      'Geometric',
      'Tribal',
      'Lettering',
      'Portrait',
      'Japanese',
      'Animal',
      'Traditional',
      'Abstract',
      'Sleeve',
      'Small Tattoos',
      'Custom Ideas',
    ];

    if (!validCategories.includes(data.category)) {
      errors.category = 'Invalid category selected';
    }
  }

  // EstimatedSize validation (if provided)
  if (data.estimatedSize) {
    const validSizes = ['Small', 'Medium', 'Large', 'Extra Large', 'Full Sleeve', 'Half Sleeve'];
    if (!validSizes.includes(data.estimatedSize)) {
      errors.estimatedSize = 'Invalid estimated size';
    }
  }

  // SuggestedPlacement validation (if provided)
  if (data.suggestedPlacement && data.suggestedPlacement.trim().length > 50) {
    errors.suggestedPlacement = 'Suggested placement cannot exceed 50 characters';
  }

  // Keywords validation (if provided)
  if (data.keywords !== undefined) {
    if (!Array.isArray(data.keywords)) {
      errors.keywords = 'Keywords must be an array';
    } else if (data.keywords.some((k) => typeof k !== 'string')) {
      errors.keywords = 'All keywords must be strings';
    }
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
  };
}

module.exports = {
  validateInspirationCreate,
  validateInspirationUpdate,
};
