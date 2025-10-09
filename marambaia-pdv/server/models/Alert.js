// models/Alert.js - System Alerts for Security and Management
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AlertSchema = new Schema({
  type: {
    type: String,
    enum: [
      'long_duration_table',      // Table occupied >2 hours
      'high_value_order',          // Order >R$500
      'blacklist_attempt',         // Blacklisted customer tried to order
      'cash_discrepancy',          // Cash register mismatch
      'stock_discrepancy',         // Inventory mismatch
      'high_value_cancellation',   // Expensive item cancelled
      'payment_issue',             // Payment verification failed
      'suspicious_activity',       // Fraud detection
      'system_error'               // Technical issues
    ],
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  // Related entities
  table: {
    type: Schema.Types.ObjectId,
    ref: 'Table'
  },
  order: {
    type: Schema.Types.ObjectId,
    ref: 'Order'
  },
  customer: {
    type: Schema.Types.ObjectId,
    ref: 'Customer'
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product'
  },
  // Alert metadata
  data: Schema.Types.Mixed,
  // Status
  status: {
    type: String,
    enum: ['pending', 'acknowledged', 'resolved', 'dismissed'],
    default: 'pending'
  },
  acknowledgedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  acknowledgedAt: Date,
  resolvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  resolvedAt: Date,
  resolutionNotes: String,
  // Notification tracking
  notified: {
    type: Boolean,
    default: false
  },
  notificationMethod: {
    type: String,
    enum: ['app', 'email', 'sms', 'webhook'],
    default: 'app'
  },
  notifiedAt: Date
}, { timestamps: true });

// Indexes
AlertSchema.index({ type: 1, status: 1, createdAt: -1 });
AlertSchema.index({ severity: 1, status: 1 });
AlertSchema.index({ table: 1 });
AlertSchema.index({ customer: 1 });

// Methods
AlertSchema.methods.acknowledge = function(userId) {
  this.status = 'acknowledged';
  this.acknowledgedBy = userId;
  this.acknowledgedAt = new Date();
  return this.save();
};

AlertSchema.methods.resolve = function(userId, notes) {
  this.status = 'resolved';
  this.resolvedBy = userId;
  this.resolvedAt = new Date();
  this.resolutionNotes = notes;
  return this.save();
};

AlertSchema.methods.dismiss = function(userId) {
  this.status = 'dismissed';
  this.resolvedBy = userId;
  this.resolvedAt = new Date();
  return this.save();
};

// Static methods for creating alerts
AlertSchema.statics.createLongDurationAlert = function(table, order, duration) {
  return this.create({
    type: 'long_duration_table',
    severity: duration > 180 ? 'high' : 'medium', // >3h = high, >2h = medium
    title: `Mesa ${table.number} ocupada há ${Math.floor(duration / 60)} horas`,
    message: `Mesa ${table.number} está ocupada há ${Math.floor(duration / 60)} horas sem pagamento. Total: R$ ${order.total.toFixed(2)}`,
    table: table._id,
    order: order._id,
    customer: order.customer,
    data: {
      duration: duration,
      orderTotal: order.total,
      itemCount: order.items.length
    }
  });
};

AlertSchema.statics.createHighValueOrderAlert = function(order, table) {
  return this.create({
    type: 'high_value_order',
    severity: order.total > 1000 ? 'high' : 'medium',
    title: `Pedido de alto valor: R$ ${order.total.toFixed(2)}`,
    message: `Mesa ${table.number} possui pedido de R$ ${order.total.toFixed(2)}. Atenção especial recomendada.`,
    table: table._id,
    order: order._id,
    customer: order.customer,
    data: {
      orderTotal: order.total,
      itemCount: order.items.length
    }
  });
};

AlertSchema.statics.createBlacklistAttemptAlert = function(customer, table) {
  return this.create({
    type: 'blacklist_attempt',
    severity: 'critical',
    title: `Cliente bloqueado tentou criar pedido`,
    message: `Cliente ${customer.name} (CPF: ${customer.cpf}) está bloqueado e tentou criar pedido na Mesa ${table.number}. Motivo: ${customer.blacklistReason}`,
    table: table._id,
    customer: customer._id,
    data: {
      customerName: customer.name,
      customerCpf: customer.cpf,
      blacklistReason: customer.blacklistReason,
      blacklistedAt: customer.blacklistedAt
    }
  });
};

AlertSchema.statics.createCashDiscrepancyAlert = function(cashRegister, discrepancy, user) {
  return this.create({
    type: 'cash_discrepancy',
    severity: Math.abs(discrepancy) > 100 ? 'high' : 'medium',
    title: `Divergência no caixa: R$ ${Math.abs(discrepancy).toFixed(2)}`,
    message: `Caixa ${cashRegister._id} possui divergência de R$ ${Math.abs(discrepancy).toFixed(2)}. Operador: ${user.name}`,
    user: user._id,
    data: {
      cashRegisterId: cashRegister._id,
      expected: cashRegister.expectedBalance,
      actual: cashRegister.currentBalance,
      discrepancy: discrepancy,
      operator: user.name
    }
  });
};

AlertSchema.statics.createStockDiscrepancyAlert = function(product, expected, actual) {
  const discrepancy = expected - actual;
  return this.create({
    type: 'stock_discrepancy',
    severity: Math.abs(discrepancy) > 10 ? 'high' : 'medium',
    title: `Divergência de estoque: ${product.name}`,
    message: `Produto ${product.name} tem divergência de ${Math.abs(discrepancy)} unidades. Esperado: ${expected}, Real: ${actual}`,
    product: product._id,
    data: {
      productName: product.name,
      expected: expected,
      actual: actual,
      discrepancy: discrepancy,
      percentage: ((discrepancy / expected) * 100).toFixed(2)
    }
  });
};

module.exports = mongoose.model('Alert', AlertSchema);
