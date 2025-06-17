// controllers/reportController.js
const mongoose = require('mongoose');
const Order = mongoose.model('Order');
const OrderItem = mongoose.model('OrderItem');
const Product = mongoose.model('Product');
const User = mongoose.model('User');

// Função para obter a data atual no Brasil
const getBrasilDate = () => {
  // Obter data atual no fuso horário local
  // Este método evita problemas de UTC vs Local time
  const now = new Date();
  console.log(`[Reports] Data local atual: ${now.toISOString()}`);
  return now;
};

// Função melhorada para criar data de início (00:00:00) no horário local
const getLocalStartDate = (date) => {
  if (!date) {
    const today = getBrasilDate();
    console.log(`[Reports] getLocalStartDate: Usando hoje (${today.toISOString()})`);
    // Início do dia de hoje
    return new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
  }
  
  // A data já vem como string ISO do middleware de datas
  if (typeof date === 'string' && date.includes('T')) {
    console.log(`[Reports] getLocalStartDate: Usando data ISO fornecida (${date})`);
    return new Date(date);
  }
  
  // Converter para data e definir como início do dia
  const d = new Date(date);
  console.log(`[Reports] getLocalStartDate: Convertendo data (${date}) para início do dia`);
  const result = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
  console.log(`[Reports] getLocalStartDate: Resultado = ${result.toISOString()}`);
  return result;
};

// Função melhorada para criar data de fim (23:59:59) no horário local
const getLocalEndDate = (date) => {
  if (!date) {
    const today = getBrasilDate();
    console.log(`[Reports] getLocalEndDate: Usando hoje (${today.toISOString()})`);
    // Fim do dia de hoje
    return new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
  }
  
  // A data já vem como string ISO do middleware de datas
  if (typeof date === 'string' && date.includes('T')) {
    console.log(`[Reports] getLocalEndDate: Usando data ISO fornecida (${date})`);
    return new Date(date);
  }
  
  // Converter para data e definir como fim do dia
  const d = new Date(date);
  console.log(`[Reports] getLocalEndDate: Convertendo data (${date}) para fim do dia`);
  const result = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
  console.log(`[Reports] getLocalEndDate: Resultado = ${result.toISOString()}`);
  return result;
};

/**
 * Sales report for a period
 */
exports.salesReport = async (req, res) => {
  try {
    // Get period dates (default: today)
    let { startDate, endDate } = req.query;
    
    console.log(`[Reports] Parâmetros originais: startDate=${startDate}, endDate=${endDate}`);
    
    // Ajustar para horário local se necessário
    const effectiveStartDate = getLocalStartDate(startDate);
    const effectiveEndDate = getLocalEndDate(endDate);
    
    console.log(`[Reports] Gerando relatório de vendas para o período: ${effectiveStartDate.toISOString()} até ${effectiveEndDate.toISOString()}`);
    
    // Usar aggregation para garantir contagem correta
    const orderAggregation = await Order.aggregate([
      {
        $match: {
          status: 'closed',
          paymentStatus: 'paid',
          createdAt: { $gte: effectiveStartDate, $lte: effectiveEndDate }
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$total" },
          totalOrders: { $sum: 1 }
        }
      }
    ]);
    
    console.log('Sales aggregation result:', orderAggregation);
    
    const totalSales = orderAggregation.length > 0 ? orderAggregation[0].totalSales : 0;
    const totalOrders = orderAggregation.length > 0 ? orderAggregation[0].totalOrders : 0;
    
    // Use specific query for waiter grouping
    const waiterAggregation = await Order.aggregate([
      {
        $match: {
          status: 'closed',
          paymentStatus: 'paid',
          createdAt: { $gte: effectiveStartDate, $lte: effectiveEndDate }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'waiter',
          foreignField: '_id',
          as: 'waiterInfo'
        }
      },
      {
        $unwind: {
          path: '$waiterInfo',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $group: {
          _id: '$waiter',
          name: { $first: '$waiterInfo.name' },
          total: { $sum: '$total' },
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Use aggregation for payment methods
    const paymentMethodAggregation = await Order.aggregate([
      {
        $match: {
          status: 'closed',
          paymentStatus: 'paid',
          createdAt: { $gte: effectiveStartDate, $lte: effectiveEndDate }
        }
      },
      {
        $group: {
          _id: '$paymentMethod',
          total: { $sum: '$total' }
        }
      }
    ]);
    
    // Format payment data
    const paymentMethods = {};
    paymentMethodAggregation.forEach(method => {
      const methodName = method._id || 'other';
      paymentMethods[methodName] = method.total;
    });
    
    // Ensure all payment methods are represented
    const allPaymentMethods = ['cash', 'credit', 'debit', 'pix', 'other'];
    allPaymentMethods.forEach(method => {
      if (!paymentMethods[method]) {
        paymentMethods[method] = 0;
      }
    });
    
    // Result
    const report = {
      startDate: effectiveStartDate,
      endDate: effectiveEndDate,
      totalSales,
      totalOrders,
      averageTicket: totalOrders > 0 ? totalSales / totalOrders : 0,
      paymentMethods,
      salesByWaiter: waiterAggregation
    };
    
    console.log('Sales report result:', {
      totalSales,
      totalOrders,
      averageTicket: report.averageTicket,
      waiterCount: waiterAggregation.length
    });
    
    res.json({
      success: true,
      report
    });
  } catch (error) {
    console.error('Error generating sales report:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

/**
 * Top products report
 */
exports.topProductsReport = async (req, res) => {
  try {
    // Get period dates (default: last month)
    let { startDate, endDate, limit } = req.query;
    
    console.log(`[Reports] Top Products - Parâmetros originais: startDate=${startDate}, endDate=${endDate}`);
    
    if (!startDate) {
      // Data de início: 1 mês atrás
      const oneMonthAgo = getBrasilDate();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      startDate = oneMonthAgo;
    }
    
    // Ajustar para horário local se necessário
    const effectiveStartDate = getLocalStartDate(startDate);
    const effectiveEndDate = getLocalEndDate(endDate);
    
    // Limit results
    limit = parseInt(limit) || 10;
    
    console.log(`Generating top products report for period: ${effectiveStartDate.toISOString()} to ${effectiveEndDate.toISOString()}`);
    
    // Use aggregation to get top products with complete information
    const topProductsAggregation = await OrderItem.aggregate([
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'items',
          as: 'orderInfo'
        }
      },
      {
        $unwind: {
          path: '$orderInfo',
          preserveNullAndEmptyArrays: false
        }
      },
      {
        $match: {
          'orderInfo.createdAt': { $gte: effectiveStartDate, $lte: effectiveEndDate },
          'orderInfo.status': 'closed',
          'status': { $ne: 'canceled' }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      {
        $unwind: {
          path: '$productInfo',
          preserveNullAndEmptyArrays: false
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'productInfo.category',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      {
        $unwind: {
          path: '$categoryInfo',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $group: {
          _id: '$product',
          product: { $first: '$productInfo' },
          quantity: { $sum: '$quantity' },
          total: { $sum: { $multiply: ['$quantity', '$unitPrice'] } }
        }
      },
      {
        $sort: { quantity: -1 }
      },
      {
        $limit: limit
      },
      {
        $project: {
          _id: 0,
          product: {
            _id: '$product._id',
            name: '$product.name',
            price: '$product.price',
            category: {
              _id: '$categoryInfo._id',
              name: '$categoryInfo.name'
            }
          },
          quantity: 1,
          total: 1
        }
      }
    ]);
    
    console.log(`Top products report found ${topProductsAggregation.length} products`);
    
    // Result
    res.json({
      success: true,
      report: {
        startDate: effectiveStartDate,
        endDate: effectiveEndDate,
        topProducts: topProductsAggregation
      }
    });
  } catch (error) {
    console.error('Error generating top products report:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

/**
 * Daily sales report
 */
exports.dailySalesReport = async (req, res) => {
  try {
    // Get period dates (default: last 30 days)
    let { days } = req.query;
    days = parseInt(days) || 30;
    
    console.log(`[Reports] Daily Sales - Parâmetros originais: days=${days}`);
    
    const endDate = getLocalEndDate();
    
    // Calcular data de início (hoje - days)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const effectiveStartDate = getLocalStartDate(startDate);
    const effectiveEndDate = endDate;
    
    console.log(`[Reports] Generating daily sales report for last ${days} days: ${effectiveStartDate.toISOString()} to ${effectiveEndDate.toISOString()}`);
    
    // Use aggregation to group sales by day
    const dailySalesAggregation = await Order.aggregate([
      {
        $match: {
          status: 'closed',
          paymentStatus: 'paid',
          createdAt: { $gte: effectiveStartDate, $lte: effectiveEndDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          total: { $sum: '$total' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: {
          '_id.year': 1,
          '_id.month': 1,
          '_id.day': 1
        }
      }
    ]);
    
    console.log(`[Reports] Daily sales aggregation found data for ${dailySalesAggregation.length} days`);
    
    // Format data for expected client format
    const salesByDay = {};
    
    dailySalesAggregation.forEach(daySale => {
      const date = new Date(
        daySale._id.year,
        daySale._id.month - 1,
        daySale._id.day
      );
      const day = date.toISOString().split('T')[0];
      
      salesByDay[day] = {
        day,
        date,
        total: daySale.total,
        count: daySale.count
      };
    });
    
    // Fill days without sales
    const allDays = [];
    const currentDate = new Date(effectiveStartDate);
    
    while (currentDate <= effectiveEndDate) {
      const day = currentDate.toISOString().split('T')[0];
      
      if (!salesByDay[day]) {
        salesByDay[day] = {
          day,
          date: new Date(currentDate),
          total: 0,
          count: 0
        };
      }
      
      allDays.push(salesByDay[day]);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Sort by date
    allDays.sort((a, b) => a.date - b.date);
    
    // Result
    res.json({
      success: true,
      report: {
        startDate: effectiveStartDate,
        endDate: effectiveEndDate,
        dailySales: allDays
      }
    });
  } catch (error) {
    console.error('Error generating daily sales report:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

/**
 * Waiter performance report
 */
exports.waiterPerformanceReport = async (req, res) => {
  try {
    // Get period dates (default: last month)
    let { startDate, endDate } = req.query;
    
    console.log(`[Reports] Waiter Performance - Parâmetros originais: startDate=${startDate}, endDate=${endDate}`);
    
    if (!startDate) {
      // Data de início: 1 mês atrás
      const oneMonthAgo = getBrasilDate();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      startDate = oneMonthAgo;
    }
    
    // Ajustar para horário local se necessário
    const effectiveStartDate = getLocalStartDate(startDate);
    const effectiveEndDate = getLocalEndDate(endDate);
    
    console.log(`[Reports] Generating waiter performance report for period: ${effectiveStartDate.toISOString()} to ${effectiveEndDate.toISOString()}`);
    
    // Get all waiters
    const waiters = await User.find({ 
      role: 'waiter', 
      active: true 
    });
    
    console.log(`[Reports] Found ${waiters.length} active waiters`);
    
    // Use aggregation to calculate waiter performance statistics
    const waiterAggregation = await Order.aggregate([
      {
        $match: {
          status: 'closed',
          paymentStatus: 'paid',
          createdAt: { $gte: effectiveStartDate, $lte: effectiveEndDate }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'waiter',
          foreignField: '_id',
          as: 'waiterInfo'
        }
      },
      {
        $unwind: {
          path: '$waiterInfo',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $group: {
          _id: '$waiter',
          name: { $first: '$waiterInfo.name' },
          sales: { $sum: '$total' },
          orderCount: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          sales: 1,
          orderCount: 1,
          averageTicket: { 
            $cond: [
              { $eq: ['$orderCount', 0] },
              0,
              { $divide: ['$sales', '$orderCount'] }
            ]
          }
        }
      },
      {
        $sort: { sales: -1 }
      }
    ]);
    
    console.log(`[Reports] Waiter aggregation found performance data for ${waiterAggregation.length} waiters`);
    
    // Include all waiters, even those without sales
    const performanceByWaiter = {};
    
    // Initialize data for all waiters
    waiters.forEach(waiter => {
      performanceByWaiter[waiter._id.toString()] = {
        _id: waiter._id,
        name: waiter.name,
        sales: 0,
        orderCount: 0,
        averageTicket: 0
      };
    });
    
    // Update with sales data
    waiterAggregation.forEach(waiter => {
      if (waiter._id) {
        performanceByWaiter[waiter._id.toString()] = waiter;
      }
    });
    
    // Convert to array
    const sortedPerformance = Object.values(performanceByWaiter)
      .sort((a, b) => b.sales - a.sales);
    
    // Result
    res.json({
      success: true,
      report: {
        startDate: effectiveStartDate,
        endDate: effectiveEndDate,
        waiterPerformance: sortedPerformance
      }
    });
  } catch (error) {
    console.error('Error generating waiter performance report:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};