// routes/waiterCallRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const WaiterCall = require('../models/WaiterCall');

/**
 * Get all waiter calls (with filters)
 * Accessible by: admin, manager, waiter
 */
router.get('/', protect, authorize('admin', 'manager', 'waiter'), async (req, res) => {
  try {
    const { status, waiterId, tableId, startDate, endDate } = req.query;

    const filter = {};

    // Filter by status
    if (status) {
      filter.status = status;
    }

    // Filter by waiter (managers/admins can see all, waiters see only their own)
    if (req.user.role === 'waiter') {
      filter.waiter = req.user.id;
    } else if (waiterId) {
      filter.waiter = waiterId;
    }

    // Filter by table
    if (tableId) {
      filter.table = tableId;
    }

    // Filter by date range
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
      }
    }

    const calls = await WaiterCall.find(filter)
      .populate('table', 'number')
      .populate('customer', 'name cpf')
      .populate('waiter', 'name')
      .populate('order', '_id total')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({
      success: true,
      calls,
      count: calls.length
    });
  } catch (error) {
    console.error('[Waiter Calls] Error listing:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar chamadas',
      error: error.message
    });
  }
});

/**
 * Get pending calls for current waiter
 */
router.get('/pending', protect, authorize('waiter'), async (req, res) => {
  try {
    const calls = await WaiterCall.find({
      waiter: req.user.id,
      status: { $in: ['pending', 'attending'] }
    })
      .populate('table', 'number')
      .populate('customer', 'name')
      .populate('order', '_id total')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      calls,
      count: calls.length
    });
  } catch (error) {
    console.error('[Waiter Calls] Error getting pending:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar chamadas pendentes',
      error: error.message
    });
  }
});

/**
 * Update call status (mark as attending or resolved)
 */
router.put('/:id/status', protect, authorize('admin', 'manager', 'waiter'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!['attending', 'resolved', 'canceled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status inválido'
      });
    }

    const call = await WaiterCall.findById(id);

    if (!call) {
      return res.status(404).json({
        success: false,
        message: 'Chamada não encontrada'
      });
    }

    // Only waiter assigned or admin/manager can update
    if (req.user.role === 'waiter' && call.waiter?.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado'
      });
    }

    call.status = status;
    if (notes) {
      call.notes = notes;
    }

    // If transitioning to attending, set waiter if not set
    if (status === 'attending' && !call.waiter) {
      call.waiter = req.user.id;
    }

    await call.save();

    res.json({
      success: true,
      message: 'Status atualizado com sucesso',
      call
    });
  } catch (error) {
    console.error('[Waiter Calls] Error updating status:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar status',
      error: error.message
    });
  }
});

/**
 * Get statistics about waiter calls
 */
router.get('/stats', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) {
        dateFilter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.createdAt.$lte = new Date(endDate);
      }
    }

    const [
      totalCalls,
      pendingCalls,
      avgResponseTime,
      callsByReason
    ] = await Promise.all([
      WaiterCall.countDocuments(dateFilter),
      WaiterCall.countDocuments({ ...dateFilter, status: 'pending' }),
      WaiterCall.aggregate([
        { $match: { ...dateFilter, responseTime: { $exists: true, $ne: null } } },
        { $group: { _id: null, avg: { $avg: '$responseTime' } } }
      ]),
      WaiterCall.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$reason', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ]);

    res.json({
      success: true,
      stats: {
        totalCalls,
        pendingCalls,
        avgResponseTime: avgResponseTime[0]?.avg || 0,
        callsByReason
      }
    });
  } catch (error) {
    console.error('[Waiter Calls] Error getting stats:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar estatísticas',
      error: error.message
    });
  }
});

module.exports = router;
