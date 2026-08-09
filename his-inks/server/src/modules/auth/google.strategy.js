/**
 * google.strategy.js
 *
 * Verifies a Google Identity Services (GIS) credential (ID token) using
 * Google's official `google-auth-library` and returns a normalized profile.
 *
 * This is called by auth.service.googleAuth() — it never touches the database
 * directly. Database logic lives in the service layer.
 */

const { OAuth2Client } = require('google-auth-library');

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

// Re-use the same client instance across requests
const client = new OAuth2Client(CLIENT_ID);

/**
 * Verifies a Google ID token credential and returns the user's profile.
 *
 * @param {string} credential  — the JWT credential from Google GIS
 * @returns {{ googleId, email, firstName, lastName, picture }}
 * @throws  if the token is invalid, expired, or issued for a different client
 */
async function verifyGoogleToken(credential) {
  if (!CLIENT_ID) {
    throw new Error('GOOGLE_CLIENT_ID is not configured on the server.');
  }

  const ticket = await client.verifyIdToken({
    idToken:  credential,
    audience: CLIENT_ID,
  });

  const payload = ticket.getPayload();

  if (!payload) {
    const err = new Error('Google token verification failed.');
    err.statusCode = 401;
    throw err;
  }

  if (!payload.email_verified) {
    const err = new Error('Google account email is not verified.');
    err.statusCode = 401;
    throw err;
  }

  const firstName = payload.given_name  || payload.name?.split(' ')[0] || 'User';
  const lastName  = payload.family_name
                    || payload.name?.split(' ').slice(1).join(' ').trim()
                    || firstName; // single-name accounts: use firstName as lastName

  return {
    googleId:  payload.sub,
    email:     payload.email.toLowerCase().trim(),
    firstName,
    lastName,
    picture:   payload.picture || null,
  };
}

module.exports = { verifyGoogleToken };
