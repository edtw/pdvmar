// controllers/qrcodeController.js
const mongoose = require('mongoose');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const Table = mongoose.model('Table');
const config = require('../config');

/**
 * Generate QR code for a table
 */
exports.generateQRCode = async (req, res) => {
  try {
    const { id } = req.params;

    // Only admin and manager can generate QR codes
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({
        success: false,
        message: 'Não autorizado'
      });
    }

    // Find table
    const table = await Table.findById(id);
    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Mesa não encontrada'
      });
    }

    // Generate unique token if not exists
    if (!table.qrToken) {
      table.qrToken = uuidv4();
    }

    // Generate QR code URL
    const customerAppUrl = process.env.CUSTOMER_APP_URL || 'http://localhost:3001';
    const qrUrl = `${customerAppUrl}/table/${table.qrToken}`;

    // Generate HIGH QUALITY QR code image for printing
    const qrCodeDataUrl = await QRCode.toDataURL(qrUrl, {
      errorCorrectionLevel: 'H', // High error correction for damaged/dirty prints
      type: 'image/png',
      width: 600, // Larger size for better print quality (doubled from 300)
      margin: 4, // More margin for physical printing
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // Save QR code URL to table
    table.qrCodeUrl = qrCodeDataUrl;
    await table.save();

    res.json({
      success: true,
      qrCode: qrCodeDataUrl,
      qrToken: table.qrToken,
      qrUrl,
      table
    });
  } catch (error) {
    console.error('Erro ao gerar QR code:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao gerar QR code',
      error: error.message
    });
  }
};

/**
 * Generate QR codes for all tables
 */
exports.generateAllQRCodes = async (req, res) => {
  try {
    // Only admin can generate all QR codes
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Não autorizado'
      });
    }

    const tables = await Table.find();
    const customerAppUrl = process.env.CUSTOMER_APP_URL || 'http://localhost:3001';
    const results = [];

    for (const table of tables) {
      try {
        // Generate unique token if not exists
        if (!table.qrToken) {
          table.qrToken = uuidv4();
        }

        // Generate QR code URL
        const qrUrl = `${customerAppUrl}/table/${table.qrToken}`;

        // Generate HIGH QUALITY QR code image for printing
        const qrCodeDataUrl = await QRCode.toDataURL(qrUrl, {
          errorCorrectionLevel: 'H', // High error correction
          type: 'image/png',
          width: 600, // High resolution for printing
          margin: 4 // Extra margin
        });

        // Save QR code URL to table
        table.qrCodeUrl = qrCodeDataUrl;
        await table.save();

        results.push({
          tableId: table._id,
          tableNumber: table.number,
          qrToken: table.qrToken,
          qrCodeUrl: qrCodeDataUrl
        });
      } catch (error) {
        console.error(`Erro ao gerar QR code para mesa ${table.number}:`, error);
        results.push({
          tableId: table._id,
          tableNumber: table.number,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `QR codes gerados para ${results.length} mesas`,
      results
    });
  } catch (error) {
    console.error('Erro ao gerar QR codes:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao gerar QR codes',
      error: error.message
    });
  }
};

/**
 * Get table by QR token (public endpoint)
 */
exports.getTableByToken = async (req, res) => {
  try {
    const { token } = req.params;

    const table = await Table.findOne({ qrToken: token })
      .populate('currentOrder')
      .populate('waiter', 'name');

    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Mesa não encontrada'
      });
    }

    // Return limited table information for customers
    res.json({
      success: true,
      table: {
        _id: table._id,
        number: table.number,
        status: table.status,
        currentOrder: table.currentOrder,
        waiter: table.waiter
      }
    });
  } catch (error) {
    console.error('Erro ao buscar mesa por token:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar mesa',
      error: error.message
    });
  }
};

/**
 * Regenerate QR code for a table (in case of security issues)
 */
exports.regenerateQRCode = async (req, res) => {
  try {
    const { id } = req.params;

    // Only admin can regenerate QR codes
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Não autorizado'
      });
    }

    // Find table
    const table = await Table.findById(id);
    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Mesa não encontrada'
      });
    }

    // Generate new token
    table.qrToken = uuidv4();

    // Generate new QR code URL
    const customerAppUrl = process.env.CUSTOMER_APP_URL || 'http://localhost:3001';
    const qrUrl = `${customerAppUrl}/table/${table.qrToken}`;

    // Generate HIGH QUALITY QR code image for printing
    const qrCodeDataUrl = await QRCode.toDataURL(qrUrl, {
      errorCorrectionLevel: 'H', // High error correction
      type: 'image/png',
      width: 600, // High resolution for printing
      margin: 4 // Extra margin
    });

    // Save QR code URL to table
    table.qrCodeUrl = qrCodeDataUrl;
    await table.save();

    res.json({
      success: true,
      message: 'QR code regenerado com sucesso',
      qrCode: qrCodeDataUrl,
      qrToken: table.qrToken,
      qrUrl,
      table
    });
  } catch (error) {
    console.error('Erro ao regenerar QR code:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao regenerar QR code',
      error: error.message
    });
  }
};
