// models/CashRegister.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CashRegisterSchema = new Schema({
  // Identificador do caixa (ex: "Caixa 1", "Caixa 2", etc.)
  identifier: {
    type: String,
    required: true,
    unique: true
  },
  // Valor atual em caixa
  currentBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  // Status do caixa (aberto ou fechado)
  status: {
    type: String,
    enum: ['open', 'closed'],
    default: 'closed'
  },
  // Usuário responsável pelo caixa (quando aberto)
  currentOperator: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // Data e hora da última abertura
  openedAt: {
    type: Date,
    default: null
  },
  // Data e hora do último fechamento
  closedAt: {
    type: Date,
    default: null
  },
  // Valor de abertura do caixa (para conferência no fechamento)
  openingBalance: {
    type: Number,
    default: 0
  },
  // Valor esperado no fechamento (calculado)
  expectedBalance: {
    type: Number,
    default: 0
  },
  // Contagem física de dinheiro no fechamento
  closingBalance: {
    type: Number,
    default: 0
  },
  // Diferença entre valor esperado e contagem física
  balanceDifference: {
    type: Number,
    default: 0
  },
  // Estabelecimento relacionado (para sistemas multi-estabelecimento)
  establishment: {
    type: Schema.Types.ObjectId,
    ref: 'Establishment',
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('CashRegister', CashRegisterSchema);