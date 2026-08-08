/**
 * getImageUrl — safely resolve a tattoo/portfolio image URL.
 *
 * Handles three cases:
 *   1. Absolute Cloudinary URL  →  returned as-is (no prefix added)
 *      e.g. "https://res.cloudinary.com/demo/image/upload/v1/his-inks/tattoos/abc.jpg"
 *   2. Relative / legacy path   →  prefixed with the Render API base URL
 *      e.g. "/uploads/abc.jpg"  → "https://hisinks-api.onrender.com/uploads/abc.jpg"
 *   3. null / undefined / ""    →  returns the fallback placeholder
 *
 * The helper NEVER prefixes an absolute URL, so Cloudinary images are always
 * loaded directly from Cloudinary rather than being proxied through Vercel.
 *
 * @param {string|null|undefined} url       - Raw image URL from the API
 * @param {string}               [fallback] - URL to use when image is missing
 * @returns {string}
 */
const API_BASE =
  (import.meta.env.VITE_API_URL || 'http://localhost:5000/api')
    .replace(/\/api\/?$/, ''); // strip trailing "/api"

export function getImageUrl(url, fallback = '') {
  if (!url) return fallback;

  // Already an absolute URL — return as-is (covers https://res.cloudinary.com/…,
  // blob: preview URLs created by URL.createObjectURL(), and any other absolute URL
  // stored in the database).
  if (/^(https?|blob):\/\//i.test(url)) return url;

  // Relative path — prefix with the backend origin so it works both locally and
  // on production without hard-coding the Render URL.
  return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
}
