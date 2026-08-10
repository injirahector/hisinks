const Booking      = require('./booking.model');
const { getAgreedConsultation, linkBooking } = require('../consultations/consultation.service');
const {
  notifyBookingConfirmed,
  notifyBookingCancelled,
  notifyBookingCompleted,
  notifyAdminNewBooking,
} = require('../notifications/notification.service');
const { emitToUser, emitToAdmins } = require('../../socket/socket');
// Lazy-loaded to avoid circular dependency issues at startup
let _referralService = null;
function getReferralService() {
  if (!_referralService) _referralService = require('../referrals/referral.service');
  return _referralService;
}

// ── Create booking (authenticated customers only) ─────────────────────────────
async function createBooking(data, userId = null) {
  // Require a deposit_paid consultation before booking
  let consultation = null;
  if (userId) {
    consultation = await getAgreedConsultation(userId);
    if (!consultation) {
      const err = new Error('You need to complete your consultation and pay the deposit before booking.');
      err.statusCode = 403;
      throw err;
    }
  }

  // Deposit has been paid → confirm immediately, no manual admin approval needed
  const initialStatus = consultation ? 'confirmed' : 'pending';

  const booking = await Booking.create({
    customerName:    data.customerName.trim(),
    phone:           data.phone.trim(),
    email:           data.email ? data.email.trim().toLowerCase() : null,
    tattooIdea:      data.tattooIdea.trim(),
    description:     data.description.trim(),
    placement:       data.placement.trim(),
    size:            data.size.trim(),
    referenceImage:  data.referenceImage ? data.referenceImage.trim() : null,
    preferredDate:   new Date(data.preferredDate),
    notes:           data.notes ? data.notes.trim() : null,
    bookingLocation: data.bookingLocation ? data.bookingLocation.trim() : null,
    userId,
    status:          initialStatus,
  });

  // Link consultation to this booking and mark it as booked
  if (userId) {
    await linkBooking(userId, booking._id);
  }

  // Notify the customer their booking is confirmed right away
  if (initialStatus === 'confirmed' && userId) {
    notifyBookingConfirmed(userId, booking.preferredDate);
  }

  // Notify admin of the new booking
  notifyAdminNewBooking(booking.customerName, booking.tattooIdea);

  // ── Real-time: push new booking event to admin(s) ─────────────────────────
  emitToAdmins('booking.created', {
    bookingId:    booking._id,
    customerName: booking.customerName,
    tattooIdea:   booking.tattooIdea,
    status:       booking.status,
    createdAt:    booking.createdAt,
  });

  return booking;
}

// ── Get all bookings (admin) ──────────────────────────────────────────────────
async function getAllBookings({ status, page = 1, limit = 20 } = {}) {
  const filter = {};
  if (status) filter.status = status;

  const skip = (page - 1) * limit;

  const [bookings, total] = await Promise.all([
    Booking.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Booking.countDocuments(filter),
  ]);

  return {
    bookings,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ── Get one booking (admin) ───────────────────────────────────────────────────
async function getBookingById(id) {
  const booking = await Booking.findById(id);
  if (!booking) {
    const err = new Error('Booking not found.');
    err.statusCode = 404;
    throw err;
  }
  return booking;
}

// ── Update booking status (admin) ─────────────────────────────────────────────
async function updateBookingStatus(id, status, notes) {
  const update = { status };
  // Allow admin to attach an optional note when updating status
  if (notes !== undefined) update.notes = notes.trim();

  const booking = await Booking.findByIdAndUpdate(
    id,
    { $set: update },
    { new: true, runValidators: true }
  );

  if (!booking) {
    const err = new Error('Booking not found.');
    err.statusCode = 404;
    throw err;
  }

  // ── Notify the booking owner about their status change ────────────────────
  if (booking.userId) {
    if (status === 'confirmed') {
      notifyBookingConfirmed(booking.userId, booking.preferredDate);
    } else if (status === 'cancelled') {
      notifyBookingCancelled(booking.userId, booking.preferredDate, notes || null);
    } else if (status === 'completed') {
      notifyBookingCompleted(booking.userId, booking.preferredDate);
    }
  }

  // ── Referral eligibility / cancellation hooks ─────────────────────────────
  if (status === 'completed') {
    // Fire-and-forget: check if this booking makes a referral eligible
    getReferralService().processReferralEligibility(booking._id);
  } else if (status === 'cancelled') {
    // If a pending/eligible referral is linked to this booking, cancel it
    getReferralService().cancelReferralForBooking(booking._id);
  }

  // ── Option A: auto-cancel same-day pending bookings ───────────────────────
  // When admin confirms or completes a booking, automatically cancel all other
  // pending bookings on the same calendar date with an explanatory note.
  if (status === 'confirmed' || status === 'completed') {
    const d        = new Date(booking.preferredDate);
    const year     = d.getUTCFullYear();
    const month    = d.getUTCMonth();
    const day      = d.getUTCDate();
    const dayStart = new Date(Date.UTC(year, month, day, 0, 0, 0));
    const dayEnd   = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));

    // Find and notify the auto-cancelled bookings before bulk-updating them
    const autoCancelled = await Booking.find({
      _id:           { $ne: booking._id },
      preferredDate: { $gte: dayStart, $lte: dayEnd },
      status:        'pending',
      userId:        { $ne: null },
    }).select('userId preferredDate');

    await Booking.updateMany(
      {
        _id:           { $ne: booking._id },
        preferredDate: { $gte: dayStart, $lte: dayEnd },
        status:        'pending',
      },
      {
        $set: {
          status: 'cancelled',
          notes:  'Auto-cancelled: another booking was confirmed for this date.',
        },
      }
    );

    // Fire-and-forget notifications for each auto-cancelled booking owner
    for (const b of autoCancelled) {
      notifyBookingCancelled(
        b.userId,
        b.preferredDate,
        'Another booking was confirmed for this date.'
      );
      // Real-time: notify each auto-cancelled customer
      emitToUser(b.userId, 'booking.status_changed', {
        bookingId: b._id,
        status:    'cancelled',
        updatedAt: new Date(),
      });
    }
  }

  // ── Real-time: push status change to the booking owner and to admins ──────
  if (booking.userId) {
    emitToUser(booking.userId, 'booking.status_changed', {
      bookingId: booking._id,
      status:    booking.status,
      updatedAt: booking.updatedAt,
    });
  }
  emitToAdmins('booking.updated', {
    bookingId: booking._id,
    status:    booking.status,
    updatedAt: booking.updatedAt,
  });

  return booking;
}

// ── Delete booking (admin) ────────────────────────────────────────────────────
async function deleteBooking(id) {
  const booking = await Booking.findByIdAndDelete(id);
  if (!booking) {
    const err = new Error('Booking not found.');
    err.statusCode = 404;
    throw err;
  }
  return booking;
}

// ── Get bookings for the logged-in customer ───────────────────────────────────
async function getMyBookings(userId) {
  const bookings = await Booking.find({ userId })
    .sort({ createdAt: -1 })
    .select('-userId'); // no need to send userId back to the owner
  return bookings;
}

module.exports = {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBookingStatus,
  deleteBooking,
  getMyBookings,
};
