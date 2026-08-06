const multer = require('multer');

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

// ── Use memory storage — file goes directly to Cloudinary, nothing on disk ────
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const err = new Error(
      `Invalid file type "${file.mimetype}". Allowed types: jpg, jpeg, png, webp.`
    );
    err.statusCode = 422;
    cb(err, false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE_BYTES },
});

// ── Wrap multer to convert its errors into our standard error format ──────────
function uploadSingle(fieldName) {
  const handler = upload.single(fieldName);

  return (req, res, next) => {
    handler(req, res, (err) => {
      if (!err) return next();

      // multer size limit error
      if (err.code === 'LIMIT_FILE_SIZE') {
        err.message = 'File is too large. Maximum allowed size is 5 MB.';
        err.statusCode = 422;
      }

      // multer unexpected field
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        err.message = `Unexpected field "${err.field}". Use the "image" field for uploads.`;
        err.statusCode = 422;
      }

      next(err);
    });
  };
}

module.exports = { uploadSingle };
