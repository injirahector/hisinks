/**
 * @his-inks/utils
 *
 * Shared utility / helper functions used across web, mobile, and server.
 */

// ── Date helpers ──────────────────────────────────────────────────────────────

/**
 * Formats a Date object to a human-readable string.
 * @param {Date|string} date
 * @param {string} [locale='en-KE']
 * @returns {string}
 */
function formatDate(date, locale = 'en-KE') {
  return new Date(date).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// ── String helpers ────────────────────────────────────────────────────────────

/**
 * Capitalizes the first letter of each word in a string.
 * @param {string} str
 * @returns {string}
 */
function titleCase(str) {
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Truncates a string to a maximum length, appending "…" if cut.
 * @param {string} str
 * @param {number} maxLength
 * @returns {string}
 */
function truncate(str, maxLength) {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 1) + '…';
}

// ── Validation helpers ────────────────────────────────────────────────────────

/**
 * Returns true if the string is a valid email address.
 * @param {string} email
 * @returns {boolean}
 */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Returns true if the string looks like a Kenyan phone number.
 * Accepts formats: +2547XXXXXXXX, 07XXXXXXXX, 7XXXXXXXX
 * @param {string} phone
 * @returns {boolean}
 */
function isValidKenyanPhone(phone) {
  return /^(\+254|0)?[17]\d{8}$/.test(phone.replace(/\s/g, ''));
}

// ── Currency helpers ──────────────────────────────────────────────────────────

/**
 * Formats a number as Kenyan Shillings.
 * @param {number} amount
 * @returns {string}  e.g. "KSh 5,000"
 */
function formatKES(amount) {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
  }).format(amount);
}

module.exports = {
  formatDate,
  titleCase,
  truncate,
  isValidEmail,
  isValidKenyanPhone,
  formatKES,
};
