// routes/qrcodeRoutes.js
const express = require('express');
const router = express.Router();
const qrcodeController = require('../controllers/qrcodeController');
const { protect } = require('../middlewares/auth');

// Protected routes (require authentication)
router.post('/generate/:id', protect, qrcodeController.generateQRCode);
router.post('/generate-all', protect, qrcodeController.generateAllQRCodes);
router.post('/regenerate/:id', protect, qrcodeController.regenerateQRCode);

// Public route (no authentication required)
router.get('/table/:token', qrcodeController.getTableByToken);

module.exports = router;
