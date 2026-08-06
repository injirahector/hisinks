const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Signs a JWT for the given user id and role.
 * @param {object} payload  - { id, role }
 * @returns {string} signed token
 */
function generateToken(payload) {
  if (!JWT_SECRET) throw new Error('JWT_SECRET is not defined in environment');
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verifies a JWT and returns the decoded payload.
 * Throws if invalid or expired.
 * @param {string} token
 * @returns {object} decoded payload
 */
function verifyToken(token) {
  if (!JWT_SECRET) throw new Error('JWT_SECRET is not defined in environment');
  return jwt.verify(token, JWT_SECRET);
}

module.exports = { generateToken, verifyToken };
