const express = require('express');
const router = express.Router();
const uploadController = require('./upload.controller');
const { protect, restrictTo } = require('../../middleware/auth.middleware');
const { uploadSingle } = require('../../middleware/upload.middleware');

// POST /api/uploads/image  — any authenticated user (customer reference image)
router.post(
  '/image',
  protect,
  uploadSingle('image'),
  uploadController.uploadImage
);

// POST /api/uploads/tattoo-image  — admin only (portfolio uploads)
router.post(
  '/tattoo-image',
  protect,
  restrictTo('admin'),
  uploadSingle('image'),
  uploadController.uploadTattooImage
);

module.exports = router;
