const uploadService = require('./upload.service');

// ── POST /api/uploads/image  (authenticated — customers uploading reference images)
async function uploadImage(req, res, next) {
  try {
    if (!req.file) {
      return res.status(422).json({
        success: false,
        message: 'No image file provided. Send a multipart/form-data request with an "image" field.',
      });
    }

    const { url, publicId } = await uploadService.uploadImage(
      req.file.buffer,
      req.file.mimetype,
      'his-inks/references'
    );

    return res.status(200).json({
      success: true,
      message: 'Image uploaded successfully.',
      data: { url, publicId },
    });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/uploads/tattoo-image  (admin — portfolio uploads)
async function uploadTattooImage(req, res, next) {
  try {
    if (!req.file) {
      return res.status(422).json({
        success: false,
        message: 'No image file provided. Send a multipart/form-data request with an "image" field.',
      });
    }

    const { url, publicId } = await uploadService.uploadImage(
      req.file.buffer,
      req.file.mimetype,
      'his-inks/tattoos'
    );

    return res.status(200).json({
      success: true,
      message: 'Image uploaded successfully.',
      data: { url, publicId },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { uploadImage, uploadTattooImage };
