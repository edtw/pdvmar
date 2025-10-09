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
  },
  // Audit trail for tracking modifications
  modifications: [{
    field: String,
    oldValue: Schema.Types.Mixed,
    newValue: Schema.Types.Mixed,
    modifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    modifiedAt: {
      type: Date,
      default: Date.now
    },
    reason: String,
    ipAddress: String
  }],
  // Lock item after kitchen starts preparing
  locked: {
    type: Boolean,
    default: false
  },
  lockedAt: Date,
  lockedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  // Cancellation approval for high-value items
  cancellationRequested: {
    type: Boolean,
    default: false
  },
  cancellationRequestedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  cancellationApprovedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  cancellationReason: String
}, { timestamps: true });

// Calcular o total do item (virtual property)
OrderItemSchema.virtual('total').get(function() {
  return this.quantity * this.unitPrice;
});

// Methods for audit trail and locking
OrderItemSchema.methods.addModification = function(field, oldValue, newValue, userId, reason, ip) {
  this.modifications.push({
    field,
    oldValue,
    newValue,
    modifiedBy: userId,
    reason,
    ipAddress: ip,
    modifiedAt: new Date()
  });
  return this.save();
};

OrderItemSchema.methods.lockItem = function(userId) {
  this.locked = true;
  this.lockedAt = new Date();
  this.lockedBy = userId;
  return this.save();
};

OrderItemSchema.methods.isLocked = function() {
  return this.locked === true;
};

OrderItemSchema.methods.canModify = function() {
  // Cannot modify if locked or status is not pending
  return !this.locked && this.status === 'pending';
};

// Pre-save middleware to auto-lock when status changes from pending
OrderItemSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status !== 'pending' && !this.locked) {
    this.locked = true;
    this.lockedAt = new Date();
  }
  next();
});

module.exports = mongoose.model('OrderItem', OrderItemSchema);