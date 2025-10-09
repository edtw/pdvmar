// controllers/analyticsController.js
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Table = require('../models/Table');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const mongoose = require('mongoose');

/**
 * ALGORITMO INTELIGENTE DE DETECÇÃO DE ATRASOS
 *
 * Considera múltiplos fatores:
 * - Tempo de preparo esperado do produto
 * - Quantidade de mesas abertas (carga do restaurante)
 * - Quantidade de pedidos pendentes
 * - Hora do dia (rush hours têm tolerância maior)
 * - Tipo de produto (bebidas vs comidas complexas)
 */
const calculateDelayStatus = (item, restaurantFlow) => {
  const now = new Date();
  const itemAge = (now - new Date(item.createdAt)) / 1000 / 60; // minutos

  // Tempo base esperado por tipo de produto
  let expectedTime = 15; // padrão: 15 minutos

  if (item.product?.productType === 'drink') {
    expectedTime = 5; // bebidas: 5 minutos
  } else if (item.product?.category?.name?.toLowerCase().includes('sobremesa')) {
    expectedTime = 8;
  } else if (item.product?.category?.name?.toLowerCase().includes('prato principal')) {
    expectedTime = 25;
  }

  // Ajustar baseado na carga do restaurante
  const { openTables, pendingItems, rushHour } = restaurantFlow;

  let adjustmentFactor = 1;

  // Mais de 80% das mesas ocupadas = +30% de tempo
  if (openTables > restaurantFlow.totalTables * 0.8) {
    adjustmentFactor += 0.3;
  }

  // Mais de 20 itens pendentes = +20% de tempo
  if (pendingItems > 20) {
    adjustmentFactor += 0.2;
  }

  // Rush hour (12h-14h ou 19h-22h) = +25% de tempo
  if (rushHour) {
    adjustmentFactor += 0.25;
  }

  const adjustedExpectedTime = expectedTime * adjustmentFactor;
  const warningThreshold = adjustedExpectedTime * 0.8; // 80% do tempo = warning
  const delayThreshold = adjustedExpectedTime; // 100% = atrasado

  let status = 'on_time';
  let severity = 'low';

  if (itemAge >= delayThreshold) {
    status = 'delayed';
    severity = itemAge > delayThreshold * 1.5 ? 'critical' : 'high';
  } else if (itemAge >= warningThreshold) {
    status = 'warning';
    severity = 'medium';
  }

  return {
    status,
    severity,
    itemAge: Math.round(itemAge),
    expectedTime: Math.round(adjustedExpectedTime),
    percentComplete: Math.round((itemAge / adjustedExpectedTime) * 100)
  };
};

const isRushHour = () => {
  const hour = new Date().getHours();
  return (hour >= 12 && hour <= 14) || (hour >= 19 && hour <= 22);
};

/**
 * GET /api/analytics/overview
 * Dashboard principal com métricas gerais
 */
exports.getOverview = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    // Total de pedidos e receita
    const orders = await Order.find({
      ...dateFilter,
      status: { $in: ['closed'] }
    });

    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = orders.length;

    const openOrders = await Order.countDocuments({ status: 'open' });

    const openTables = await Table.countDocuments({ status: 'occupied' });
    const totalTables = await Table.countDocuments();

    const uniqueCustomers = await Customer.countDocuments();

    const periodDays = endDate && startDate
      ? Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24))
      : 7;

    const previousPeriodStart = new Date();
    previousPeriodStart.setDate(previousPeriodStart.getDate() - (periodDays * 2));
    const previousPeriodEnd = new Date();
    previousPeriodEnd.setDate(previousPeriodEnd.getDate() - periodDays);

    const previousOrders = await Order.find({
      createdAt: { $gte: previousPeriodStart, $lte: previousPeriodEnd },
      status: 'closed'
    });

    const previousRevenue = previousOrders.reduce((sum, order) => sum + order.total, 0);
    const revenueGrowth = previousRevenue > 0
      ? Math.round(((totalRevenue - previousRevenue) / previousRevenue) * 100)
      : 0;

    res.json({
      success: true,
      data: {
        revenue: {
          total: totalRevenue,
          growth: revenueGrowth
        },
        orders: {
          total: totalOrders,
          open: openOrders
        },
        tables: {
          occupied: openTables,
          total: totalTables,
          occupancyRate: totalTables > 0 ? Math.round((openTables / totalTables) * 100) : 0
        },
        customers: {
          unique: uniqueCustomers
        }
      }
    });
  } catch (error) {
    console.error('[Analytics] Error in getOverview:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar visão geral' });
  }
};

/**
 * GET /api/analytics/peak-hours
 * Análise de horários de pico
 */
exports.getPeakHours = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    // Agrupar pedidos por hora do dia
    const hourlyOrders = await Order.aggregate([
      { $match: { ...dateFilter, status: { $in: ['open', 'closed'] } } },
      {
        $project: {
          hour: { $hour: '$createdAt' },
          dayOfWeek: { $dayOfWeek: '$createdAt' },
          total: 1
        }
      },
      {
        $group: {
          _id: '$hour',
          count: { $sum: 1 },
          revenue: { $sum: '$total' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Agrupar por dia da semana
    const weekdayOrders = await Order.aggregate([
      { $match: { ...dateFilter, status: { $in: ['open', 'closed'] } } },
      {
        $project: {
          dayOfWeek: { $dayOfWeek: '$createdAt' },
          total: 1
        }
      },
      {
        $group: {
          _id: '$dayOfWeek',
          count: { $sum: 1 },
          revenue: { $sum: '$total' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    res.json({
      success: true,
      data: {
        hourly: hourlyOrders.map(h => ({
          hour: `${h._id}:00`,
          orders: h.count,
          revenue: h.revenue
        })),
        weekly: weekdayOrders.map(d => ({
          day: dayNames[d._id - 1],
          dayNumber: d._id,
          orders: d.count,
          revenue: d.revenue
        }))
      }
    });
  } catch (error) {
    console.error('[Analytics] Error in getPeakHours:', error);
    res.status(500).json({ success: false, message: 'Erro ao analisar horários de pico' });
  }
};

/**
 * GET /api/analytics/delays
 * Sistema inteligente de detecção de atrasos
 */
exports.getDelayAnalysis = async (req, res) => {
  try {
    // Buscar contexto do restaurante
    const openTables = await Table.countDocuments({ status: 'occupied' });
    const totalTables = await Table.countDocuments();

    const pendingItems = await OrderItem.countDocuments({
      status: { $in: ['pending', 'preparing'] }
    });

    const rushHour = isRushHour();

    const restaurantFlow = {
      openTables,
      totalTables,
      pendingItems,
      rushHour
    };

    // CORREÇÃO: Buscar apenas itens de PEDIDOS ABERTOS
    const openOrders = await Order.find({ status: 'open' }).select('_id');
    const openOrderIds = openOrders.map(o => o._id);

    // Buscar todos os itens em preparo DE PEDIDOS ABERTOS
    const items = await OrderItem.find({
      order: { $in: openOrderIds },
      status: { $in: ['pending', 'preparing'] }
    })
      .populate('product', 'name productType category')
      .populate({
        path: 'product',
        populate: { path: 'category', select: 'name' }
      })
      .sort({ createdAt: 1 })
      .limit(100);

    // Analisar cada item
    const analysis = items.map(item => {
      const itemObj = item.toObject();
      const delayStatus = calculateDelayStatus(item, restaurantFlow);

      return {
        itemId: item._id,
        productName: item.product?.name,
        productType: item.product?.productType,
        quantity: item.quantity,
        status: item.status,
        createdAt: item.createdAt,
        ...delayStatus
      };
    });

    // Separar por severidade
    const delayed = analysis.filter(a => a.status === 'delayed');
    const warnings = analysis.filter(a => a.status === 'warning');
    const onTime = analysis.filter(a => a.status === 'on_time');

    // Encontrar ordem de cada item atrasado
    const delayedWithOrders = await Promise.all(
      delayed.map(async (item) => {
        const order = await Order.findOne({ items: item.itemId })
          .populate('table', 'number')
          .populate('waiter', 'name');

        return {
          ...item,
          tableNumber: order?.table?.number,
          waiterName: order?.waiter?.name,
          orderId: order?._id
        };
      })
    );

    res.json({
      success: true,
      data: {
        summary: {
          total: analysis.length,
          delayed: delayed.length,
          warnings: warnings.length,
          onTime: onTime.length
        },
        restaurantFlow: {
          ...restaurantFlow,
          status: rushHour ? 'rush_hour' : openTables > totalTables * 0.7 ? 'busy' : 'normal'
        },
        delayedItems: delayedWithOrders,
        warningItems: warnings.slice(0, 10) // Top 10 warnings
      }
    });
  } catch (error) {
    console.error('[Analytics] Error in getDelayAnalysis:', error);
    res.status(500).json({ success: false, message: 'Erro ao analisar atrasos' });
  }
};

/**
 * GET /api/analytics/products/performance
 * Análise de performance de produtos
 */
exports.getProductPerformance = async (req, res) => {
  try {
    const { startDate, endDate, limit = 10 } = req.query;

    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    // Top produtos mais vendidos
    const topProducts = await OrderItem.aggregate([
      { $match: { ...dateFilter, status: { $ne: 'canceled' } } },
      {
        $group: {
          _id: '$product',
          totalSold: { $sum: '$quantity' },
          revenue: { $sum: { $multiply: ['$quantity', '$unitPrice'] } },
          orders: { $sum: 1 }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: parseInt(limit) },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      { $unwind: '$productInfo' }
    ]);

    // Tempo médio de preparo por produto
    const preparationTimes = await OrderItem.aggregate([
      {
        $match: {
          ...dateFilter,
          status: { $in: ['ready', 'delivered'] },
          preparationStartTime: { $exists: true },
          deliveryTime: { $exists: true }
        }
      },
      {
        $project: {
          product: 1,
          prepTime: {
            $divide: [
              { $subtract: ['$deliveryTime', '$preparationStartTime'] },
              1000 * 60 // converter para minutos
            ]
          }
        }
      },
      {
        $group: {
          _id: '$product',
          avgPrepTime: { $avg: '$prepTime' },
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
      { $unwind: '$productInfo' },
      { $sort: { avgPrepTime: -1 } },
      { $limit: parseInt(limit) }
    ]);

    res.json({
      success: true,
      data: {
        topSelling: topProducts.map(p => ({
          productId: p._id,
          name: p.productInfo.name,
          totalSold: p.totalSold,
          revenue: p.revenue,
          orders: p.orders,
          category: p.productInfo.category
        })),
        slowestPreparation: preparationTimes.map(p => ({
          productId: p._id,
          name: p.productInfo.name,
          avgPrepTime: Math.round(p.avgPrepTime),
          sampleSize: p.count
        }))
      }
    });
  } catch (error) {
    console.error('[Analytics] Error in getProductPerformance:', error);
    res.status(500).json({ success: false, message: 'Erro ao analisar performance de produtos' });
  }
};

/**
 * GET /api/analytics/revenue-timeline
 * Timeline de receita (para gráficos)
 */
exports.getRevenueTimeline = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;

    const dateFilter = {
      status: 'closed'
    };

    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    let groupByExpression;
    let dateFormat;

    switch (groupBy) {
      case 'hour':
        groupByExpression = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' },
          hour: { $hour: '$createdAt' }
        };
        dateFormat = 'YYYY-MM-DD HH:00';
        break;
      case 'month':
        groupByExpression = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        };
        dateFormat = 'YYYY-MM';
        break;
      default: // day
        groupByExpression = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
        dateFormat = 'YYYY-MM-DD';
    }

    const timeline = await Order.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: groupByExpression,
          revenue: { $sum: '$total' },
          orders: { $sum: 1 },
          avgTicket: { $avg: '$total' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1 } }
    ]);

    res.json({
      success: true,
      data: timeline.map(t => ({
        date: t._id,
        revenue: t.revenue,
        orders: t.orders,
        avgTicket: Math.round(t.avgTicket)
      }))
    });
  } catch (error) {
    console.error('[Analytics] Error in getRevenueTimeline:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar timeline de receita' });
  }
};

/**
 * GET /api/analytics/customer-insights
 * Insights sobre clientes
 */
exports.getCustomerInsights = async (req, res) => {
  try {
    const totalCustomers = await Customer.countDocuments();
    const newCustomersThisMonth = await Customer.countDocuments({
      createdAt: {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      }
    });

    // Clientes mais frequentes
    const frequentCustomers = await Customer.find()
      .sort({ visitCount: -1 })
      .limit(10)
      .select('name cpf visitCount totalSpent lastVisit');

    // Taxa de retorno
    const returningCustomers = await Customer.countDocuments({ visitCount: { $gt: 1 } });
    const returnRate = totalCustomers > 0
      ? Math.round((returningCustomers / totalCustomers) * 100)
      : 0;

    res.json({
      success: true,
      data: {
        total: totalCustomers,
        newThisMonth: newCustomersThisMonth,
        returnRate,
        topCustomers: frequentCustomers
      }
    });
  } catch (error) {
    console.error('[Analytics] Error in getCustomerInsights:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar insights de clientes' });
  }
};

module.exports = exports;
