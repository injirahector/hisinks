const reportsService = require('./reports.service');

// ── Helper: parse date query params ──────────────────────────────────────────
function parseDates(query) {
  const { startDate, endDate } = query;
  return {
    startDate: startDate || null,
    endDate:   endDate   || null,
  };
}

// ── GET /api/admin/reports/dashboard ─────────────────────────────────────────
async function getDashboard(req, res, next) {
  try {
    const { startDate, endDate } = parseDates(req.query);
    const [summary, sparklines] = await Promise.all([
      reportsService.getDashboardSummary(startDate, endDate),
      reportsService.getSparklines(),
    ]);
    res.json({ success: true, data: { ...summary, sparklines } });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/admin/reports/revenue ───────────────────────────────────────────
async function getRevenue(req, res, next) {
  try {
    const { startDate, endDate } = parseDates(req.query);
    const data = await reportsService.getRevenue(startDate, endDate);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/admin/reports/bookings ──────────────────────────────────────────
async function getBookings(req, res, next) {
  try {
    const { startDate, endDate } = parseDates(req.query);
    const data = await reportsService.getBookingStats(startDate, endDate);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/admin/reports/customers ─────────────────────────────────────────
async function getCustomers(req, res, next) {
  try {
    const { startDate, endDate } = parseDates(req.query);
    const data = await reportsService.getCustomerStats(startDate, endDate);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/admin/reports/reviews ───────────────────────────────────────────
async function getReviews(req, res, next) {
  try {
    const { startDate, endDate } = parseDates(req.query);
    const data = await reportsService.getReviewStats(startDate, endDate);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/admin/reports/tattoo-styles ─────────────────────────────────────
async function getTattooStyles(req, res, next) {
  try {
    const { startDate, endDate } = parseDates(req.query);
    const data = await reportsService.getTattooStyleStats(startDate, endDate);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/admin/reports/performance ───────────────────────────────────────
async function getPerformance(req, res, next) {
  try {
    const { startDate, endDate } = parseDates(req.query);
    const data = await reportsService.getBusinessPerformance(startDate, endDate);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/admin/reports/activity ──────────────────────────────────────────
async function getActivity(req, res, next) {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 30, 100);
    const data  = await reportsService.getRecentActivity(limit);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDashboard,
  getRevenue,
  getBookings,
  getCustomers,
  getReviews,
  getTattooStyles,
  getPerformance,
  getActivity,
};
