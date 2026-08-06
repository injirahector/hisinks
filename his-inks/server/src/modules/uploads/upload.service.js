const cloudinary = require('../../config/cloudinary');

/**
 * Uploads an image buffer to Cloudinary.
 * @param {Buffer} buffer   - File buffer from multer memoryStorage
 * @param {string} mimetype - e.g. 'image/jpeg'
 * @param {string} folder   - Cloudinary folder (default: 'his-inks/tattoos')
 * @returns {Promise<{url: string, publicId: string}>}
 */
function uploadImage(buffer, mimetype, folder = 'his-inks/tattoos') {
  return new Promise((resolve, reject) => {
    // Derive resource type and format from mimetype
    const mimeToExt = {
      'image/jpeg': 'jpg',
      'image/jpg':  'jpg',
      'image/png':  'png',
      'image/webp': 'webp',
    };
    const format = mimeToExt[mimetype] || 'jpg';

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        format,
        transformation: [
          // Normalise to a max 1200px wide, preserve aspect ratio
          { width: 1200, crop: 'limit' },
          { quality: 'auto:good' },
        ],
      },
      (error, result) => {
        if (error) {
          const err = new Error(`Cloudinary upload failed: ${error.message}`);
          err.statusCode = 502;
          return reject(err);
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );

    uploadStream.end(buffer);
  });
}

/**
 * Deletes an image from Cloudinary by its public_id.
 * Non-fatal — logs but does not throw if deletion fails.
 */
async function deleteImage(publicId) {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.warn(`⚠️  Could not delete Cloudinary image ${publicId}:`, err.message);
  }
}

module.exports = { uploadImage, deleteImage };
