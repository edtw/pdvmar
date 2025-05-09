// controllers/reportController.js
const mongoose = require('mongoose');
const Order = mongoose.model('Order');
const OrderItem = mongoose.model('OrderItem');
const Product = mongoose.model('Product');
const User = mongoose.model('User');

/**
 * Relatório de vendas do período
 */
exports.salesReport = async (req, res) => {
  try {
    // Obter datas do período (padrão: hoje)
    let { startDate, endDate } = req.query;
    
    // Validar datas
    if (!startDate) {
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
    } else {
      startDate = new Date(startDate);
    }
    
    if (!endDate) {
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
    } else {
      endDate = new Date(endDate);
      endDate.setHours(23, 59, 59, 999);
    }
    
    // Consultar pedidos fechados no período
    const orders = await Order.find({
      status: 'closed',
      paymentStatus: 'paid',
      createdAt: { $gte: startDate, $lte: endDate }
    }).populate('waiter', 'name');
    
    // Calcular totais
    const totalSales = orders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = orders.length;
    
    // Agrupar por forma de pagamento
    const paymentMethods = {};
    
    orders.forEach(order => {
      const method = order.paymentMethod || 'other';
      paymentMethods[method] = (paymentMethods[method] || 0) + order.total;
    });
    
    // Agrupar por garçom
    const salesByWaiter = {};
    
    orders.forEach(order => {
      const waiterId = order.waiter ? order.waiter._id.toString() : 'unknown';
      const waiterName = order.waiter ? order.waiter.name : 'Desconhecido';
      
      if (!salesByWaiter[waiterId]) {
        salesByWaiter[waiterId] = {
          name: waiterName,
          total: 0,
          count: 0
        };
      }
      
      salesByWaiter[waiterId].total += order.total;
      salesByWaiter[waiterId].count += 1;
    });
    
    // Resultado
    res.json({
      success: true,
      report: {
        startDate,
        endDate,
        totalSales,
        totalOrders,
        averageTicket: totalOrders > 0 ? totalSales / totalOrders : 0,
        paymentMethods,
        salesByWaiter: Object.values(salesByWaiter)
      }
    });
  } catch (error) {
    console.error('Erro ao gerar relatório de vendas:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro no servidor' 
    });
  }
};

/**
 * Relatório de produtos mais vendidos
 */
exports.topProductsReport = async (req, res) => {
  try {
    // Obter datas do período (padrão: último mês)
    let { startDate, endDate, limit } = req.query;
    
    // Validar datas
    if (!startDate) {
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
    } else {
      startDate = new Date(startDate);
    }
    
    if (!endDate) {
      endDate = new Date();
    } else {
      endDate = new Date(endDate);
      endDate.setHours(23, 59, 59, 999);
    }
    
    // Limitar resultados
    limit = parseInt(limit) || 10;
    
    // Consultar pedidos fechados no período
    const orders = await Order.find({
      status: 'closed',
      createdAt: { $gte: startDate, $lte: endDate }
    });
    
    // Buscar todos os itens desses pedidos
    const orderIds = orders.map(order => order._id);
    const orderItems = await OrderItem.find({
      order: { $in: orderIds }
    }).populate('product', 'name price category');
    
    // Agrupar por produto
    const productSales = {};
    
    orderItems.forEach(item => {
      if (!item.product) return;
      
      const productId = item.product._id.toString();
      
      if (!productSales[productId]) {
        productSales[productId] = {
          product: item.product,
          quantity: 0,
          total: 0
        };
      }
      
      productSales[productId].quantity += item.quantity;
      productSales[productId].total += item.quantity * item.unitPrice;
    });
    
    // Ordenar produtos por quantidade vendida
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, limit);
    
    // Resultado
    res.json({
      success: true,
      report: {
        startDate,
        endDate,
        topProducts
      }
    });
  } catch (error) {
    console.error('Erro ao gerar relatório de produtos:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro no servidor' 
    });
  }
};

/**
 * Relatório de vendas diárias
 */
exports.dailySalesReport = async (req, res) => {
  try {
    // Obter datas do período (padrão: últimos 30 dias)
    let { days } = req.query;
    days = parseInt(days) || 30;
    
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);
    
    // Consultar pedidos fechados no período
    const orders = await Order.find({
      status: 'closed',
      paymentStatus: 'paid',
      createdAt: { $gte: startDate, $lte: endDate }
    });
    
    // Agrupar por dia
    const salesByDay = {};
    
    orders.forEach(order => {
      const date = new Date(order.createdAt);
      const day = date.toISOString().split('T')[0];
      
      if (!salesByDay[day]) {
        salesByDay[day] = {
          day,
          date: new Date(day),
          total: 0,
          count: 0
        };
      }
      
      salesByDay[day].total += order.total;
      salesByDay[day].count += 1;
    });
    
    // Preencher dias sem vendas
    const allDays = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const day = currentDate.toISOString().split('T')[0];
      
      if (!salesByDay[day]) {
        salesByDay[day] = {
          day,
          date: new Date(day),
          total: 0,
          count: 0
        };
      }
      
      allDays.push(salesByDay[day]);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Ordenar por data
    allDays.sort((a, b) => a.date - b.date);
    
    // Resultado
    res.json({
      success: true,
      report: {
        startDate,
        endDate,
        dailySales: allDays
      }
    });
  } catch (error) {
    console.error('Erro ao gerar relatório de vendas diárias:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro no servidor' 
    });
  }
};

/**
 * Relatório de desempenho de garçons
 */
exports.waiterPerformanceReport = async (req, res) => {
  try {
    // Obter datas do período (padrão: último mês)
    let { startDate, endDate } = req.query;
    
    // Validar datas
    if (!startDate) {
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
    } else {
      startDate = new Date(startDate);
    }
    
    if (!endDate) {
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
    } else {
      endDate = new Date(endDate);
      endDate.setHours(23, 59, 59, 999);
    }
    
    // Buscar todos os garçons
    const waiters = await User.find({ 
      role: 'waiter', 
      active: true 
    });
    
    // Buscar pedidos fechados no período
    const orders = await Order.find({
      status: 'closed',
      paymentStatus: 'paid',
      createdAt: { $gte: startDate, $lte: endDate }
    });
    
    // Agrupar por garçom
    const performanceByWaiter = {};
    
    // Inicializar dados para todos os garçons
    waiters.forEach(waiter => {
      performanceByWaiter[waiter._id.toString()] = {
        _id: waiter._id,
        name: waiter.name,
        sales: 0,
        orderCount: 0,
        averageTicket: 0
      };
    });
    
    // Calcular vendas e pedidos
    orders.forEach(order => {
      if (!order.waiter) return;
      
      const waiterId = order.waiter.toString();
      
      if (!performanceByWaiter[waiterId]) {
        // Garçom não encontrado previamente (talvez desativado)
        return;
      }
      
      performanceByWaiter[waiterId].sales += order.total;
      performanceByWaiter[waiterId].orderCount += 1;
    });
    
    // Calcular média
    Object.values(performanceByWaiter).forEach(waiter => {
      waiter.averageTicket = waiter.orderCount > 0 
        ? waiter.sales / waiter.orderCount 
        : 0;
    });
    
    // Ordenar por vendas
    const sortedPerformance = Object.values(performanceByWaiter)
      .sort((a, b) => b.sales - a.sales);
    
    // Resultado
    res.json({
      success: true,
      report: {
        startDate,
        endDate,
        waiterPerformance: sortedPerformance
      }
    });
  } catch (error) {
    console.error('Erro ao gerar relatório de desempenho:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro no servidor' 
    });
  }
};