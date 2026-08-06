const authService = require('./auth.service');
const { validateRegister, validateLogin } = require('./auth.validation');

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

    const { firstName, lastName, email, phone, password } = req.body;
    const result = await authService.register({ firstName, lastName, email, phone, password });

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

module.exports = { register, login, getMe, logout };
