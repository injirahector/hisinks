const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const healthRouter        = require('./routes/health.routes');
const authRouter          = require('./modules/auth/auth.routes');
const userRouter          = require('./modules/users/user.routes');
const tattooRouter        = require('./modules/tattoos/tattoo.routes');
const bookingRouter       = require('./modules/bookings/booking.routes');
const uploadRouter        = require('./modules/uploads/upload.routes');
const availabilityRouter  = require('./modules/availability/availability.routes');
const consultationRouter  = require('./modules/consultations/consultation.routes');
const reviewRouter        = require('./modules/reviews/review.routes');
const reviewAdminRouter   = require('./modules/reviews/review.admin.routes');
const notificationRouter  = require('./modules/notifications/notification.routes');
const messageRouter       = require('./modules/messages/message.routes');
const reportsRouter       = require('./modules/reports/reports.routes');
const referralRouter      = require('./modules/referrals/referral.routes');
const referralAdminRouter = require('./modules/referrals/referral.admin.routes');

const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:8081', // Expo web
  'http://localhost:19006', // Expo web (older versions)
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/tattoos', tattooRouter);
app.use('/api/bookings', bookingRouter);
app.use('/api/uploads', uploadRouter);
app.use('/api/availability',   availabilityRouter);
app.use('/api/consultations',  consultationRouter);
app.use('/api/reviews',        reviewRouter);
app.use('/api/admin/reviews',  reviewAdminRouter);
app.use('/api/notifications',  notificationRouter);
app.use('/api/messages',       messageRouter);
app.use('/api/admin/reports',  reportsRouter);
app.use('/api/referrals',      referralRouter);
app.use('/api/admin/referrals', referralAdminRouter);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ── Global error handler ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err.stack);

  // Mongoose schema validation errors (field-level) → 422
  if (err.name === 'ValidationError') {
    const errors = {};
    Object.values(err.errors).forEach((e) => {
      errors[e.path] = e.message;
    });
    return res.status(422).json({ success: false, errors });
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

module.exports = app;
