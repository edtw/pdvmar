// middlewares/verifyCpf.js
const mongoose = require('mongoose');
const Order = mongoose.model('Order');
const Customer = mongoose.model('Customer');

/**
 * Middleware to verify CPF matches the order's customer
 * Protects customer orders from unauthorized access
 */
exports.verifyCpfForOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { customerCpf } = req.body;

    // CPF is required for all customer operations
    if (!customerCpf) {
      return res.status(401).json({
        success: false,
        message: 'CPF é obrigatório para acessar este pedido.',
        requiresCpf: true
      });
    }

    // Clean CPF
    const cpfClean = customerCpf.replace(/\D/g, '');
    if (cpfClean.length !== 11) {
      return res.status(400).json({
        success: false,
        message: 'CPF inválido.',
        invalidCpf: true
      });
    }

    // Find order with customer
    const order = await Order.findById(orderId).populate('customer');
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pedido não encontrado'
      });
    }

    // Verify order type
    if (order.orderType !== 'customer_self') {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Este não é um pedido de cliente.'
      });
    }

    // CRITICAL SECURITY: Verify CPF matches
    if (!order.customer || order.customer.cpf !== cpfClean) {
      console.warn(`[SECURITY] CPF mismatch attempt for order ${orderId}. Provided: ${cpfClean}, Expected: ${order.customer?.cpf}`);
      return res.status(403).json({
        success: false,
        message: 'CPF não autorizado para este pedido. Apenas o cliente que criou o pedido pode acessá-lo.',
        cpfMismatch: true
      });
    }

    // CPF verified - attach order to request for use in controller
    req.verifiedOrder = order;
    req.verifiedCustomer = order.customer;

    next();
  } catch (error) {
    console.error('Erro ao verificar CPF:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao verificar autorização',
      error: error.message
    });
  }
};

/**
 * Middleware to verify CPF for getting order (read-only)
 */
exports.verifyCpfForGetOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    // CPF should be in query params for GET requests
    const customerCpf = req.query.customerCpf || req.headers['x-customer-cpf'];

    // CPF is required
    if (!customerCpf) {
      return res.status(401).json({
        success: false,
        message: 'CPF é obrigatório para visualizar este pedido.',
        requiresCpf: true
      });
    }

    // Clean CPF
    const cpfClean = customerCpf.replace(/\D/g, '');
    if (cpfClean.length !== 11) {
      return res.status(400).json({
        success: false,
        message: 'CPF inválido.',
        invalidCpf: true
      });
    }

    // Find order with customer
    const order = await Order.findById(orderId).populate('customer');
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pedido não encontrado'
      });
    }

    // Verify CPF matches
    if (!order.customer || order.customer.cpf !== cpfClean) {
      console.warn(`[SECURITY] CPF mismatch attempt for viewing order ${orderId}`);
      return res.status(403).json({
        success: false,
        message: 'CPF não autorizado para visualizar este pedido.',
        cpfMismatch: true
      });
    }

    // CPF verified
    req.verifiedOrder = order;
    req.verifiedCustomer = order.customer;

    next();
  } catch (error) {
    console.error('Erro ao verificar CPF:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao verificar autorização',
      error: error.message
    });
  }
};
