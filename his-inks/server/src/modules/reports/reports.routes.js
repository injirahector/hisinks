const express    = require('express');
const router     = express.Router();
const ctrl       = require('./reports.controller');
const { protect, restrictTo } = require('../../middleware/auth.middleware');

// All reports endpoints are admin-only
router.use(protect, restrictTo('admin'));

router.get('/dashboard',     ctrl.getDashboard);
router.get('/revenue',       ctrl.getRevenue);
router.get('/bookings',      ctrl.getBookings);
router.get('/customers',     ctrl.getCustomers);
router.get('/reviews',       ctrl.getReviews);
router.get('/tattoo-styles', ctrl.getTattooStyles);
router.get('/performance',   ctrl.getPerformance);
router.get('/activity',      ctrl.getActivity);

module.exports = router;
