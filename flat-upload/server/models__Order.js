// models/Order.js - CORRIGIDO
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

// Middleware para calcular o total ao salvar
OrderSchema.pre('save', async function(next) {
  try {
    // Verificar se há itens associados
    if (this.items && this.items.length > 0) {
      // Buscar modelo OrderItem diretamente para evitar referência circular
      const OrderItem = mongoose.model('OrderItem');
      
      // Buscar todos os itens e calcular o total
      const items = await OrderItem.find({ _id: { $in: this.items } });
      
      let total = 0;
      
      items.forEach(item => {
        // Considerar apenas itens não cancelados no cálculo do total
        if (item.status !== 'canceled') {
          total += item.quantity * item.unitPrice;
        }
      });
      
      // Aplicar desconto e taxa de serviço
      total = total - this.discount + this.serviceCharge;
      
      this.total = total > 0 ? total : 0;
    } else {
      this.total = 0;
    }
    
    next();
  } catch (error) {
    console.error("Erro ao calcular total do pedido:", error);
    next(error);
  }
});

// Método estático para recalcular o total de um pedido
OrderSchema.statics.recalculateTotal = async function(orderId) {
  try {
    const order = await this.findById(orderId);
    if (!order) return null;
    
    const OrderItem = mongoose.model('OrderItem');
    
    // Buscar todos os itens e calcular o total
    const items = await OrderItem.find({ _id: { $in: order.items } });
    let total = 0;
    
    items.forEach(item => {
      // Considerar apenas itens não cancelados no cálculo do total
      if (item.status !== 'canceled') {
        total += item.quantity * item.unitPrice;
      }
    });
    
    // Aplicar desconto e taxa de serviço
    total = total - order.discount + order.serviceCharge;
    
    order.total = total > 0 ? total : 0;
    await order.save();
    
    return order;
  } catch (error) {
    console.error('Erro ao recalcular total:', error);
    return null;
  }
};

module.exports = mongoose.model('Order', OrderSchema);