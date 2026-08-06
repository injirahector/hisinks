const reviewService = require('./review.service');
const { validateCreateReview, validateUpdateReview, validateAdminReply } = require('./review.validation');

// ── POST /api/reviews  (customer) ─────────────────────────────────────────────
async function createReview(req, res, next) {
  try {
    // Validate
    const { errors, isValid } = validateCreateReview(req.body);
    if (!isValid) {
      return res.status(422).json({ success: false, errors });
    }

    const review = await reviewService.createReview(req.user._id, req.body);
    return res.status(201).json({
      success: true,
      message: 'Review created successfully.',
      data: { review },
    });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/reviews  (public) ────────────────────────────────────────────────
async function getPublicReviews(req, res, next) {
  try {
    const { page, limit } = req.query;
    const result = await reviewService.getPublicReviews({
      page:  page  ? parseInt(page,  10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
    return res.status(200).json({
      success: true,
      count: result.reviews.length,
      pagination: result.pagination,
      data: { reviews: result.reviews },
    });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/reviews/featured  (public) ───────────────────────────────────────
async function getFeaturedReviews(req, res, next) {
  try {
    const { limit } = req.query;
    const reviews = await reviewService.getFeaturedReviews({
      limit: limit ? parseInt(limit, 10) : 6,
    });
    return res.status(200).json({
      success: true,
      count: reviews.length,
      data: { reviews },
    });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/reviews/stats  (public) ──────────────────────────────────────────
async function getReviewStats(req, res, next) {
  try {
    const stats = await reviewService.getReviewStats();
    return res.status(200).json({
      success: true,
      data: { stats },
    });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/reviews/me  (customer) ───────────────────────────────────────────
async function getMyReviews(req, res, next) {
  try {
    const reviews = await reviewService.getMyReviews(req.user._id);
    return res.status(200).json({
      success: true,
      count: reviews.length,
      data: { reviews },
    });
  } catch (err) {
    next(err);
  }
}

// ── PATCH /api/reviews/:id  (customer) ────────────────────────────────────────
async function updateMyReview(req, res, next) {
  try {
    // Validate
    const { errors, isValid } = validateUpdateReview(req.body);
    if (!isValid) {
      return res.status(422).json({ success: false, errors });
    }

    const review = await reviewService.updateMyReview(req.user._id, req.params.id, req.body);
    return res.status(200).json({
      success: true,
      message: 'Review updated successfully.',
      data: { review },
    });
  } catch (err) {
    next(err);
  }
}

// ── DELETE /api/reviews/:id  (customer) ───────────────────────────────────────
async function deleteMyReview(req, res, next) {
  try {
    await reviewService.deleteMyReview(req.user._id, req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Review deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/admin/reviews  (admin) ───────────────────────────────────────────
async function getAllReviews(req, res, next) {
  try {
    const { isVisible, page, limit } = req.query;
    const result = await reviewService.getAllReviews({
      isVisible,
      page:  page  ? parseInt(page,  10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
    return res.status(200).json({
      success: true,
      count: result.reviews.length,
      pagination: result.pagination,
      data: { reviews: result.reviews },
    });
  } catch (err) {
    next(err);
  }
}

// ── PATCH /api/admin/reviews/:id/reply  (admin) ───────────────────────────────
async function replyToReview(req, res, next) {
  try {
    // Validate
    const { errors, isValid } = validateAdminReply(req.body);
    if (!isValid) {
      return res.status(422).json({ success: false, errors });
    }

    const review = await reviewService.replyToReview(req.params.id, req.body.artistReply);
    return res.status(200).json({
      success: true,
      message: 'Reply added successfully.',
      data: { review },
    });
  } catch (err) {
    next(err);
  }
}

// ── PATCH /api/admin/reviews/:id/visibility  (admin) ──────────────────────────
async function toggleVisibility(req, res, next) {
  try {
    const { isVisible } = req.body;
    if (isVisible === undefined || typeof isVisible !== 'boolean') {
      return res.status(422).json({
        success: false,
        message: 'isVisible must be a boolean.',
      });
    }

    const review = await reviewService.toggleVisibility(req.params.id, isVisible);
    return res.status(200).json({
      success: true,
      message: `Review visibility set to ${isVisible ? 'visible' : 'hidden'}.`,
      data: { review },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createReview,
  getPublicReviews,
  getFeaturedReviews,
  getReviewStats,
  getMyReviews,
  updateMyReview,
  deleteMyReview,
  getAllReviews,
  replyToReview,
  toggleVisibility,
};
