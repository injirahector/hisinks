const { verifyToken } = require('../utils/jwt.utils');
const User = require('../modules/users/user.model');

/**
 * Protects a route — verifies JWT from Authorization header or cookie.
 * Attaches req.user (safe object, no password) on success.
 */
async function protect(req, res, next) {
  try {
    let token;

    // 1. Check Authorization: Bearer <token>
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    // 2. Fall back to httpOnly cookie
    if (!token && req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authenticated. Please log in.' });
    }

    // Verify token
    const decoded = verifyToken(token);

    // Fetch user — also select deletedAt (select:false by default) so we can
    // immediately block accounts that have been deleted mid-session.
    const user = await User.findById(decoded.id).select('+deletedAt');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User no longer exists.' });
    }

    // Block deleted accounts immediately — even if their JWT has not expired yet
    if (user.deletedAt) {
      return res.status(401).json({ success: false, message: 'This account has been deleted.' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  }
}

/**
 * Restricts access to specific roles.
 * Must be used AFTER protect().
 * @param  {...string} roles  e.g. 'admin', 'artist'
 */
function restrictTo(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}.`,
      });
    }
    next();
  };
}

module.exports = { protect, restrictTo };
