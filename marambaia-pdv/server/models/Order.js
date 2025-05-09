// models/Order.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OrderSchema = new Schema({
  table: {
    type: Schema.Types.ObjectId,
    ref: 'Table',
    required: true
  },
  waiter: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    type: Schema.Types.ObjectId,
    ref: 'OrderItem'
  }],
  status: {
    type: String,
    enum: ['open', 'closed', 'canceled'],
    default: 'open'
  },
  total: {
    type: Number,
    default: 0
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'credit', 'debit', 'pix', 'other'],
    default: null
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending'
  },
  notes: {
    type: String
  },
  discount: {
    type: Number,
    default: 0
  },
  serviceCharge: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Middleware para calcular o total ao salvar (será implementado depois de OrderItem)
OrderSchema.pre('save', async function(next) {
  if (this.items && this.items.length > 0) {
    try {
      // Buscar modelo OrderItem diretamente para evitar referência circular
      const OrderItem = mongoose.model('OrderItem');
      
      // Buscar todos os itens e calcular o total
      const items = await OrderItem.find({ _id: { $in: this.items } });
      let total = 0;
      
      items.forEach(item => {
        total += item.quantity * item.unitPrice;
      });
      
      // Aplicar desconto e taxa de serviço
      total = total - this.discount + this.serviceCharge;
      
      this.total = total > 0 ? total : 0;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    this.total = 0;
    next();
  }
});

module.exports = mongoose.model('Order', OrderSchema);