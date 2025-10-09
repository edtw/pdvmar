// models/WasteLog.js - Product Waste and Spoilage Tracking
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const WasteLogSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  reason: {
    type: String,
    enum: ['spoiled', 'damaged', 'expired', 'mistake', 'quality_issue', 'other'],
    required: true
  },
  reasonDetails: {
    type: String,
    default: ''
  },
  reportedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  // Photo proof of waste
  proofImage: {
    type: String,
    default: null
  },
  // Estimated value of waste
  estimatedValue: {
    type: Number,
    default: 0
  },
  // Date of waste occurrence
  wasteDate: {
    type: Date,
    default: Date.now
  },
  // Approval/rejection details
  approvalDate: Date,
  rejectionReason: String,
  // For inventory reconciliation
  inventoryAdjusted: {
    type: Boolean,
    default: false
  },
  adjustedAt: Date
}, { timestamps: true });

// Index for faster queries
WasteLogSchema.index({ product: 1, wasteDate: -1 });
WasteLogSchema.index({ reportedBy: 1 });
WasteLogSchema.index({ status: 1 });

// Methods
WasteLogSchema.methods.approve = async function(userId) {
  this.status = 'approved';
  this.approvedBy = userId;
  this.approvalDate = new Date();
  return this.save();
};

WasteLogSchema.methods.reject = async function(userId, reason) {
  this.status = 'rejected';
  this.approvedBy = userId;
  this.approvalDate = new Date();
  this.rejectionReason = reason;
  return this.save();
};

// Static method to get waste statistics
WasteLogSchema.statics.getWasteStats = async function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        status: 'approved',
        wasteDate: {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: '$product',
        totalQuantity: { $sum: '$quantity' },
        totalValue: { $sum: '$estimatedValue' },
        count: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'productInfo'
      }
    },
    {
      $unwind: '$productInfo'
    },
    {
      $project: {
        productName: '$productInfo.name',
        totalQuantity: 1,
        totalValue: 1,
        count: 1
      }
    },
    {
      $sort: { totalValue: -1 }
    }
  ]);
};

module.exports = mongoose.model('WasteLog', WasteLogSchema);
