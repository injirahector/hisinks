const bookingService = require('./booking.service');
const { validateCreateBooking, validateStatusUpdate } = require('./booking.validation');

// ── POST /api/bookings  (public — guests allowed, token optional) ─────────────
async function createBooking(req, res, next) {
  try {
    const { errors, isValid } = validateCreateBooking(req.body);
    if (!isValid) {
      return res.status(422).json({ success: false, errors });
    }

    // Attach userId if the request comes from a logged-in customer
    const userId = req.user?._id || null;
    const booking = await bookingService.createBooking(req.body, userId);
    return res.status(201).json({
      success: true,
      message: 'Booking request submitted successfully. We will contact you to confirm.',
      data: { booking },
    });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/bookings  (admin only) ───────────────────────────────────────────
async function getAllBookings(req, res, next) {
  try {
    const { status, page, limit } = req.query;
    const result = await bookingService.getAllBookings({
      status,
      page:  page  ? parseInt(page,  10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
    return res.status(200).json({
      success: true,
      count: result.bookings.length,
      pagination: result.pagination,
      data: { bookings: result.bookings },
    });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/bookings/:id  (admin only) ───────────────────────────────────────
async function getBookingById(req, res, next) {
  try {
    const booking = await bookingService.getBookingById(req.params.id);
    return res.status(200).json({ success: true, data: { booking } });
  } catch (err) {
    next(err);
  }
}

// ── PATCH /api/bookings/:id/status  (admin only) ─────────────────────────────
async function updateBookingStatus(req, res, next) {
  try {
    const { errors, isValid } = validateStatusUpdate(req.body);
    if (!isValid) {
      return res.status(422).json({ success: false, errors });
    }

    const { status, notes } = req.body;
    const booking = await bookingService.updateBookingStatus(req.params.id, status, notes);
    return res.status(200).json({
      success: true,
      message: `Booking status updated to "${status}".`,
      data: { booking },
    });
  } catch (err) {
    next(err);
  }
}

// ── DELETE /api/bookings/:id  (admin only) ────────────────────────────────────
async function deleteBooking(req, res, next) {
  try {
    await bookingService.deleteBooking(req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Booking deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/bookings/my  (authenticated customer) ────────────────────────────
async function getMyBookings(req, res, next) {
  try {
    const bookings = await bookingService.getMyBookings(req.user._id);
    return res.status(200).json({
      success: true,
      count: bookings.length,
      data: { bookings },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBookingStatus,
  deleteBooking,
  getMyBookings,
};
