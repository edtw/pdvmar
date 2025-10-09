// models/CashTransaction.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CashTransactionSchema = new Schema({
  // Tipo de transação (entrada, saída, sangria, fechamento)
  type: {
    type: String,
    enum: ['deposit', 'withdraw', 'drain', 'open', 'close'],
    required: true
  },
  // Valor da transação
  amount: {
    type: Number,
    required: true
  },
  // Caixa relacionado
  cashRegister: {
    type: Schema.Types.ObjectId,
    ref: 'CashRegister',
    required: true
  },
  // Usuário que realizou a transação
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Descrição/motivo da transação
  description: {
    type: String,
    default: ''
  },
  // Saldo anterior
  previousBalance: {
    type: Number,
    required: true
  },
  // Novo saldo após a transação
  newBalance: {
    type: Number,
    required: true
  },
  // Detalhes do pagamento (para fechamento de caixa)
  paymentDetails: {
    cash: { type: Number, default: 0 },
    credit: { type: Number, default: 0 },
    debit: { type: Number, default: 0 },
    pix: { type: Number, default: 0 },
    other: { type: Number, default: 0 }
  },
  // Referência para pedido (se aplicável)
  order: {
    type: Schema.Types.ObjectId,
    ref: 'Order',
    default: null
  },
  // Contagem de cédulas e moedas (opcional)
  cashCount: {
    notes: {
      200: { type: Number, default: 0 },
      100: { type: Number, default: 0 },
      50: { type: Number, default: 0 },
      20: { type: Number, default: 0 },
      10: { type: Number, default: 0 },
      5: { type: Number, default: 0 },
      2: { type: Number, default: 0 }
    },
    coins: {
      1: { type: Number, default: 0 },
      0.5: { type: Number, default: 0 },
      0.25: { type: Number, default: 0 },
      0.1: { type: Number, default: 0 },
      0.05: { type: Number, default: 0 },
      0.01: { type: Number, default: 0 }
    }
  },
  // Destino da sangria (quando type === 'drain')
  destination: {
    type: String,
    default: null
  },
  // Photo proof for security and accountability
  proofImage: {
    type: String,
    default: null
  },
  // Authorization for high-value transactions
  authorizedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  authorizationPin: String,
  // Reconciliation tracking
  reconciled: {
    type: Boolean,
    default: false
  },
  reconciledAt: Date,
  reconciledBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  reconciliationNotes: String,
  discrepancy: {
    type: Number,
    default: 0
  },
  // IP address for fraud detection
  ipAddress: String,
  // Device info
  deviceInfo: String
}, { timestamps: true });

module.exports = mongoose.model('CashTransaction', CashTransactionSchema);