const userService = require('./user.service');
const { validateProfileUpdate } = require('./user.validation');
const bookingService = require('../bookings/booking.service');

// ── GET /api/users/me ─────────────────────────────────────────────────────────
async function getMe(req, res, next) {
  try {
    const user = await userService.getMe(req.user._id);
    return res.status(200).json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
}

// ── PATCH /api/users/me ───────────────────────────────────────────────────────
async function updateMe(req, res, next) {
  try {
    const { errors, isValid } = validateProfileUpdate(req.body);
    if (!isValid) {
      return res.status(422).json({ success: false, errors });
    }

    const user = await userService.updateProfile(req.user._id, req.body);
    return res.status(200).json({ success: true, message: 'Profile updated.', data: { user } });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/users  (admin only) ──────────────────────────────────────────────
async function getAllUsers(req, res, next) {
  try {
    const { search = '', page, limit, deleted } = req.query;
    const result = await userService.getAllUsers({
      search,
      page:    page    ? parseInt(page,    10) : 1,
      limit:   limit   ? parseInt(limit,   10) : 20,
      deleted: deleted ?? 'false',   // default: active accounts only
    });
    return res.status(200).json({
      success: true,
      count: result.users.length,
      pagination: result.pagination,
      data: { users: result.users },
    });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/users/:id ────────────────────────────────────────────────────────
async function getUserById(req, res, next) {
  try {
    const user = await userService.getUserById(req.params.id);
    return res.status(200).json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/users/me/bookings ────────────────────────────────────────────────
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

module.exports = { getMe, updateMe, getAllUsers, getUserById, getMyBookings };
