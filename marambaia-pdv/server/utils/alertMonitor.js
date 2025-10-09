// utils/alertMonitor.js - Background monitoring for security alerts
const mongoose = require('mongoose');
const Table = mongoose.model('Table');
const Order = mongoose.model('Order');
const Alert = mongoose.model('Alert');

/**
 * Monitor tables for long occupation times
 * Runs every 15 minutes
 */
async function monitorLongDurationTables() {
  try {
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - (2 * 60 * 60 * 1000));

    // Find occupied tables for more than 2 hours with unpaid orders
    const tables = await Table.find({
      status: { $in: ['occupied', 'waiting_payment'] },
      openTime: { $lt: twoHoursAgo }
    }).populate({
      path: 'currentOrder',
      populate: { path: 'customer' }
    });

    for (const table of tables) {
      if (!table.currentOrder) continue;

      // Only alert if payment is still pending
      if (table.currentOrder.paymentStatus === 'paid') continue;

      const duration = Math.floor((now - new Date(table.openTime)) / (60 * 1000)); // minutes
      const durationHours = Math.floor(duration / 60);

      // Check if alert already exists for this table
      const existingAlert = await Alert.findOne({
        type: 'long_duration_table',
        table: table._id,
        status: { $in: ['pending', 'acknowledged'] },
        createdAt: { $gte: new Date(now.getTime() - (30 * 60 * 1000)) } // within last 30 min
      });

      if (!existingAlert) {
        await Alert.createLongDurationAlert(table, table.currentOrder, duration);
        console.log(`[AlertMonitor] Created long duration alert for Table ${table.number} (${durationHours}h)`);
      }
    }
  } catch (error) {
    console.error('[AlertMonitor] Error monitoring long duration tables:', error);
  }
}

/**
 * Monitor high-value orders
 */
async function monitorHighValueOrders() {
  try {
    const highValueThreshold = 500; // R$500
    const oneHourAgo = new Date(Date.now() - (60 * 60 * 1000));

    // Find recent high-value orders without alerts
    const orders = await Order.find({
      status: 'open',
      total: { $gte: highValueThreshold },
      createdAt: { $gte: oneHourAgo }
    }).populate('table customer');

    for (const order of orders) {
      // Check if alert already exists
      const existingAlert = await Alert.findOne({
        type: 'high_value_order',
        order: order._id
      });

      if (!existingAlert && order.table) {
        await Alert.createHighValueOrderAlert(order, order.table);
        console.log(`[AlertMonitor] Created high value alert for Order ${order._id} (R$ ${order.total.toFixed(2)})`);
      }
    }
  } catch (error) {
    console.error('[AlertMonitor] Error monitoring high value orders:', error);
  }
}

/**
 * Auto-cleanup old resolved alerts
 */
async function cleanupOldAlerts() {
  try {
    const thirtyDaysAgo = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000));

    const result = await Alert.deleteMany({
      status: { $in: ['resolved', 'dismissed'] },
      resolvedAt: { $lt: thirtyDaysAgo }
    });

    if (result.deletedCount > 0) {
      console.log(`[AlertMonitor] Cleaned up ${result.deletedCount} old alerts`);
    }
  } catch (error) {
    console.error('[AlertMonitor] Error cleaning up alerts:', error);
  }
}

/**
 * Start monitoring service
 */
function startMonitoring() {
  console.log('[AlertMonitor] Starting alert monitoring service...');

  // Run immediately on startup
  monitorLongDurationTables();
  monitorHighValueOrders();

  // Schedule monitoring tasks
  setInterval(monitorLongDurationTables, 15 * 60 * 1000); // Every 15 minutes
  setInterval(monitorHighValueOrders, 30 * 60 * 1000);    // Every 30 minutes
  setInterval(cleanupOldAlerts, 24 * 60 * 60 * 1000);     // Daily

  console.log('[AlertMonitor] Monitoring service started');
  console.log('[AlertMonitor] - Long duration tables: every 15 min');
  console.log('[AlertMonitor] - High value orders: every 30 min');
  console.log('[AlertMonitor] - Alert cleanup: daily');
}

module.exports = {
  startMonitoring,
  monitorLongDurationTables,
  monitorHighValueOrders,
  cleanupOldAlerts
};
