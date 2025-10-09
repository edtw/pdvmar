// routes/maintenanceRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const { runFullCleanup } = require('../utils/cleanupOrphanedData');

/**
 * @route   POST /api/maintenance/cleanup
 * @desc    Executar limpeza completa de dados órfãos
 * @access  Private (Admin only)
 */
router.post('/cleanup', protect, authorize('admin'), async (req, res) => {
  try {
    console.log(`[Maintenance] Limpeza iniciada por ${req.user.name}`);

    const results = await runFullCleanup();

    res.json({
      success: true,
      message: 'Limpeza executada com sucesso',
      results
    });
  } catch (error) {
    console.error('[Maintenance] Erro na limpeza:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao executar limpeza',
      error: error.message
    });
  }
});

module.exports = router;
