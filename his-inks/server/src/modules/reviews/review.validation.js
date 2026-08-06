/**
 * Pure validation functions for the Reviews module.
 * Each function returns { errors, isValid }.
 */

// ── Create review ─────────────────────────────────────────────────────────────
function validateCreateReview(data) {
  const errors = {};

  const appointment = (data.appointment || '').toString().trim();
  const comment     = (data.comment     || '').trim();
  const title       = (data.title       || '').trim();
  const rating      = data.rating;
  const images      = data.images;

  // appointment
  if (!appointment) {
    errors.appointment = 'Appointment ID is required.';
  }

  // rating
  if (rating === undefined || rating === null || rating === '') {
    errors.rating = 'Rating is required.';
  } else {
    const num = Number(rating);
    if (isNaN(num) || !Number.isInteger(num) || num < 1 || num > 5) {
      errors.rating = 'Rating must be a whole number between 1 and 5.';
    }
  }

  // comment
  if (!comment) {
    errors.comment = 'Comment is required.';
  } else if (comment.length > 1000) {
    errors.comment = 'Comment cannot exceed 1000 characters.';
  }

  // title (optional)
  if (title && title.length > 100) {
    errors.title = 'Title cannot exceed 100 characters.';
  }

  // images (optional array)
  if (images !== undefined) {
    if (!Array.isArray(images)) {
      errors.images = 'Images must be an array.';
    } else if (images.length > 5) {
      errors.images = 'You can upload a maximum of 5 images.';
    }
  }

  return { errors, isValid: Object.keys(errors).length === 0 };
}

// ── Update review (customer edit) ─────────────────────────────────────────────
function validateUpdateReview(data) {
  const errors = {};

  // At least one field must be provided
  const hasRating  = data.rating  !== undefined;
  const hasComment = data.comment !== undefined;
  const hasTitle   = data.title   !== undefined;
  const hasImages  = data.images  !== undefined;

  if (!hasRating && !hasComment && !hasTitle && !hasImages) {
    errors.general = 'Provide at least one field to update (rating, comment, title, or images).';
    return { errors, isValid: false };
  }

  // rating
  if (hasRating) {
    const num = Number(data.rating);
    if (isNaN(num) || !Number.isInteger(num) || num < 1 || num > 5) {
      errors.rating = 'Rating must be a whole number between 1 and 5.';
    }
  }

  // comment
  if (hasComment) {
    const comment = (data.comment || '').trim();
    if (!comment) {
      errors.comment = 'Comment cannot be empty.';
    } else if (comment.length > 1000) {
      errors.comment = 'Comment cannot exceed 1000 characters.';
    }
  }

  // title
  if (hasTitle) {
    const title = (data.title || '').trim();
    if (title.length > 100) {
      errors.title = 'Title cannot exceed 100 characters.';
    }
  }

  // images
  if (hasImages) {
    if (!Array.isArray(data.images)) {
      errors.images = 'Images must be an array.';
    } else if (data.images.length > 5) {
      errors.images = 'You can upload a maximum of 5 images.';
    }
  }

  return { errors, isValid: Object.keys(errors).length === 0 };
}

// ── Admin reply ───────────────────────────────────────────────────────────────
function validateAdminReply(data) {
  const errors = {};
  const reply = (data.artistReply || '').trim();

  if (!reply) {
    errors.artistReply = 'Reply text is required.';
  } else if (reply.length > 1000) {
    errors.artistReply = 'Reply cannot exceed 1000 characters.';
  }

  return { errors, isValid: Object.keys(errors).length === 0 };
}

module.exports = { validateCreateReview, validateUpdateReview, validateAdminReply };
