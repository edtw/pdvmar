// models/Customer.js
const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  cpf: {
    type: String,
    trim: true,
    default: null,
    // BUG FIX #3: Complete CPF validation with check digits
    validate: {
      validator: function(v) {
        if (!v) return true; // CPF is optional

        const cpf = v.replace(/\D/g, '');

        // Check length
        if (cpf.length !== 11) return false;

        // Reject known invalid CPFs (all same digits)
        if (/^(\d)\1{10}$/.test(cpf)) return false;

        // Validate check digits
        let sum = 0;
        for (let i = 1; i <= 9; i++) {
          sum += parseInt(cpf[i - 1]) * (11 - i);
        }
        let remainder = (sum * 10) % 11;
        if (remainder === 10 || remainder === 11) remainder = 0;
        if (remainder !== parseInt(cpf[9])) return false;

        sum = 0;
        for (let i = 1; i <= 10; i++) {
          sum += parseInt(cpf[i - 1]) * (12 - i);
        }
        remainder = (sum * 10) % 11;
        if (remainder === 10 || remainder === 11) remainder = 0;
        if (remainder !== parseInt(cpf[10])) return false;

        return true;
      },
      message: 'CPF inválido. Verifique os números digitados.'
    }
  },
  phone: {
    type: String,
    trim: true,
    default: null
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    default: null
  },
  currentOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null
  },
  // Track customer visits
  visitCount: {
    type: Number,
    default: 1
  },
  lastVisit: {
    type: Date,
    default: Date.now
  },
  // For tracking returning customers
  orderHistory: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  }],
  // Blacklist system for non-paying customers
  blacklisted: {
    type: Boolean,
    default: false
  },
  blacklistReason: {
    type: String,
    default: null
  },
  blacklistedAt: {
    type: Date,
    default: null
  },
  blacklistedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  unpaidOrders: [{
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    amount: Number,
    date: Date,
    notes: String
  }],
  // LGPD Compliance
  gdprConsent: {
    dataStorage: {
      type: Boolean,
      required: true,
      default: true
    },
    marketing: {
      type: Boolean,
      default: false
    },
    consentDate: {
      type: Date,
      default: Date.now
    },
    consentIp: String
  },
  dataRetention: {
    canDelete: {
      type: Boolean,
      default: false
    },
    deleteAfter: Date,
    lastActive: {
      type: Date,
      default: Date.now
    }
  },
  // ========== SISTEMA DE FIDELIDADE E ANÁLISE DE PERFIL ==========
  loyaltyProgram: {
    points: {
      type: Number,
      default: 0
    },
    tier: {
      type: String,
      enum: ['bronze', 'silver', 'gold', 'platinum'],
      default: 'bronze'
    },
    totalSpent: {
      type: Number,
      default: 0
    },
    rewards: [{
      type: {
        type: String,
        enum: ['discount', 'free_item', 'points_multiplier'],
        required: true
      },
      value: Number,
      description: String,
      expiresAt: Date,
      used: {
        type: Boolean,
        default: false
      },
      usedAt: Date
    }]
  },
  // Perfil de consumo para recomendações
  consumptionProfile: {
    favoriteCategories: [{
      category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
      },
      orderCount: Number,
      totalSpent: Number
    }],
    favoriteProducts: [{
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
      },
      orderCount: Number,
      lastOrdered: Date
    }],
    avgOrderValue: {
      type: Number,
      default: 0
    },
    avgVisitDuration: {
      type: Number,
      default: 0
    },
    preferredTimeSlots: [{
      day: String, // 'monday', 'tuesday', etc
      hour: Number, // 0-23
      count: Number
    }],
    // Análise de comportamento
    behavior: {
      avgItemsPerOrder: Number,
      prefersBeverages: Boolean,
      prefersFood: Boolean,
      avgWaitTime: Number, // minutos até chamar conta
      tendencyToTip: Boolean,
      avgTipPercentage: Number
    }
  },
  // Tags automáticas para segmentação
  tags: [{
    type: String,
    enum: [
      'vip', 'frequent', 'big_spender', 'lunch_regular',
      'dinner_regular', 'weekend_visitor', 'beer_lover',
      'wine_enthusiast', 'food_explorer', 'quick_eater',
      'slow_diner', 'group_organizer', 'solo_diner'
    ]
  }],
  // Análise de risco (fraude)
  riskAnalysis: {
    score: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    flags: [{
      type: String,
      timestamp: Date,
      description: String
    }],
    lastReviewed: Date
  }
}, { timestamps: true });

// Index for faster CPF lookups
CustomerSchema.index({ cpf: 1 });
CustomerSchema.index({ blacklisted: 1 });

// CPF Encryption Methods (for enhanced security)
const crypto = require('crypto');

CustomerSchema.methods.encryptCPF = function(cpf) {
  if (!process.env.CPF_ENCRYPTION_KEY) {
    console.warn('CPF_ENCRYPTION_KEY not set, storing CPF in plain text');
    return cpf;
  }
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(process.env.CPF_ENCRYPTION_KEY, 'salt', 32);
  const iv = Buffer.alloc(16, 0);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(cpf, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
};

CustomerSchema.methods.decryptCPF = function(encryptedCPF) {
  if (!process.env.CPF_ENCRYPTION_KEY) {
    return encryptedCPF;
  }
  try {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(process.env.CPF_ENCRYPTION_KEY, 'salt', 32);
    const iv = Buffer.alloc(16, 0);
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encryptedCPF, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('CPF decryption failed:', error);
    return encryptedCPF;
  }
};

// Method to check if customer is blacklisted
CustomerSchema.methods.isBlacklisted = function() {
  return this.blacklisted === true;
};

// Method to blacklist customer
CustomerSchema.methods.addToBlacklist = function(reason, userId) {
  this.blacklisted = true;
  this.blacklistReason = reason;
  this.blacklistedAt = new Date();
  this.blacklistedBy = userId;
  return this.save();
};

// Method to remove from blacklist
CustomerSchema.methods.removeFromBlacklist = function() {
  this.blacklisted = false;
  this.blacklistReason = null;
  this.blacklistedAt = null;
  this.blacklistedBy = null;
  return this.save();
};

// Method to find or create customer
CustomerSchema.statics.findOrCreate = async function(customerData) {
  const { name, cpf, phone, email } = customerData;

  // If CPF provided, try to find existing customer
  if (cpf) {
    const cpfClean = cpf.replace(/\D/g, '');
    let customer = await this.findOne({ cpf: cpfClean });

    if (customer) {
      // Update visit count and last visit
      customer.visitCount += 1;
      customer.lastVisit = new Date();
      // Update name/phone/email if provided
      if (name) customer.name = name;
      if (phone) customer.phone = phone;
      if (email) customer.email = email;
      await customer.save();
      return customer;
    }
  }

  // Create new customer
  const newCustomer = new this({
    name,
    cpf: cpf ? cpf.replace(/\D/g, '') : null,
    phone,
    email
  });

  await newCustomer.save();
  return newCustomer;
};

// Update customer profile after order completion
CustomerSchema.methods.updateProfile = async function(order) {
  try {
    const OrderItem = mongoose.model('OrderItem');
    const items = await OrderItem.find({ _id: { $in: order.items } }).populate('product');

    // Update total spent and points
    this.loyaltyProgram.totalSpent += order.total;
    const pointsEarned = Math.floor(order.total / 10); // 1 point per R$10
    this.loyaltyProgram.points += pointsEarned;

    // Update tier based on total spent
    if (this.loyaltyProgram.totalSpent >= 5000) {
      this.loyaltyProgram.tier = 'platinum';
    } else if (this.loyaltyProgram.totalSpent >= 2000) {
      this.loyaltyProgram.tier = 'gold';
    } else if (this.loyaltyProgram.totalSpent >= 500) {
      this.loyaltyProgram.tier = 'silver';
    }

    // Update favorite products
    for (const item of items) {
      const existingFav = this.consumptionProfile.favoriteProducts.find(
        f => f.product.toString() === item.product._id.toString()
      );

      if (existingFav) {
        existingFav.orderCount += item.quantity;
        existingFav.lastOrdered = new Date();
      } else {
        this.consumptionProfile.favoriteProducts.push({
          product: item.product._id,
          orderCount: item.quantity,
          lastOrdered: new Date()
        });
      }
    }

    // Update avg order value
    const totalOrders = this.orderHistory.length;
    this.consumptionProfile.avgOrderValue =
      ((this.consumptionProfile.avgOrderValue * (totalOrders - 1)) + order.total) / totalOrders;

    // Auto-tag based on behavior
    this.updateTags();

    await this.save();
    return { pointsEarned, newTier: this.loyaltyProgram.tier };
  } catch (error) {
    console.error('Error updating customer profile:', error);
    throw error;
  }
};

// Auto-tag customers based on behavior
CustomerSchema.methods.updateTags = function() {
  const tags = [];

  // VIP (top 10% spenders)
  if (this.loyaltyProgram.totalSpent > 1000) {
    tags.push('vip');
  }

  // Frequent (5+ visits)
  if (this.visitCount >= 5) {
    tags.push('frequent');
  }

  // Big spender (avg order > R$100)
  if (this.consumptionProfile.avgOrderValue > 100) {
    tags.push('big_spender');
  }

  this.tags = tags;
};

// Get product recommendations for customer
CustomerSchema.methods.getRecommendations = async function(limit = 5) {
  const Product = mongoose.model('Product');

  // Get customer's favorite products
  const favoriteProductIds = this.consumptionProfile.favoriteProducts
    .sort((a, b) => b.orderCount - a.orderCount)
    .slice(0, 3)
    .map(f => f.product);

  // Get products from same categories as favorites
  const favoriteProducts = await Product.find({ _id: { $in: favoriteProductIds } });
  const categoryIds = [...new Set(favoriteProducts.map(p => p.category))];

  // Find similar products not yet ordered
  const recommendations = await Product.find({
    category: { $in: categoryIds },
    _id: { $nin: favoriteProductIds },
    available: true
  })
  .limit(limit)
  .populate('category');

  return recommendations;
};

module.exports = mongoose.model('Customer', CustomerSchema);
