const express = require('express');
const router = express.Router();

/**
 * GET /api/health
 * Returns the API status.
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'His Inks API is running',
  });
});

module.exports = router;
