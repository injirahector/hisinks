const Booking      = require('../bookings/booking.model');
const Consultation = require('../consultations/consultation.model');
const Review       = require('../reviews/review.model');
const User         = require('../users/user.model');
const Tattoo       = require('../tattoos/tattoo.model');

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build a Mongoose date range filter object.
 * If neither bound is provided, no date filter is applied.
 */
function dateFilter(startDate, endDate, field = 'createdAt') {
  if (!startDate && !endDate) return {};
  const f = {};
  if (startDate) f.$gte = new Date(startDate);
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    f.$lte = end;
  }
  return { [field]: f };
}

/**
 * Previous-period start/end for percentage-change calculations.
 * Returns the same duration shifted one period back.
 */
function previousPeriod(startDate, endDate) {
  if (!startDate || !endDate) return { prevStart: null, prevEnd: null };
  const start = new Date(startDate);
  const end   = new Date(endDate);
  const ms    = end - start;
  return {
    prevStart: new Date(start - ms - 1),
    prevEnd:   new Date(start - 1),
  };
}

function pctChange(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard summary
// ─────────────────────────────────────────────────────────────────────────────

async function getDashboardSummary(startDate, endDate) {
  const df = dateFilter(startDate, endDate);
  const { prevStart, prevEnd } = previousPeriod(startDate, endDate);
  const pdf = dateFilter(prevStart, prevEnd);

  const [
    totalBookings,
    pendingBookings,
    confirmedBookings,
    completedBookings,
    cancelledBookings,
    totalCustomers,
    reviewStats,
    consultationStats,
    // Previous period counts for % change
    prevTotalBookings,
    prevCompletedBookings,
    prevTotalCustomers,
  ] = await Promise.all([
    Booking.countDocuments(df),
    Booking.countDocuments({ ...df, status: 'pending' }),
    Booking.countDocuments({ ...df, status: 'confirmed' }),
    Booking.countDocuments({ ...df, status: 'completed' }),
    Booking.countDocuments({ ...df, status: 'cancelled' }),
    User.countDocuments({ role: 'customer', ...df }),
    Review.aggregate([
      { $match: df },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]),
    // Outstanding balances: consultations where deposit paid but final payment not done
    // We approximate outstanding = sum of agreedPrice - depositAmount for deposit_paid/booked consultations
    Consultation.aggregate([
      {
        $match: {
          ...df,
          depositStatus: 'paid',
          status: { $in: ['deposit_paid', 'booked'] },
        },
      },
      {
        $group: {
          _id: null,
          outstanding: {
            $sum: { $subtract: [{ $ifNull: ['$agreedPrice', 0] }, { $ifNull: ['$depositAmount', 0] }] },
          },
          depositTotal: { $sum: { $ifNull: ['$depositAmount', 0] } },
        },
      },
    ]),
    Booking.countDocuments(pdf),
    Booking.countDocuments({ ...pdf, status: 'completed' }),
    User.countDocuments({ role: 'customer', ...pdf }),
  ]);

  // Returning customers: users with more than 1 completed booking
  const returningResult = await Booking.aggregate([
    { $match: { ...df, status: 'completed', userId: { $ne: null } } },
    { $group: { _id: '$userId', count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
    { $count: 'total' },
  ]);
  const returningCustomers = returningResult[0]?.total ?? 0;

  const avgRating        = reviewStats[0]?.avg     ? +reviewStats[0].avg.toFixed(1) : 0;
  const outstandingBal   = consultationStats[0]?.outstanding   ?? 0;
  const depositsReceived = consultationStats[0]?.depositTotal   ?? 0;

  return {
    totalBookings,
    pendingBookings,
    confirmedBookings,
    completedBookings,
    cancelledBookings,
    totalCustomers,
    returningCustomers,
    avgRating,
    outstandingBalance: outstandingBal,
    depositsReceived,
    changes: {
      totalBookings:    pctChange(totalBookings,    prevTotalBookings),
      completedBookings: pctChange(completedBookings, prevCompletedBookings),
      totalCustomers:   pctChange(totalCustomers,   prevTotalCustomers),
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Revenue
// ─────────────────────────────────────────────────────────────────────────────

async function getRevenue(startDate, endDate) {
  const df = dateFilter(startDate, endDate);

  // Revenue from consultations with paid deposits
  const [monthlyRevenue, weeklyRevenue, depositStats, finalPaymentStats] = await Promise.all([
    // Monthly breakdown: sum agreedPrice for completed consultations per month
    Consultation.aggregate([
      {
        $match: {
          ...dateFilter(startDate, endDate, 'depositConfirmedAt'),
          depositStatus: 'paid',
        },
      },
      {
        $group: {
          _id: {
            year:  { $year: '$depositConfirmedAt' },
            month: { $month: '$depositConfirmedAt' },
          },
          depositRevenue: { $sum: { $ifNull: ['$depositAmount', 0] } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      {
        $project: {
          _id: 0,
          year:  '$_id.year',
          month: '$_id.month',
          depositRevenue: 1,
          count: 1,
        },
      },
    ]),

    // Weekly breakdown: last 12 weeks by deposit confirmed date
    Consultation.aggregate([
      {
        $match: {
          ...dateFilter(startDate, endDate, 'depositConfirmedAt'),
          depositStatus: 'paid',
        },
      },
      {
        $group: {
          _id: {
            year: { $isoWeekYear: '$depositConfirmedAt' },
            week: { $isoWeek: '$depositConfirmedAt' },
          },
          depositRevenue: { $sum: { $ifNull: ['$depositAmount', 0] } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.week': 1 } },
      {
        $project: {
          _id: 0,
          year: '$_id.year',
          week: '$_id.week',
          depositRevenue: 1,
          count: 1,
        },
      },
    ]),

    // Total deposits received
    Consultation.aggregate([
      { $match: { ...df, depositStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: { $ifNull: ['$depositAmount', 0] } }, count: { $sum: 1 } } },
    ]),

    // Final payments: agreedPrice minus deposit (estimated)
    Consultation.aggregate([
      { $match: { ...df, status: 'booked', depositStatus: 'paid' } },
      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $subtract: [
                { $ifNull: ['$agreedPrice', 0] },
                { $ifNull: ['$depositAmount', 0] },
              ],
            },
          },
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  // Today / this week / this month / this year totals
  const now   = new Date();
  const todayStart  = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart   = new Date(now); weekStart.setDate(now.getDate() - now.getDay());
  const monthStart  = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart   = new Date(now.getFullYear(), 0, 1);

  const periodRevenue = async (from) => {
    const res = await Consultation.aggregate([
      { $match: { depositConfirmedAt: { $gte: from }, depositStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: { $ifNull: ['$depositAmount', 0] } } } },
    ]);
    return res[0]?.total ?? 0;
  };

  const [revenueToday, revenueWeek, revenueMonth, revenueYear] = await Promise.all([
    periodRevenue(todayStart),
    periodRevenue(weekStart),
    periodRevenue(monthStart),
    periodRevenue(yearStart),
  ]);

  // Outstanding: deposit_paid/booked with remaining balance
  const outstandingRes = await Consultation.aggregate([
    {
      $match: {
        ...df,
        depositStatus: 'paid',
        status: { $in: ['deposit_paid', 'booked'] },
      },
    },
    {
      $group: {
        _id: null,
        total: {
          $sum: {
            $subtract: [{ $ifNull: ['$agreedPrice', 0] }, { $ifNull: ['$depositAmount', 0] }],
          },
        },
      },
    },
  ]);

  return {
    revenueToday,
    revenueWeek,
    revenueMonth,
    revenueYear,
    depositsReceived: depositStats[0]?.total ?? 0,
    finalPaymentsReceived: finalPaymentStats[0]?.total ?? 0,
    outstandingPayments: outstandingRes[0]?.total ?? 0,
    monthlyRevenue,
    weeklyRevenue,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Bookings
// ─────────────────────────────────────────────────────────────────────────────

async function getBookingStats(startDate, endDate) {
  const df = dateFilter(startDate, endDate);

  const [statusCounts, totalBookings, trendDaily, trendWeekly, trendMonthly, timeSlotData, sizeData] =
    await Promise.all([
      // Status breakdown
      Booking.aggregate([
        { $match: df },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),

      Booking.countDocuments(df),

      // Daily trend
      Booking.aggregate([
        { $match: df },
        {
          $group: {
            _id: {
              year:  { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day:   { $dayOfMonth: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
        {
          $project: {
            _id: 0,
            year: '$_id.year', month: '$_id.month', day: '$_id.day', count: 1,
          },
        },
      ]),

      // Weekly trend
      Booking.aggregate([
        { $match: df },
        {
          $group: {
            _id: {
              year: { $isoWeekYear: '$createdAt' },
              week: { $isoWeek: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.week': 1 } },
        {
          $project: {
            _id: 0,
            year: '$_id.year', week: '$_id.week', count: 1,
          },
        },
      ]),

      // Monthly trend
      Booking.aggregate([
        { $match: df },
        {
          $group: {
            _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        {
          $project: {
            _id: 0,
            year: '$_id.year', month: '$_id.month', count: 1,
          },
        },
      ]),

      // Time slot popularity (hour of preferredDate)
      Booking.aggregate([
        { $match: df },
        { $group: { _id: { $hour: '$preferredDate' }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $project: { _id: 0, hour: '$_id', count: 1 } },
      ]),

      // Size breakdown
      Booking.aggregate([
        { $match: df },
        { $group: { _id: '$size', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $project: { _id: 0, size: '$_id', count: 1 } },
      ]),
    ]);

  const statusMap = { pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
  statusCounts.forEach(({ _id, count }) => {
    if (_id in statusMap) statusMap[_id] = count;
  });

  const completionRate  = totalBookings > 0
    ? Math.round((statusMap.completed  / totalBookings) * 100) : 0;
  const cancellationRate = totalBookings > 0
    ? Math.round((statusMap.cancelled / totalBookings) * 100) : 0;

  // Busiest month & day from trend data
  const busiestMonth = trendMonthly.length
    ? trendMonthly.reduce((a, b) => (b.count > a.count ? b : a))
    : null;
  const busiestDay = trendDaily.length
    ? trendDaily.reduce((a, b) => (b.count > a.count ? b : a))
    : null;

  return {
    totalBookings,
    statusBreakdown: statusMap,
    completionRate,
    cancellationRate,
    trendDaily,
    trendWeekly,
    trendMonthly,
    timeSlots: timeSlotData,
    sizeBreakdown: sizeData,
    busiestMonth,
    busiestDay,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Customers
// ─────────────────────────────────────────────────────────────────────────────

async function getCustomerStats(startDate, endDate) {
  const df = dateFilter(startDate, endDate);

  const [totalCustomers, newCustomers, topCustomers, returningResult] = await Promise.all([
    User.countDocuments({ role: 'customer' }),

    User.countDocuments({ role: 'customer', ...df }),

    // Top customers by spend (via consultation agreedPrice)
    Consultation.aggregate([
      { $match: { ...df, depositStatus: 'paid' } },
      {
        $group: {
          _id: '$userId',
          totalSpent:      { $sum: { $ifNull: ['$agreedPrice', 0] } },
          totalVisits:     { $sum: 1 },
          lastAppointment: { $max: '$createdAt' },
          customerName:    { $first: '$customerName' },
          phone:           { $first: '$phone' },
          email:           { $first: '$email' },
        },
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 },
    ]),

    // Returning customers (more than 1 completed booking)
    Booking.aggregate([
      { $match: { ...df, status: 'completed', userId: { $ne: null } } },
      { $group: { _id: '$userId', count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } },
      { $count: 'total' },
    ]),
  ]);

  const returningCustomers = returningResult[0]?.total ?? 0;

  // Enrich top customers with their avg review rating
  const customerIds = topCustomers.map((c) => c._id).filter(Boolean);
  const ratings = customerIds.length
    ? await Review.aggregate([
        { $match: { customer: { $in: customerIds } } },
        { $group: { _id: '$customer', avg: { $avg: '$rating' } } },
      ])
    : [];

  const ratingMap = {};
  ratings.forEach(({ _id, avg }) => { ratingMap[String(_id)] = +avg.toFixed(1); });

  const enriched = topCustomers.map((c) => ({
    ...c,
    avgRating: ratingMap[String(c._id)] ?? null,
  }));

  return {
    totalCustomers,
    newCustomers,
    returningCustomers,
    topCustomers: enriched,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Reviews
// ─────────────────────────────────────────────────────────────────────────────

async function getReviewStats(startDate, endDate) {
  const df = dateFilter(startDate, endDate);

  const [aggregate, distribution, latestReviews] = await Promise.all([
    Review.aggregate([
      { $match: df },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          total:     { $sum: 1 },
        },
      },
    ]),

    // Star distribution
    Review.aggregate([
      { $match: df },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: -1 } },
      { $project: { _id: 0, stars: '$_id', count: 1 } },
    ]),

    // Latest 10 reviews
    Review.find(df)
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('customer', 'firstName lastName')
      .lean(),
  ]);

  const avgRating = aggregate[0]?.avgRating ? +aggregate[0].avgRating.toFixed(1) : 0;
  const total     = aggregate[0]?.total ?? 0;

  // Build full 1-5 distribution including zeros
  const distMap = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  distribution.forEach(({ stars, count }) => { distMap[stars] = count; });

  return {
    avgRating,
    total,
    distribution: [5, 4, 3, 2, 1].map((stars) => ({
      stars,
      count: distMap[stars],
      pct: total > 0 ? Math.round((distMap[stars] / total) * 100) : 0,
    })),
    latestReviews,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Tattoo style analytics
// ─────────────────────────────────────────────────────────────────────────────

async function getTattooStyleStats(startDate, endDate) {
  const df = dateFilter(startDate, endDate);

  // Count tattoos per category
  const [byCategory, totalTattoos] = await Promise.all([
    Tattoo.aggregate([
      { $match: df },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $project: { _id: 0, category: '$_id', count: 1 } },
    ]),
    Tattoo.countDocuments(df),
  ]);

  const withPct = byCategory.map((item) => ({
    ...item,
    pct: totalTattoos > 0 ? Math.round((item.count / totalTattoos) * 100) : 0,
  }));

  return { totalTattoos, byCategory: withPct };
}

// ─────────────────────────────────────────────────────────────────────────────
// Business performance
// ─────────────────────────────────────────────────────────────────────────────

async function getBusinessPerformance(startDate, endDate) {
  const df = dateFilter(startDate, endDate);

  const [consultStats, bookingStats, returnRate] = await Promise.all([
    Consultation.aggregate([
      { $match: { ...df, depositStatus: 'paid' } },
      {
        $group: {
          _id: null,
          avgBookingValue:  { $avg: { $ifNull: ['$agreedPrice',   0] } },
          avgDepositAmount: { $avg: { $ifNull: ['$depositAmount', 0] } },
          avgTattooPrice:   { $avg: { $ifNull: ['$agreedPrice',   0] } },
          count: { $sum: 1 },
        },
      },
    ]),

    Booking.aggregate([
      { $match: df },
      {
        $group: {
          _id: null,
          total:     { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        },
      },
    ]),

    // Repeat customer rate
    Booking.aggregate([
      { $match: { ...df, status: 'completed', userId: { $ne: null } } },
      { $group: { _id: '$userId', count: { $sum: 1 } } },
      {
        $group: {
          _id: null,
          total:     { $sum: 1 },
          returning: { $sum: { $cond: [{ $gt: ['$count', 1] }, 1, 0] } },
        },
      },
    ]),
  ]);

  const cs   = consultStats[0] ?? {};
  const bs   = bookingStats[0] ?? { total: 0, completed: 0 };
  const rr   = returnRate[0] ?? { total: 0, returning: 0 };

  return {
    avgBookingValue:    cs.avgBookingValue  ? Math.round(cs.avgBookingValue)  : 0,
    avgDepositAmount:   cs.avgDepositAmount ? Math.round(cs.avgDepositAmount) : 0,
    avgTattooPrice:     cs.avgTattooPrice   ? Math.round(cs.avgTattooPrice)   : 0,
    completionRate:     bs.total > 0 ? Math.round((bs.completed / bs.total) * 100) : 0,
    repeatCustomerRate: rr.total   > 0 ? Math.round((rr.returning  / rr.total)   * 100) : 0,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Recent activity timeline
// ─────────────────────────────────────────────────────────────────────────────

async function getRecentActivity(limit = 30) {
  // Pull recent events from multiple collections and merge into a timeline
  const [recentBookings, recentReviews, recentDeposits, recentConsults] = await Promise.all([
    Booking.find().sort({ createdAt: -1 }).limit(15).select('customerName status createdAt updatedAt preferredDate').lean(),
    Review.find().sort({ createdAt: -1 }).limit(10).populate('customer', 'firstName lastName').lean(),
    Consultation.find({ depositStatus: 'paid', depositConfirmedAt: { $ne: null } })
      .sort({ depositConfirmedAt: -1 }).limit(10).select('customerName depositAmount depositConfirmedAt').lean(),
    Consultation.find().sort({ createdAt: -1 }).limit(10).select('customerName status createdAt').lean(),
  ]);

  const events = [];

  recentBookings.forEach((b) => {
    events.push({
      type:  'booking_created',
      label: 'Booking Created',
      desc:  `${b.customerName} submitted a booking request`,
      date:  b.createdAt,
      status: b.status,
    });
    if (b.status === 'confirmed') {
      events.push({
        type:  'booking_confirmed',
        label: 'Booking Confirmed',
        desc:  `${b.customerName}'s booking was confirmed`,
        date:  b.updatedAt,
      });
    }
    if (b.status === 'completed') {
      events.push({
        type:  'booking_completed',
        label: 'Appointment Completed',
        desc:  `${b.customerName}'s tattoo session completed`,
        date:  b.updatedAt,
      });
    }
  });

  recentReviews.forEach((r) => {
    const name = r.customer
      ? `${r.customer.firstName} ${r.customer.lastName}`
      : 'A customer';
    events.push({
      type:  'review_submitted',
      label: 'Review Submitted',
      desc:  `${name} left a ${r.rating}-star review`,
      date:  r.createdAt,
      rating: r.rating,
    });
  });

  recentDeposits.forEach((c) => {
    events.push({
      type:  'deposit_paid',
      label: 'Deposit Paid',
      desc:  `${c.customerName} paid KSh ${(c.depositAmount || 0).toLocaleString()} deposit`,
      date:  c.depositConfirmedAt,
    });
  });

  recentConsults.forEach((c) => {
    events.push({
      type:  'consultation_opened',
      label: 'Consultation Opened',
      desc:  `${c.customerName} started a consultation`,
      date:  c.createdAt,
    });
  });

  // Sort newest first and return top `limit`
  events.sort((a, b) => new Date(b.date) - new Date(a.date));
  return events.slice(0, limit);
}

// ─────────────────────────────────────────────────────────────────────────────
// Sparkline data (7-point trend for summary cards)
// ─────────────────────────────────────────────────────────────────────────────

async function getSparklines() {
  // Last 7 days booking counts
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    days.push({ from: d, to: next });
  }

  const sparkBookings = await Promise.all(
    days.map((d) =>
      Booking.countDocuments({ createdAt: { $gte: d.from, $lt: d.to } })
    )
  );

  const sparkRevenue = await Promise.all(
    days.map(async (d) => {
      const res = await Consultation.aggregate([
        { $match: { depositConfirmedAt: { $gte: d.from, $lt: d.to }, depositStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: { $ifNull: ['$depositAmount', 0] } } } },
      ]);
      return res[0]?.total ?? 0;
    })
  );

  return { sparkBookings, sparkRevenue };
}

module.exports = {
  getDashboardSummary,
  getRevenue,
  getBookingStats,
  getCustomerStats,
  getReviewStats,
  getTattooStyleStats,
  getBusinessPerformance,
  getRecentActivity,
  getSparklines,
};
