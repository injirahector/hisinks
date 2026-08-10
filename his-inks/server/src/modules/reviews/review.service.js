const Review = require('./review.model');
const Booking = require('../bookings/booking.model');
const {
  notifyAdminNewReview,
  notifyArtistReplyToReview,
} = require('../notifications/notification.service');

// ── Helpers ───────────────────────────────────────────────────────────────────
function notFound(msg) {
  const e = new Error(msg);
  e.statusCode = 404;
  return e;
}
function forbidden(msg) {
  const e = new Error(msg);
  e.statusCode = 403;
  return e;
}
function conflict(msg) {
  const e = new Error(msg);
  e.statusCode = 409;
  return e;
}
function badRequest(msg) {
  const e = new Error(msg);
  e.statusCode = 400;
  return e;
}

// ── Customer: create a review ─────────────────────────────────────────────────
async function createReview(customerId, data) {
  const { appointment, rating, comment, title, images } = data;

  // 1. Check if appointment exists
  const booking = await Booking.findById(appointment);
  if (!booking) throw notFound('Appointment not found.');

  // 2. Check if it belongs to the logged-in customer
  if (!booking.userId || booking.userId.toString() !== customerId.toString()) {
    throw forbidden('You can only review your own appointments.');
  }

  // 3. Check if appointment is completed
  if (booking.status !== 'completed') {
    throw forbidden('You can only review completed appointments.');
  }

  // 4. Check if a review already exists for this appointment
  const existing = await Review.findOne({ customer: customerId, appointment });
  if (existing) {
    throw conflict('You have already reviewed this appointment.');
  }

  // 5. Create the review
  const review = await Review.create({
    customer: customerId,
    appointment,
    rating: Number(rating),
    comment: comment.trim(),
    title: title ? title.trim() : null,
    images: images || [],
  });

  // 6. Populate and return
  await review.populate([
    { path: 'customer', select: 'firstName lastName profileImage' },
    { path: 'appointment', select: 'preferredDate tattooIdea' },
  ]);

  // Notify admin of the new review
  const customerName = `${review.customer.firstName} ${review.customer.lastName}`.trim();
  notifyAdminNewReview(customerName, review.rating);

  return review;
}

// ── Public: get all visible reviews ───────────────────────────────────────────
async function getPublicReviews({ page = 1, limit = 20 } = {}) {
  const skip = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    Review.find({ isVisible: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('customer', 'firstName lastName profileImage')
      .populate('appointment', 'preferredDate tattooIdea'),
    Review.countDocuments({ isVisible: true }),
  ]);

  return {
    reviews,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}

// ── Public: get featured reviews (top-rated, visible, with images) ────────────
async function getFeaturedReviews({ limit = 6 } = {}) {
  const reviews = await Review.find({ isVisible: true, rating: 5, images: { $ne: [] } })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('customer', 'firstName lastName profileImage')
    .populate('appointment', 'preferredDate tattooIdea');

  return reviews;
}

// ── Customer: get their own reviews ───────────────────────────────────────────
async function getMyReviews(customerId) {
  const reviews = await Review.find({ customer: customerId })
    .sort({ createdAt: -1 })
    .populate('appointment', 'preferredDate tattooIdea status');

  return reviews;
}

// ── Customer: update their own review ─────────────────────────────────────────
async function updateMyReview(customerId, reviewId, data) {
  const review = await Review.findById(reviewId);
  if (!review) throw notFound('Review not found.');

  // Check ownership
  if (review.customer.toString() !== customerId.toString()) {
    throw forbidden('You can only edit your own reviews.');
  }

  // Update fields
  if (data.rating !== undefined)  review.rating  = Number(data.rating);
  if (data.comment !== undefined) review.comment = data.comment.trim();
  if (data.title !== undefined)   review.title   = data.title.trim() || null;
  if (data.images !== undefined)  review.images  = data.images;

  await review.save();

  await review.populate([
    { path: 'customer', select: 'firstName lastName profileImage' },
    { path: 'appointment', select: 'preferredDate tattooIdea' },
  ]);

  return review;
}

// ── Customer: delete their own review ─────────────────────────────────────────
async function deleteMyReview(customerId, reviewId) {
  const review = await Review.findById(reviewId);
  if (!review) throw notFound('Review not found.');

  // Check ownership
  if (review.customer.toString() !== customerId.toString()) {
    throw forbidden('You can only delete your own reviews.');
  }

  await review.deleteOne();
  return review;
}

// ── Admin: get all reviews (including hidden) ─────────────────────────────────
async function getAllReviews({ isVisible, page = 1, limit = 20 } = {}) {
  const filter = {};
  if (isVisible !== undefined) filter.isVisible = isVisible === 'true';

  const skip = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('customer', 'firstName lastName profileImage email')
      .populate('appointment', 'preferredDate tattooIdea status'),
    Review.countDocuments(filter),
  ]);

  return {
    reviews,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}

// ── Admin: reply to a review ──────────────────────────────────────────────────
async function replyToReview(reviewId, artistReply) {
  const review = await Review.findById(reviewId);
  if (!review) throw notFound('Review not found.');

  review.artistReply = artistReply.trim();
  await review.save();

  await review.populate([
    { path: 'customer', select: 'firstName lastName profileImage' },
    { path: 'appointment', select: 'preferredDate tattooIdea' },
  ]);

  // Notify the customer that the artist replied to their review
  notifyArtistReplyToReview(review.customer._id);

  return review;
}

// ── Admin: toggle visibility ──────────────────────────────────────────────────
async function toggleVisibility(reviewId, isVisible) {
  const review = await Review.findById(reviewId);
  if (!review) throw notFound('Review not found.');

  review.isVisible = isVisible;
  await review.save();

  await review.populate([
    { path: 'customer', select: 'firstName lastName profileImage' },
    { path: 'appointment', select: 'preferredDate tattooIdea' },
  ]);

  return review;
}

// ── Public: review statistics ─────────────────────────────────────────────────
async function getReviewStats() {
  // Only count visible reviews
  const reviews = await Review.find({ isVisible: true });

  const totalReviews = reviews.length;
  if (totalReviews === 0) {
    return {
      totalReviews: 0,
      averageRating: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };
  }

  // Calculate average
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  const averageRating = (sum / totalReviews).toFixed(1);

  // Calculate distribution
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach((r) => {
    distribution[r.rating] = (distribution[r.rating] || 0) + 1;
  });

  return {
    totalReviews,
    averageRating: parseFloat(averageRating),
    distribution,
  };
}

module.exports = {
  createReview,
  getPublicReviews,
  getFeaturedReviews,
  getMyReviews,
  updateMyReview,
  deleteMyReview,
  getAllReviews,
  replyToReview,
  toggleVisibility,
  getReviewStats,
};
