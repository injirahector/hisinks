/**
 * referral.controller.js
 *
 * HTTP handlers for customer and admin referral endpoints.
 * All business logic lives in referral.service.js.
 */

const referralService = require('./referral.service');

// ── Customer: GET /api/referrals/my-code ──────────────────────────────────────
async function getMyCode(req, res, next) {
  try {
    const data = await referralService.getMyCode(req.user._id);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

// ── Customer: GET /api/referrals/me ──────────────────────────────────────────
async function getMyReferrals(req, res, next) {
  try {
    const data = await referralService.getMyReferrals(req.user._id);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

// ── Admin: GET /api/admin/referrals ───────────────────────────────────────────
async function getAllReferrals(req, res, next) {
  try {
    const { status, page, limit } = req.query;
    const data = await referralService.getAllReferrals({
      status: status || undefined,
      page:   parseInt(page,  10) || 1,
      limit:  parseInt(limit, 10) || 20,
    });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

// ── Admin: PATCH /api/admin/referrals/:id/pay ─────────────────────────────────
async function markAsPaid(req, res, next) {
  try {
    const { id } = req.params;
    const { paymentReference, notes } = req.body;

    const referral = await referralService.markAsPaid(id, req.user._id, {
      paymentReference,
      notes,
    });

    return res.status(200).json({
      success: true,
      message: 'Referral marked as paid.',
      data: { referral },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getMyCode, getMyReferrals, getAllReferrals, markAsPaid };
