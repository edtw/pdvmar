// -----------------------------------------
// models/Product.js
const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  price: {
    type: Number,
    required: true
  },
  image: {
    type: String
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  available: {
    type: Boolean,
    default: true
  },
  featured: {
    type: Boolean,
    default: false
  },
  preparationTime: {
    type: Number,
    default: 10  // tempo em minutos
  },
  productType: {
    type: String,
    enum: ['food', 'beverage'],
    required: true,
    default: 'food'
  }
}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);