const consultationService = require('./consultation.service');

// ── GET /api/consultations/my  (customer) ─────────────────────────────────────
// Returns the latest consultation or null — never creates one.
// Creation happens lazily when the customer sends their first message.
async function getMyConsultation(req, res, next) {
  try {
    const consultation = await consultationService.getMyConsultation(req.user._id);
    return res.status(200).json({ success: true, data: { consultation } });
  } catch (err) { next(err); }
}

// ── POST /api/consultations/my/messages  (customer) ──────────────────────────
async function customerSendMessage(req, res, next) {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(422).json({ success: false, message: 'Message text is required.' });
    }
    // Pass full user object so the service can create a consultation if needed
    const consultation = await consultationService.customerSendMessage(req.user, text);
    return res.status(200).json({ success: true, data: { consultation } });
  } catch (err) { next(err); }
}

// ── GET /api/consultations  (admin) ──────────────────────────────────────────
async function getAllConsultations(req, res, next) {
  try {
    const { status, page, limit } = req.query;
    const result = await consultationService.getAllConsultations({
      status,
      page:  page  ? parseInt(page,  10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
    return res.status(200).json({
      success: true,
      count: result.consultations.length,
      pagination: result.pagination,
      data: { consultations: result.consultations },
    });
  } catch (err) { next(err); }
}

// ── GET /api/consultations/:id  (admin) ───────────────────────────────────────
async function getConsultationById(req, res, next) {
  try {
    const consultation = await consultationService.getConsultationById(req.params.id);
    return res.status(200).json({ success: true, data: { consultation } });
  } catch (err) { next(err); }
}

// ── POST /api/consultations/:id/messages  (admin) ─────────────────────────────
async function adminSendMessage(req, res, next) {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(422).json({ success: false, message: 'Message text is required.' });
    }
    const consultation = await consultationService.adminSendMessage(req.params.id, text);
    return res.status(200).json({ success: true, data: { consultation } });
  } catch (err) { next(err); }
}

// ── PATCH /api/consultations/:id/agree  (admin) ───────────────────────────────
async function markAsAgreed(req, res, next) {
  try {
    const price = req.body.agreedPrice;
    if (price === undefined || price === null || isNaN(Number(price)) || Number(price) < 0) {
      return res.status(422).json({ success: false, message: 'agreedPrice must be a non-negative number.' });
    }
    const consultation = await consultationService.markAsAgreed(req.params.id, Number(price));
    return res.status(200).json({
      success: true,
      message: 'Consultation marked as agreed. Customer can now book.',
      data: { consultation },
    });
  } catch (err) { next(err); }
}

// ── PATCH /api/consultations/:id/close  (admin) ───────────────────────────────
async function closeConsultation(req, res, next) {
  try {
    const consultation = await consultationService.closeConsultation(req.params.id);
    return res.status(200).json({ success: true, message: 'Consultation closed.', data: { consultation } });
  } catch (err) { next(err); }
}

// ── POST /api/consultations/my/deposit  (customer) ────────────────────────────
async function submitDepositRef(req, res, next) {
  try {
    const { mpesaRef } = req.body;
    if (!mpesaRef || !mpesaRef.trim()) {
      return res.status(422).json({ success: false, message: 'M-Pesa reference code is required.' });
    }
    const consultation = await consultationService.submitDepositRef(req.user._id, mpesaRef);
    return res.status(200).json({
      success: true,
      message: 'Deposit reference submitted. Awaiting admin confirmation.',
      data: { consultation },
    });
  } catch (err) { next(err); }
}

// ── PATCH /api/consultations/:id/deposit/confirm  (admin) ─────────────────────
async function confirmDeposit(req, res, next) {
  try {
    const consultation = await consultationService.confirmDeposit(req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Deposit confirmed. Customer can now book their appointment.',
      data: { consultation },
    });
  } catch (err) { next(err); }
}

// ── PATCH /api/consultations/:id/deposit/reject  (admin) ──────────────────────
async function rejectDeposit(req, res, next) {
  try {
    const consultation = await consultationService.rejectDeposit(req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Deposit rejected. Customer can resubmit their reference.',
      data: { consultation },
    });
  } catch (err) { next(err); }
}

module.exports = {
  getMyConsultation,
  customerSendMessage,
  submitDepositRef,
  getAllConsultations,
  getConsultationById,
  adminSendMessage,
  markAsAgreed,
  confirmDeposit,
  rejectDeposit,
  closeConsultation,
};
