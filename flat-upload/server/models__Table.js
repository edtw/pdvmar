// -----------------------------------------
// models/Table.js
const mongoose = require('mongoose');

const TableSchema = new mongoose.Schema({
  number: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['free', 'occupied', 'waiting_payment'],
    default: 'free'
  },
  occupants: {
    type: Number,
    default: 0
  },
  openTime: {
    type: Date,
    default: null
  },
  position: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 }
  },
  waiter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  active: {
    type: Boolean,
    default: true
  },
  currentOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null
  },
  section: {
    type: String,
    default: 'main'
  }
}, { timestamps: true });

module.exports = mongoose.model('Table', TableSchema);