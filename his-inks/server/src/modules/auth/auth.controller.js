const authService = require('./auth.service');
const { validateRegister, validateLogin, validateForgotPassword, validateResetPassword } = require('./auth.validation');

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
};

// ── POST /api/auth/register ───────────────────────────────────────────────────
async function register(req, res, next) {
  try {
    const { errors, isValid } = validateRegister(req.body);
    if (!isValid) {
      return res.status(422).json({ success: false, errors });
    }

    const { firstName, lastName, email, phone, password, referralCode } = req.body;
    const result = await authService.register({ firstName, lastName, email, phone, password, referralCode });

    // Set httpOnly cookie alongside the JSON token so both web and mobile are covered
    res.cookie('token', result.token, COOKIE_OPTIONS);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/auth/login ──────────────────────────────────────────────────────
async function login(req, res, next) {
  try {
    const { errors, isValid } = validateLogin(req.body);
    if (!isValid) {
      return res.status(422).json({ success: false, errors });
    }

    const { email, password } = req.body;
    const result = await authService.login({ email, password });

    res.cookie('token', result.token, COOKIE_OPTIONS);

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/auth/me  (protected) ─────────────────────────────────────────────
async function getMe(req, res, next) {
  try {
    const user = await authService.getMe(req.user._id);
    return res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/auth/logout ─────────────────────────────────────────────────────
function logout(req, res) {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
  return res.status(200).json({ success: true, message: 'Logged out successfully.' });
}

// ── POST /api/auth/google ─────────────────────────────────────────────────────
// Accepts a Google Identity Services credential (ID token) from the frontend,
// verifies it server-side, then finds or creates a customer account.
async function googleAuth(req, res, next) {
  try {
    const { credential, referralCode } = req.body;

    if (!credential) {
      return res.status(422).json({
        success: false,
        message: 'Google credential is required.',
      });
    }

    const result = await authService.googleAuth({ credential, referralCode });

    res.cookie('token', result.token, COOKIE_OPTIONS);

    return res.status(200).json({
      success: true,
      message: 'Authenticated with Google.',
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/auth/forgot-password ───────────────────────────────────────────
// Enumeration-safe: always returns 200 with the same message whether the
// email exists or not. Email failures are logged server-side but the client
// still receives the generic success response (we don't want to reveal
// whether a valid email was found).
async function forgotPassword(req, res, next) {
  try {
    const { errors, isValid } = validateForgotPassword(req.body);
    if (!isValid) {
      return res.status(422).json({ success: false, errors });
    }

    const { email } = req.body;

    try {
      await authService.requestPasswordReset(email);
    } catch (serviceErr) {
      // Log server-side (e.g. email delivery failure) but do NOT surface the
      // error to the client — the response must always look identical.
      console.error('[Auth] forgotPassword service error:', serviceErr.message);
    }

    // Always return the same response — never reveal account existence
    return res.status(200).json({
      success: true,
      message: "If an account exists with that email, we've sent password reset instructions.",
    });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/auth/reset-password ────────────────────────────────────────────
async function resetPassword(req, res, next) {
  try {
    const { errors, isValid } = validateResetPassword(req.body);
    if (!isValid) {
      return res.status(422).json({ success: false, errors });
    }

    const { token, password } = req.body;
    await authService.resetPassword(token, password);

    return res.status(200).json({
      success: true,
      message: 'Your password has been reset successfully. You can now log in.',
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, getMe, logout, googleAuth, forgotPassword, resetPassword };

