// routes/printRoutes.js
const express = require('express');
const router = express.Router();
const printController = require('../controllers/printController');
const auth = require('../middlewares/auth');

// Imprimir comanda
router.post('/receipt/:id', auth, printController.printReceipt);

// Testar impressora
router.post('/test', auth, printController.testPrinter);

// Listar impressoras
router.get('/printers', auth, printController.listPrinters);

module.exports = router;