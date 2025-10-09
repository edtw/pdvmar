// utils/addIndexes.js
// BUG FIX #7: Add MongoDB indexes for better performance

const mongoose = require('mongoose');

async function addIndexes() {
  try {
    console.log('[Indexes] Adding MongoDB indexes...');

    // Helper function to create index safely
    const createIndexSafe = async (collection, indexSpec, options = {}) => {
      try {
        await collection.createIndex(indexSpec, options);
      } catch (error) {
        // Ignore error if index already exists with different options
        if (error.code !== 86) { // 86 = IndexKeySpecsConflict
          throw error;
        }
      }
    };

    // Table indexes
    const Table = mongoose.model('Table');
    await createIndexSafe(Table.collection, { qrToken: 1 }, { unique: true, sparse: true });
    await createIndexSafe(Table.collection, { status: 1 });
    await createIndexSafe(Table.collection, { waiter: 1, status: 1 });
    console.log('[Indexes] ✓ Table indexes created');

    // Order indexes
    const Order = mongoose.model('Order');
    await createIndexSafe(Order.collection, { table: 1, status: 1 });
    await createIndexSafe(Order.collection, { customer: 1, status: 1 });
    await createIndexSafe(Order.collection, { createdAt: -1 });
    await createIndexSafe(Order.collection, { status: 1, createdAt: -1 });
    await createIndexSafe(Order.collection, { waiter: 1, status: 1 });
    console.log('[Indexes] ✓ Order indexes created');

    // OrderItem indexes
    const OrderItem = mongoose.model('OrderItem');
    await createIndexSafe(OrderItem.collection, { order: 1, status: 1 });
    await createIndexSafe(OrderItem.collection, { product: 1 });
    await createIndexSafe(OrderItem.collection, { status: 1, createdAt: -1 });
    console.log('[Indexes] ✓ OrderItem indexes created');

    // CashTransaction indexes
    const CashTransaction = mongoose.model('CashTransaction');
    await createIndexSafe(CashTransaction.collection, { cashRegister: 1, createdAt: -1 });
    await createIndexSafe(CashTransaction.collection, { type: 1, createdAt: -1 });
    await createIndexSafe(CashTransaction.collection, { order: 1 });
    console.log('[Indexes] ✓ CashTransaction indexes created');

    // Customer indexes
    const Customer = mongoose.model('Customer');
    await createIndexSafe(Customer.collection, { cpf: 1 }, { unique: true, sparse: true });
    await createIndexSafe(Customer.collection, { phone: 1 });
    await createIndexSafe(Customer.collection, { blacklisted: 1 });
    await createIndexSafe(Customer.collection, { visitCount: -1 });
    await createIndexSafe(Customer.collection, { lastVisit: -1 });
    console.log('[Indexes] ✓ Customer indexes created');

    // Product indexes
    const Product = mongoose.model('Product');
    await createIndexSafe(Product.collection, { category: 1, available: 1 });
    await createIndexSafe(Product.collection, { productType: 1 });
    await createIndexSafe(Product.collection, { available: 1, category: 1 });
    console.log('[Indexes] ✓ Product indexes created');

    // User indexes
    const User = mongoose.model('User');
    await createIndexSafe(User.collection, { role: 1, active: 1 });
    console.log('[Indexes] ✓ User indexes created');

    console.log('[Indexes] ✅ All indexes created successfully!');
  } catch (error) {
    console.error('[Indexes] ❌ Error creating indexes:', error);
    // Don't throw - allow server to continue even if indexes fail
  }
}

module.exports = { addIndexes };
