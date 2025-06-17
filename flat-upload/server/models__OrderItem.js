// models/OrderItem.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OrderItemSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 1
  },
  unitPrice: {
    type: Number,
    required: true
  },
  notes: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'preparing', 'ready', 'delivered', 'canceled'],
    default: 'pending'
  },
  preparationStartTime: {
    type: Date
  },
  deliveryTime: {
    type: Date
  }
}, { timestamps: true });

// Calcular o total do item (virtual property)
OrderItemSchema.virtual('total').get(function() {
  return this.quantity * this.unitPrice;
});

module.exports = mongoose.model('OrderItem', OrderItemSchema);