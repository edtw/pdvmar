// models/WaiterCall.js
const mongoose = require('mongoose');

const WaiterCallSchema = new mongoose.Schema({
  table: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Table',
    required: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  waiter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reason: {
    type: String,
    enum: [
      'assistance',      // Precisa de ajuda
      'order',          // Fazer pedido
      'bill',           // Pedir conta
      'complaint',      // Reclamação
      'question',       // Dúvida
      'other'          // Outro
    ],
    default: 'assistance'
  },
  customReason: {
    type: String,
    maxlength: 200
  },
  status: {
    type: String,
    enum: ['pending', 'attending', 'resolved', 'canceled'],
    default: 'pending'
  },
  respondedAt: {
    type: Date
  },
  resolvedAt: {
    type: Date
  },
  responseTime: {
    type: Number, // em segundos
    default: null
  },
  notes: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Índices para performance
WaiterCallSchema.index({ table: 1, status: 1 });
WaiterCallSchema.index({ waiter: 1, status: 1 });
WaiterCallSchema.index({ createdAt: -1 });

// Calcular tempo de resposta ao marcar como atendendo
WaiterCallSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'attending' && !this.respondedAt) {
    this.respondedAt = new Date();
    this.responseTime = Math.floor((this.respondedAt - this.createdAt) / 1000);
  }

  if (this.isModified('status') && this.status === 'resolved' && !this.resolvedAt) {
    this.resolvedAt = new Date();
  }

  next();
});

module.exports = mongoose.model('WaiterCall', WaiterCallSchema);
