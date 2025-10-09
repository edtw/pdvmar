// middlewares/orderAccess.js
/**
 * Middleware to control access to occupied tables
 * Only allows: Admin, Customer (with matching CPF), Waiter, Kitchen, Manager
 */
const mongoose = require('mongoose');
const Order = mongoose.model('Order');
const Customer = mongoose.model('Customer');
const Table = mongoose.model('Table');

/**
 * Verify customer CPF matches the order's customer
 */
exports.verifyCustomerAccess = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { customerCpf } = req.body;

    // Find the order
    const order = await Order.findById(orderId).populate('customer table');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pedido não encontrado'
      });
    }

    // Only apply to customer self-service orders
    if (order.orderType !== 'customer_self') {
      return next();
    }

    // If table is occupied and has an order
    if (order.table.status === 'occupied' || order.table.status === 'waiting_payment') {
      // Customer must provide CPF
      if (!customerCpf) {
        return res.status(403).json({
          success: false,
          message: 'Mesa ocupada. Você precisa informar o CPF cadastrado para acessar.',
          requiresCpf: true
        });
      }

      // Clean CPF (remove formatting)
      const cpfClean = customerCpf.replace(/\D/g, '');

      // Verify CPF matches the order's customer
      if (order.customer.cpf !== cpfClean) {
        return res.status(403).json({
          success: false,
          message: 'CPF não corresponde ao cadastrado nesta mesa. Acesso negado.',
          invalidCpf: true
        });
      }
    }

    // CPF matches, allow access
    req.verifiedOrder = order;
    next();
  } catch (error) {
    console.error('Erro ao verificar acesso:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao verificar acesso',
      error: error.message
    });
  }
};

/**
 * Check if table is occupied and if user has permission
 * Used when creating a new command on an occupied table
 */
exports.verifyTableAccess = async (req, res, next) => {
  try {
    const { tableToken } = req.body;

    // Find table by QR token
    const table = await Table.findOne({ qrToken: tableToken }).populate('currentOrder');

    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Mesa não encontrada'
      });
    }

    // If table is free, allow access
    if (table.status === 'free' || !table.currentOrder) {
      req.verifiedTable = table;
      return next();
    }

    // Table is occupied - check if there's already a customer order
    const existingOrder = await Order.findById(table.currentOrder).populate('customer');

    if (existingOrder && existingOrder.orderType === 'customer_self') {
      const { cpf } = req.body;

      // Require CPF to access occupied table
      if (!cpf) {
        return res.status(403).json({
          success: false,
          message: 'Esta mesa já está ocupada. Informe o CPF cadastrado para acessar seu pedido.',
          requiresCpf: true,
          tableNumber: table.number
        });
      }

      // Clean CPF
      const cpfClean = cpf.replace(/\D/g, '');

      // Verify CPF matches
      if (existingOrder.customer.cpf !== cpfClean) {
        return res.status(403).json({
          success: false,
          message: 'CPF inválido. Esta mesa está sendo usada por outro cliente.',
          invalidCpf: true
        });
      }

      // CPF matches - return existing order instead of creating new one
      return res.status(200).json({
        success: true,
        message: 'Bem-vindo de volta!',
        existingOrder: true,
        order: existingOrder,
        customer: existingOrder.customer,
        table: {
          _id: table._id,
          number: table.number
        }
      });
    }

    // Table occupied by waiter - deny access
    if (existingOrder && existingOrder.orderType === 'waiter') {
      return res.status(403).json({
        success: false,
        message: 'Esta mesa está sendo atendida por um garçom. Por favor, solicite ajuda ao garçom.',
        occupiedByWaiter: true
      });
    }

    // Allow access
    req.verifiedTable = table;
    next();
  } catch (error) {
    console.error('Erro ao verificar mesa:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao verificar mesa',
      error: error.message
    });
  }
};

/**
 * Verify staff access (Admin, Waiter, Kitchen, Manager)
 * This allows staff to override customer restrictions
 */
exports.verifyStaffAccess = (req, res, next) => {
  // Check if user is authenticated (has JWT token)
  if (req.user) {
    const allowedRoles = ['admin', 'waiter', 'kitchen', 'manager'];

    if (allowedRoles.includes(req.user.role)) {
      req.isStaff = true;
      return next();
    }
  }

  // Not staff, continue to customer verification
  next();
};
