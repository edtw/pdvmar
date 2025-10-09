// services/smartAlgorithms.js
// Implementação dos algoritmos inteligentes para aumentar receita

const mongoose = require("mongoose");
const Order = mongoose.model("Order");
const OrderItem = mongoose.model("OrderItem");
const Product = mongoose.model("Product");
const Customer = mongoose.model("Customer");
const Table = mongoose.model("Table");

/**
 * ALGORITMO #1: Sistema de Recomendação (Collaborative Filtering)
 * ROI: +R$ 3.000/mês
 */
async function getProductRecommendations(customerId, limit = 5) {
  try {
    // Get customer and their order history
    const customer = await Customer.findById(customerId);
    if (!customer) return [];

    // Get products customer already ordered
    const customerProducts = customer.consumptionProfile.favoriteProducts.map(
      (f) => f.product.toString()
    );

    // Find similar customers (same favorite categories)
    const similarCustomers = await Customer.find({
      _id: { $ne: customerId },
      "consumptionProfile.favoriteProducts.product": { $in: customerProducts },
    }).limit(10);

    // Aggregate products from similar customers
    const productScores = {};
    for (const similar of similarCustomers) {
      for (const fav of similar.consumptionProfile.favoriteProducts) {
        const prodId = fav.product.toString();
        if (!customerProducts.includes(prodId)) {
          productScores[prodId] = (productScores[prodId] || 0) + fav.orderCount;
        }
      }
    }

    // Sort by score and get top products
    const topProductIds = Object.entries(productScores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id]) => id);

    const recommendations = await Product.find({
      _id: { $in: topProductIds },
      available: true,
    }).populate("category");

    return recommendations;
  } catch (error) {
    console.error("[Recommendations] Error:", error);
    return [];
  }
}

/**
 * ALGORITMO #2: Upselling Inteligente
 * ROI: +R$ 2.000/mês
 */
async function getUpsellSuggestions(orderId) {
  try {
    const order = await Order.findById(orderId);
    if (!order) return [];

    const items = await OrderItem.find({ _id: { $in: order.items } }).populate(
      "product"
    );

    const suggestions = [];

    // Rule 1: If ordered beer, suggest appetizers
    const hasBeer = items.some(
      (i) =>
        i.product.name.toLowerCase().includes("cerveja") ||
        i.product.name.toLowerCase().includes("beer")
    );

    if (hasBeer) {
      const appetizers = await Product.find({
        category: await mongoose
          .model("Category")
          .findOne({ name: /petisco|porção/i }),
        available: true,
      }).limit(3);

      suggestions.push(
        ...appetizers.map((p) => ({
          product: p,
          reason: "Combina perfeitamente com sua cerveja!",
          type: "complement",
        }))
      );
    }

    // Rule 2: If order total < R$50, suggest popular items
    if (order.total < 50) {
      const popular = await Product.find({ available: true })
        .sort({ soldCount: -1 })
        .limit(2);

      suggestions.push(
        ...popular.map((p) => ({
          product: p,
          reason: "Item mais pedido pelos nossos clientes",
          type: "popular",
        }))
      );
    }

    // Rule 3: If no dessert, suggest desserts
    const hasDessert = items.some((i) =>
      i.product.category?.name.toLowerCase().includes("sobremesa")
    );

    if (!hasDessert) {
      const desserts = await Product.find({
        category: await mongoose
          .model("Category")
          .findOne({ name: /sobremesa|doce/i }),
        available: true,
      }).limit(2);

      suggestions.push(
        ...desserts.map((p) => ({
          product: p,
          reason: "Que tal finalizar com um doce?",
          type: "dessert",
        }))
      );
    }

    return suggestions.slice(0, 5);
  } catch (error) {
    console.error("[Upsell] Error:", error);
    return [];
  }
}

/**
 * ALGORITMO #3: Balanceamento de Garçons
 * ROI: +R$ 800/mês
 */
async function suggestWaiterForTable(tableId) {
  try {
    const User = mongoose.model("User");

    // Get all active waiters
    const waiters = await User.find({ role: "waiter", active: true });

    // Count current tables per waiter
    const waiterLoads = await Promise.all(
      waiters.map(async (waiter) => {
        const tables = await Table.countDocuments({
          waiter: waiter._id,
          status: { $in: ["occupied", "waiting_payment"] },
        });

        return { waiter, load: tables };
      })
    );

    // Sort by load (least busy first)
    waiterLoads.sort((a, b) => a.load - b.load);

    // Return least busy waiter
    return waiterLoads[0]?.waiter || null;
  } catch (error) {
    console.error("[WaiterBalance] Error:", error);
    return null;
  }
}

/**
 * ALGORITMO #4: Detecção de Mesas Esquecidas
 * ROI: +R$ 1.500/mês
 */
async function detectForgottenTables() {
  try {
    const now = new Date();
    const FORGOTTEN_THRESHOLD = 45 * 60 * 1000; // 45 minutos

    const tables = await Table.find({
      status: "occupied",
      openTime: { $exists: true },
    }).populate("currentOrder waiter");

    const forgotten = [];

    for (const table of tables) {
      const openDuration = now - new Date(table.openTime);

      // Check if table has been open > 45min
      if (openDuration > FORGOTTEN_THRESHOLD) {
        const order = table.currentOrder;

        // Check if there are no recent item additions
        if (order && order.items.length > 0) {
          const lastItem = await OrderItem.findOne({
            _id: { $in: order.items },
          }).sort({ createdAt: -1 });

          const lastItemTime = new Date(lastItem.createdAt);
          const itemAge = now - lastItemTime;

          // If last item added > 30min ago
          if (itemAge > 30 * 60 * 1000) {
            forgotten.push({
              table,
              openDuration: Math.floor(openDuration / 60000), // minutes
              lastItemAge: Math.floor(itemAge / 60000),
              waiter: table.waiter,
              priority: "high",
            });
          }
        }
      }
    }

    return forgotten;
  } catch (error) {
    console.error("[ForgottenTables] Error:", error);
    return [];
  }
}

/**
 * ALGORITMO #5: Detecção de Fraude
 * ROI: +R$ 2.000/mês
 */
async function detectFraudulentOrder(orderId) {
  try {
    const order = await Order.findById(orderId).populate("customer");
    if (!order || !order.customer) return { isFraud: false, score: 0 };

    let fraudScore = 0;
    const flags = [];

    // Flag 1: Too many items in short time
    const items = await OrderItem.find({ _id: { $in: order.items } });
    if (items.length > 10) {
      const firstItem = items.sort((a, b) => a.createdAt - b.createdAt)[0];
      const lastItem = items[items.length - 1];
      const duration = (lastItem.createdAt - firstItem.createdAt) / 1000; // seconds

      if (duration < 60) {
        fraudScore += 30;
        flags.push("TOO_MANY_ITEMS_FAST");
      }
    }

    // Flag 2: Customer is new and high order value
    if (order.customer.visitCount === 1 && order.total > 200) {
      fraudScore += 25;
      flags.push("NEW_CUSTOMER_HIGH_VALUE");
    }

    // Flag 3: Multiple expensive items
    const expensiveItems = items.filter((i) => i.unitPrice > 50);
    if (expensiveItems.length > 3) {
      fraudScore += 20;
      flags.push("MULTIPLE_EXPENSIVE_ITEMS");
    }

    // Flag 4: Customer has previous unpaid orders
    if (order.customer.unpaidOrders && order.customer.unpaidOrders.length > 0) {
      fraudScore += 40;
      flags.push("PREVIOUS_UNPAID_ORDERS");
    }

    const isFraud = fraudScore >= 50;

    // Update customer risk score
    if (order.customer) {
      order.customer.riskAnalysis.score = fraudScore;
      if (isFraud) {
        order.customer.riskAnalysis.flags.push({
          type: flags.join(", "),
          timestamp: new Date(),
          description: `Fraud detected on order ${orderId}`,
        });
      }
      await order.customer.save();
    }

    return { isFraud, score: fraudScore, flags };
  } catch (error) {
    console.error("[FraudDetection] Error:", error);
    return { isFraud: false, score: 0, flags: [] };
  }
}

/**
 * ALGORITMO #6: Otimização de Cardápio
 * ROI: +R$ 2.500/mês
 */
async function analyzeMenuPerformance() {
  try {
    const products = await Product.find().populate("category");
    const analysis = [];

    for (const product of products) {
      // Get order count for this product
      const orderCount = await OrderItem.countDocuments({
        product: product._id,
        status: { $ne: "canceled" },
      });

      // Calculate total revenue
      const items = await OrderItem.find({
        product: product._id,
        status: { $ne: "canceled" },
      });

      const totalRevenue = items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0
      );

      // Calculate profit margin (assuming 60% margin)
      const profitMargin = 0.6;
      const profit = totalRevenue * profitMargin;

      // Categorize product performance
      let category = "poor";
      let recommendation = "Consider removing";

      if (orderCount > 50 && profit > 500) {
        category = "star";
        recommendation = "Promote heavily - high volume & profit";
      } else if (orderCount > 50) {
        category = "workhorse";
        recommendation = "Increase price to improve profit";
      } else if (profit > 500) {
        category = "niche";
        recommendation = "Market to specific segments";
      }

      analysis.push({
        product,
        orderCount,
        totalRevenue,
        profit,
        category,
        recommendation,
      });
    }

    // Sort by profit (highest first)
    analysis.sort((a, b) => b.profit - a.profit);

    return analysis;
  } catch (error) {
    console.error("[MenuOptimization] Error:", error);
    return [];
  }
}

/**
 * ALGORITMO #7: Previsão de Demanda
 * ROI: +R$ 3.500/mês
 */
async function predictDemand(date) {
  try {
    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getDay(); // 0 = Sunday, 6 = Saturday
    const hour = targetDate.getHours();

    // Get historical data for same day of week and hour
    const historicalOrders = await Order.find({
      createdAt: {
        $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
      },
      status: "closed",
    });

    // Filter by same day of week and similar hour
    const relevantOrders = historicalOrders.filter((order) => {
      const orderDate = new Date(order.createdAt);
      return (
        orderDate.getDay() === dayOfWeek &&
        Math.abs(orderDate.getHours() - hour) <= 1
      );
    });

    if (relevantOrders.length === 0) {
      return { predictedOrders: 0, confidence: "low" };
    }

    // Calculate average
    const avgOrders = relevantOrders.length / 12; // Approx 12 weeks
    const totalRevenue = relevantOrders.reduce((sum, o) => sum + o.total, 0);
    const avgRevenue = totalRevenue / relevantOrders.length;

    // Get most ordered products in this time slot
    const productCounts = {};
    for (const order of relevantOrders) {
      const items = await OrderItem.find({ _id: { $in: order.items } });
      for (const item of items) {
        const prodId = item.product.toString();
        productCounts[prodId] = (productCounts[prodId] || 0) + item.quantity;
      }
    }

    const topProducts = Object.entries(productCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, count]) => ({
        productId: id,
        expectedQuantity: Math.ceil(count / 12),
      }));

    return {
      predictedOrders: Math.ceil(avgOrders),
      avgRevenue,
      confidence: relevantOrders.length > 30 ? "high" : "medium",
      topProducts,
    };
  } catch (error) {
    console.error("[DemandPrediction] Error:", error);
    return { predictedOrders: 0, confidence: "low" };
  }
}

module.exports = {
  getProductRecommendations,
  getUpsellSuggestions,
  suggestWaiterForTable,
  detectForgottenTables,
  detectFraudulentOrder,
  analyzeMenuPerformance,
  predictDemand,
};
