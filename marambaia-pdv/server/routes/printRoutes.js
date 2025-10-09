// routes/printRoutes.js
const express = require('express');
const router = express.Router();
const printController = require('../controllers/printController');
const { protect } = require('../middlewares/auth');

// Imprimir comanda
router.post('/receipt/:id', protect, printController.printReceipt);

// Testar impressora
router.post('/test', protect, printController.testPrinter);

// Listar impressoras
router.get('/printers', protect, printController.listPrinters);

module.exports = router;