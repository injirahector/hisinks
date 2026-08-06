const express = require('express');
const router  = express.Router();
const ctrl    = require('./consultation.controller');
const { protect, restrictTo } = require('../../middleware/auth.middleware');

// ── Customer routes (logged-in) ───────────────────────────────────────────────
router.get( '/my',              protect, ctrl.getMyConsultation);
router.post('/my/messages',     protect, ctrl.customerSendMessage);
router.post('/my/deposit',      protect, ctrl.submitDepositRef);

// ── Admin routes ──────────────────────────────────────────────────────────────
router.get( '/',                         protect, restrictTo('admin'), ctrl.getAllConsultations);
router.get( '/:id',                      protect, restrictTo('admin'), ctrl.getConsultationById);
router.post('/:id/messages',             protect, restrictTo('admin'), ctrl.adminSendMessage);
router.patch('/:id/agree',               protect, restrictTo('admin'), ctrl.markAsAgreed);
router.patch('/:id/deposit/confirm',     protect, restrictTo('admin'), ctrl.confirmDeposit);
router.patch('/:id/deposit/reject',      protect, restrictTo('admin'), ctrl.rejectDeposit);
router.patch('/:id/close',               protect, restrictTo('admin'), ctrl.closeConsultation);

module.exports = router;
