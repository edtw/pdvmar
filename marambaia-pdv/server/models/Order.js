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
    required: false, // Made optional for customer self-service orders
    default: null
  },
  customer: {
    type: Schema.Types.ObjectId,
    ref: 'Customer',
    default: null
  },
  orderType: {
    type: String,
    enum: ['waiter', 'customer_self'],
    default: 'waiter'
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
    // BUG FIX: Skip recalculation if total was manually set (to avoid transaction isolation issues)
    if (this.$locals.skipRecalculate) {
      console.log(`[Order] Skipping total recalculation for order ${this._id} (manually calculated)`);
      return next();
    }

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

      console.log(`[Order] Total recalculated for order ${this._id}: ${this.total}`);
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

// BUG FIX #2: Método para adicionar item com transação atômica
OrderSchema.statics.addItemSafe = async function(orderId, itemData) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const OrderItem = mongoose.model('OrderItem');

    // Create item
    const item = new OrderItem(itemData);
    await item.save({ session });

    // Add to order
    const order = await this.findById(orderId).session(session);
    if (!order) {
      throw new Error('Order not found');
    }

    order.items.push(item._id);

    // Recalculate total synchronously within transaction
    const allItems = await OrderItem.find({
      _id: { $in: order.items }
    }).session(session);

    let total = 0;
    allItems.forEach(i => {
      if (i.status !== 'canceled') {
        total += i.quantity * i.unitPrice;
      }
    });

    order.total = total - order.discount + order.serviceCharge;

    // BUG FIX: Set flag to skip middleware recalculation (avoids transaction isolation issues)
    order.$locals.skipRecalculate = true;

    console.log(`[Order.addItemSafe] Calculated total for order ${order._id}: ${order.total}`);

    await order.save({ session });

    await session.commitTransaction();
    return { order, item };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// BUG FIX #10: Método para remover item com transação atômica
OrderSchema.statics.removeItemSafe = async function(orderId, itemId) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const OrderItem = mongoose.model('OrderItem');

    // Find order
    const order = await this.findById(orderId).session(session);
    if (!order) {
      throw new Error('Order not found');
    }

    // Remove item from order array
    order.items = order.items.filter(id => id.toString() !== itemId);

    // Delete item
    await OrderItem.findByIdAndDelete(itemId).session(session);

    // Recalculate total synchronously within transaction
    const allItems = await OrderItem.find({
      _id: { $in: order.items }
    }).session(session);

    let total = 0;
    allItems.forEach(i => {
      if (i.status !== 'canceled') {
        total += i.quantity * i.unitPrice;
      }
    });

    order.total = total - order.discount + order.serviceCharge;

    // BUG FIX: Set flag to skip middleware recalculation (avoids transaction isolation issues)
    order.$locals.skipRecalculate = true;

    console.log(`[Order.removeItemSafe] Calculated total for order ${order._id}: ${order.total}`);

    await order.save({ session });

    await session.commitTransaction();
    return order;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

module.exports = mongoose.model('Order', OrderSchema);