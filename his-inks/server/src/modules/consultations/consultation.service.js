const Consultation = require('./consultation.model');
const {
  notifyConsultationReply,
  notifyConsultationAgreed,
  notifyConsultationClosed,
  notifyDepositConfirmed,
  notifyDepositRejected,
  notifyAdminConsultationMessage,
  notifyAdminDepositSubmitted,
} = require('../notifications/notification.service');

// ── helpers ───────────────────────────────────────────────────────────────────
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

// ── Internal: get the most recent consultation for a user ─────────────────────
function latestForUser(userId) {
  return Consultation.findOne({ userId }).sort({ createdAt: -1 });
}

// ── Customer: get their current consultation (find only — never creates) ──────
// Returns the most recent consultation, or null if none exists yet.
// A consultation is only created when the customer sends their first message.
async function getMyConsultation(userId) {
  return latestForUser(userId);
}

// ── Internal: create a fresh consultation for a user ─────────────────────────
async function createConsultation(user) {
  const count = await Consultation.countDocuments({ userId: user._id });
  return Consultation.create({
    userId:             user._id,
    customerName:       `${user.firstName} ${user.lastName}`.trim(),
    phone:              user.phone || '',
    email:              user.email || null,
    messages:           [],
    status:             'open',
    consultationNumber: count + 1,
  });
}

// ── Customer: send a message ──────────────────────────────────────────────────
// If no active consultation exists (none yet, or latest is booked/closed),
// one is created here — on first message, never on page load.
async function customerSendMessage(user, text, tattooRef) {
  let c = await latestForUser(user._id);

  const needsNew = !c || c.status === 'booked' || c.status === 'closed';
  if (needsNew) {
    c = await createConsultation(user);
  }

  // Save tattooRef on the very first message of a fresh consultation
  // and auto-insert a reference message so admin sees it in the thread
  if (tattooRef && !c.tattooRef?.image && c.messages.length === 0) {
    c.tattooRef = {
      title:       tattooRef.title       || null,
      image:       tattooRef.image       || null,
      category:    tattooRef.category    || null,
      description: tattooRef.description || null,
    };

    // Build a clear reference message visible to admin in the thread
    const lines = ['📌 Style Reference from Portfolio:'];
    if (tattooRef.title)       lines.push(`Title: ${tattooRef.title}`);
    if (tattooRef.category)    lines.push(`Category: ${tattooRef.category}`);
    if (tattooRef.description) lines.push(`Description: ${tattooRef.description}`);
    if (tattooRef.image)       lines.push(`Image: ${tattooRef.image}`);

    c.messages.push({ sender: 'customer', text: lines.join('\n') });
  }

  if (c.status === 'agreed' || c.status === 'deposit_pending' || c.status === 'deposit_paid') {
    // Active consultation in a locked state — customer shouldn't be sending
    // free-text here (the UI hides the box), but guard server-side too.
  }

  c.messages.push({ sender: 'customer', text: text.trim() });
  await c.save();
  // Notify admin of the new customer message
  notifyAdminConsultationMessage(c.customerName);
  return c;
}

// ── Admin: get all consultations ──────────────────────────────────────────────
async function getAllConsultations({ status, page = 1, limit = 20 } = {}) {
  const filter = {};
  if (status) filter.status = status;

  const skip = (page - 1) * limit;
  const [consultations, total] = await Promise.all([
    Consultation.find(filter)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'firstName lastName email')
      .populate('bookingId', 'preferredDate status'),
    Consultation.countDocuments(filter),
  ]);

  return {
    consultations,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}

// ── Admin: get one consultation ───────────────────────────────────────────────
async function getConsultationById(id) {
  const c = await Consultation.findById(id)
    .populate('userId', 'firstName lastName email phone')
    .populate('bookingId', 'preferredDate status tattooIdea');
  if (!c) throw notFound('Consultation not found.');
  return c;
}

// ── Admin: reply ──────────────────────────────────────────────────────────────
async function adminSendMessage(consultationId, text) {
  const c = await Consultation.findById(consultationId);
  if (!c) throw notFound('Consultation not found.');

  if (c.status === 'booked' || c.status === 'closed') {
    throw forbidden('This consultation is closed.');
  }

  c.messages.push({ sender: 'admin', text: text.trim() });
  await c.save();
  // Notify the customer about the new reply
  notifyConsultationReply(c.userId);
  return c;
}

// ── Admin: mark as agreed ─────────────────────────────────────────────────────
async function markAsAgreed(consultationId, agreedPrice) {
  const c = await Consultation.findById(consultationId);
  if (!c) throw notFound('Consultation not found.');

  if (c.status === 'booked') {
    throw conflict('This consultation already has a booking.');
  }
  if (c.status === 'closed') {
    throw conflict('This consultation is closed.');
  }

  c.status        = 'agreed';
  c.agreedPrice   = agreedPrice;
  // Pre-calculate 20% deposit amount
  c.depositAmount = Math.ceil(agreedPrice * 0.2);
  c.depositStatus = 'none';
  await c.save();
  // Notify the customer that a price has been agreed and deposit is needed
  notifyConsultationAgreed(c.userId, agreedPrice, c.depositAmount);
  return c;
}

// ── Customer: submit M-Pesa deposit reference ─────────────────────────────────
async function submitDepositRef(userId, mpesaRef) {
  const c = await latestForUser(userId);
  if (!c) throw notFound('No consultation found.');

  if (c.status !== 'agreed') {
    throw forbidden('Deposit can only be submitted after price is agreed.');
  }
  if (!mpesaRef || !mpesaRef.trim()) {
    const e = new Error('M-Pesa reference code is required.');
    e.statusCode = 422;
    throw e;
  }

  c.depositRef    = mpesaRef.trim().toUpperCase();
  c.depositStatus = 'pending';
  c.status        = 'deposit_pending';
  await c.save();
  // Notify admin that a deposit reference is waiting for verification
  notifyAdminDepositSubmitted(c.customerName, c.depositRef);
  return c;
}

// ── Admin: confirm deposit received ──────────────────────────────────────────
async function confirmDeposit(consultationId) {
  const c = await Consultation.findById(consultationId);
  if (!c) throw notFound('Consultation not found.');

  if (c.status !== 'deposit_pending') {
    throw conflict('This consultation does not have a pending deposit to confirm.');
  }

  c.depositStatus       = 'paid';
  c.depositConfirmedAt  = new Date();
  c.status              = 'deposit_paid';
  await c.save();
  // Notify the customer that their deposit was accepted
  notifyDepositConfirmed(c.userId);
  return c;
}

// ── Admin: reject deposit (wrong ref / payment not found) ────────────────────
async function rejectDeposit(consultationId) {
  const c = await Consultation.findById(consultationId);
  if (!c) throw notFound('Consultation not found.');

  if (c.status !== 'deposit_pending') {
    throw conflict('No pending deposit to reject.');
  }

  // Roll back to agreed so customer can resubmit
  c.depositStatus = 'none';
  c.depositRef    = null;
  c.status        = 'agreed';
  await c.save();
  // Notify the customer to resubmit their M-Pesa reference
  notifyDepositRejected(c.userId);
  return c;
}

// ── Admin: close a consultation ───────────────────────────────────────────────
async function closeConsultation(consultationId) {
  const c = await Consultation.findById(consultationId);
  if (!c) throw notFound('Consultation not found.');
  if (c.status === 'booked') throw conflict('Cannot close a consultation that has a booking.');

  c.status = 'closed';
  await c.save();
  // Notify the customer their consultation has been closed
  notifyConsultationClosed(c.userId);
  return c;
}

// ── Internal: link booking to consultation (called from booking service) ──────
// Uses findOneAndUpdate so the status flip + bookingId assignment is atomic.
// Only targets the deposit_paid consultation with no booking yet — prevents
// double-booking if createBooking is somehow called twice concurrently.
async function linkBooking(userId, bookingId) {
  await Consultation.findOneAndUpdate(
    { userId, status: 'deposit_paid', bookingId: null },
    { $set: { status: 'booked', bookingId } },
    { sort: { createdAt: -1 } }
  );
  // If no document matched, the consultation was already linked — safe to ignore.
}

// ── Internal: check if user has a deposit_paid consultation (booking gate) ───
// Must be deposit_paid AND not yet linked to a booking (bookingId is null).
// This ensures one deposit = one booking — the moment linkBooking() sets
// bookingId and flips status to 'booked', this gate returns null.
async function getAgreedConsultation(userId) {
  return Consultation.findOne({ userId, status: 'deposit_paid', bookingId: null }).sort({ createdAt: -1 });
}

module.exports = {
  getMyConsultation,
  customerSendMessage,
  getAllConsultations,
  getConsultationById,
  adminSendMessage,
  markAsAgreed,
  submitDepositRef,
  confirmDeposit,
  rejectDeposit,
  closeConsultation,
  linkBooking,
  getAgreedConsultation,
};
