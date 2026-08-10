/**
 * email.service.js
 *
 * All transactional email sending for His Inks Studio.
 * Provider: Nodemailer + Gmail SMTP
 *
 * Environment variables required:
 *   EMAIL_USER — Gmail address used to send emails, e.g. hustler42042099@gmail.com
 *   EMAIL_PASS — Gmail App Password (NOT your normal Gmail password).
 *                Generate one at: Google Account → Security → 2-Step Verification
 *                → App passwords → select "Mail" and your device → Generate.
 *   EMAIL_FROM — Display name + address shown in the email client.
 *                e.g. "His Inks <hustler42042099@gmail.com>"
 *
 * This module is intentionally isolated from auth business logic.
 * Only sendPasswordResetEmail() is called from auth.service.js.
 */

const nodemailer = require('nodemailer');

// ── Transporter ───────────────────────────────────────────────────────────────
// Created lazily so the process can start even if env vars are not yet set
// (prevents startup crashes during CI or early boot).
let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;

  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user) throw new Error('EMAIL_USER is not configured. Email cannot be sent.');
  if (!pass) throw new Error('EMAIL_PASS is not configured. Email cannot be sent.');

  _transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });

  return _transporter;
}

// ── HTML email template ───────────────────────────────────────────────────────
/**
 * Builds the password reset email HTML.
 * All user-controlled content is escaped before insertion.
 * The reset token is server-generated and safe to embed in a URL.
 *
 * @param {string} resetUrl   — full reset URL with raw token
 * @param {string} firstName  — recipient's first name (escaped)
 * @param {number} expiresMin — token TTL in minutes (for display only)
 */
function buildPasswordResetHtml(resetUrl, firstName, expiresMin) {
  // Escape the firstName to prevent XSS if it somehow contains HTML chars.
  const safeName = String(firstName)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset your His Inks password</title>
  <style>
    body {
      margin: 0; padding: 0;
      background-color: #0a0a0a;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: #e5e5e5;
    }
    .wrapper {
      max-width: 520px;
      margin: 40px auto;
      padding: 0 16px;
    }
    .card {
      background-color: #111111;
      border: 1px solid rgba(255,255,255,0.08);
      padding: 40px 36px;
    }
    .logo {
      font-size: 22px;
      font-weight: 700;
      letter-spacing: 0.3em;
      text-transform: uppercase;
      color: #c9a96e;
      margin-bottom: 32px;
    }
    .logo span { color: #ffffff; }
    h1 {
      font-size: 24px;
      font-weight: 600;
      color: #ffffff;
      margin: 0 0 12px 0;
    }
    p {
      font-size: 14px;
      line-height: 1.7;
      color: rgba(255,255,255,0.6);
      margin: 0 0 20px 0;
    }
    .btn {
      display: inline-block;
      background-color: #c9a96e;
      color: #0a0a0a !important;
      text-decoration: none;
      font-size: 14px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 14px 32px;
      margin: 8px 0 28px 0;
    }
    .divider {
      border: none;
      border-top: 1px solid rgba(255,255,255,0.08);
      margin: 28px 0;
    }
    .small {
      font-size: 12px;
      color: rgba(255,255,255,0.3);
      line-height: 1.6;
    }
    .small a {
      color: rgba(255,255,255,0.4);
      word-break: break-all;
    }
    .footer {
      margin-top: 32px;
      font-size: 11px;
      color: rgba(255,255,255,0.2);
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="logo">His <span>Inks</span></div>

      <h1>Reset your password</h1>

      <p>Hi ${safeName},</p>

      <p>
        We received a request to reset the password for your His Inks account.
        Click the button below to choose a new password. This link is valid for
        <strong style="color:#e5e5e5;">${expiresMin} minutes</strong>.
      </p>

      <a href="${resetUrl}" class="btn">Reset Password</a>

      <hr class="divider" />

      <p class="small">
        If the button doesn't work, copy and paste this link into your browser:
        <br />
        <a href="${resetUrl}">${resetUrl}</a>
      </p>

      <hr class="divider" />

      <p class="small">
        <strong style="color:rgba(255,255,255,0.5);">Didn't request this?</strong>
        You can safely ignore this email. Your password will not be changed unless
        you click the link above. If you're concerned about your account security,
        please contact us.
      </p>
    </div>

    <div class="footer">
      &copy; ${new Date().getFullYear()} His Inks Studio. All rights reserved.
    </div>
  </div>
</body>
</html>`;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Sends the password reset email via Nodemailer + Gmail SMTP.
 *
 * @param {object} options
 * @param {string} options.to         — recipient email address (the customer)
 * @param {string} options.firstName  — recipient first name (for personalisation)
 * @param {string} options.resetUrl   — full reset URL containing the raw token
 * @param {number} options.expiresMin — token TTL in minutes (shown in email body)
 * @throws  if EMAIL_USER/EMAIL_PASS/EMAIL_FROM is missing or SMTP returns an error
 */
async function sendPasswordResetEmail({ to, firstName, resetUrl, expiresMin }) {
  const from = process.env.EMAIL_FROM;
  if (!from) {
    throw new Error('EMAIL_FROM is not configured. Email cannot be sent.');
  }

  const transporter = getTransporter();
  const html        = buildPasswordResetHtml(resetUrl, firstName, expiresMin);

  try {
    await transporter.sendMail({
      from,
      to,
      subject: 'Reset your His Inks password',
      html,
    });
  } catch (err) {
    // Log safe error info only — never log EMAIL_PASS, reset token, or full URL
    console.error('[EmailService] Nodemailer error:', err.code || 'UNKNOWN', err.message);
    throw new Error('Failed to send password reset email. Please try again later.');
  }
}

module.exports = { sendPasswordResetEmail };
