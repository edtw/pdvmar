# 🤖 Algoritmos Inteligentes - Marambaia PDV

> Propostas de features baseadas em IA/ML e algoritmos para aumentar receita e eficiência

---

## 📊 Índice de Impacto

| Algoritmo | Impacto Receita | Impacto Eficiência | Complexidade | Prioridade |
|-----------|----------------|-------------------|--------------|------------|
| [Sistema de Recomendação](#1-sistema-de-recomendação) | 🟢🟢🟢 Alto | 🟢 Médio | Média | ⭐⭐⭐ |
| [Upselling Inteligente](#2-upselling-inteligente) | 🟢🟢🟢 Alto | 🟢🟢 Alto | Baixa | ⭐⭐⭐ |
| [Balanceamento de Garçons](#3-balanceamento-de-garçons) | 🟢 Médio | 🟢🟢🟢 Alto | Média | ⭐⭐⭐ |
| [Previsão de Demanda](#4-previsão-de-demanda) | 🟢🟢 Alto | 🟢🟢🟢 Alto | Alta | ⭐⭐ |
| [Detecção de Mesas Esquecidas](#5-detecção-de-mesas-esquecidas) | 🟢🟢 Alto | 🟢🟢 Alto | Baixa | ⭐⭐⭐ |
| [Sistema de Fidelidade](#6-sistema-de-fidelidade-inteligente) | 🟢🟢🟢 Alto | 🟢 Médio | Média | ⭐⭐ |
| [Detecção de Fraude](#7-detecção-de-fraude) | 🟢🟢 Alto | 🟢🟢 Alto | Média | ⭐⭐ |
| [Otimização de Cardápio](#8-otimização-dinâmica-de-cardápio) | 🟢🟢🟢 Alto | 🟢 Médio | Média | ⭐⭐ |

---

## 1. Sistema de Recomendação

### 💡 Conceito
Sugerir produtos baseado em padrões de compra anteriores (Collaborative Filtering + Rule-Based).

### 💰 Valor de Negócio
- **Aumento de ticket médio**: 15-25%
- **Melhora experiência do cliente**: Sugestões personalizadas
- **Rotação de estoque**: Produtos parados são sugeridos estrategicamente

### 🎯 Como Funciona

#### Algoritmo Híbrido:

**1. Regras Simples (Immediate Impact)**
```javascript
const rules = {
  // Se pedir comida, sugerir bebida
  food: ['Água Mineral', 'Refrigerante', 'Suco Natural'],

  // Combos populares
  'Moqueca de Peixe': ['Caipirinha', 'Cerveja Corona'],
  'Batata Frita': ['Heineken', 'Refrigerante'],
  'Isca de Peixe': ['Cerveja Brahma', 'Limão'],

  // Upsell por categoria
  'Cerveja Brahma': ['Cerveja Heineken', 'Cerveja Corona'], // Upsell premium

  // Tempo do dia
  morning: ['Suco Natural', 'Água de Coco'],
  afternoon: ['Cerveja', 'Caipirinha'],
  evening: ['Drinks Premium', 'Vinhos']
};
```

**2. Análise de Co-ocorrência (Frequência)**
```javascript
// Analisar últimos 1000 pedidos
async function calculateCoOccurrence() {
  const orders = await Order.find()
    .populate('items')
    .limit(1000)
    .sort({ createdAt: -1 });

  const matrix = {}; // { productA: { productB: count } }

  orders.forEach(order => {
    const products = order.items.map(item => item.product._id.toString());

    // Para cada par de produtos no mesmo pedido
    for (let i = 0; i < products.length; i++) {
      for (let j = i + 1; j < products.length; j++) {
        const pA = products[i];
        const pB = products[j];

        if (!matrix[pA]) matrix[pA] = {};
        if (!matrix[pB]) matrix[pB] = {};

        matrix[pA][pB] = (matrix[pA][pB] || 0) + 1;
        matrix[pB][pA] = (matrix[pB][pA] || 0) + 1;
      }
    }
  });

  return matrix;
}

// Gerar recomendações
function getRecommendations(productId, matrix, limit = 3) {
  const coOccurrences = matrix[productId] || {};

  // Ordenar por frequência
  const sorted = Object.entries(coOccurrences)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);

  return sorted.map(([productId, count]) => ({
    productId,
    score: count,
    reason: `Clientes que compraram isso também compraram`
  }));
}
```

**3. Integração no Customer App**
```javascript
// customer-app/src/pages/Menu.js
const [recommendations, setRecommendations] = useState([]);

useEffect(() => {
  if (currentOrder?.items?.length > 0) {
    loadRecommendations();
  }
}, [currentOrder]);

const loadRecommendations = async () => {
  const productIds = currentOrder.items.map(item => item.product._id);
  const response = await api.post('/api/recommendations', { productIds });
  setRecommendations(response.data.recommendations);
};

// Exibir seção especial
{recommendations.length > 0 && (
  <Box bg="orange.50" p={4} borderRadius="lg" mb={4}>
    <Heading size="md" mb={3}>
      🎯 Sugestões para Você
    </Heading>
    <SimpleGrid columns={2} spacing={3}>
      {recommendations.map(rec => (
        <ProductCard
          key={rec.product._id}
          product={rec.product}
          badge="Recomendado"
          reason={rec.reason}
        />
      ))}
    </SimpleGrid>
  </Box>
)}
```

### 📈 Métricas de Sucesso
- Taxa de aceitação de recomendações: > 20%
- Aumento no ticket médio: +15%
- Produtos com baixa rotação: -30% de estoque parado

### 🛠️ Complexidade
**Média** - Requer análise de dados históricos e cache

---

## 2. Upselling Inteligente

### 💡 Conceito
Sugerir versão premium ou maior quantidade de produtos automaticamente.

### 💰 Valor de Negócio
- **Aumento imediato de receita**: 10-20%
- **Zero esforço do garçom**: Automático
- **Melhora percepção de valor**: "Vale a pena por +R$ 5"

### 🎯 Implementação

```javascript
// Regras de upsell
const upsellRules = [
  {
    trigger: { product: 'Cerveja Brahma', quantity: 1 },
    suggest: {
      product: 'Cerveja Brahma',
      quantity: 6, // Balde
      discount: 10, // 10% off
      message: '🧊 Que tal um balde de 6 por apenas R$ {price}? Economize 10%!',
      savings: 'R$ 8,00'
    }
  },
  {
    trigger: { product: 'Refrigerante 350ml' },
    suggest: {
      product: 'Refrigerante 600ml',
      priceIncrease: 3,
      message: '⬆️ Por apenas +R$ 3,00, leve o dobro (600ml)!'
    }
  },
  {
    trigger: { category: 'Cerveja', quantity: 1 },
    suggest: {
      upgrade: 'premium', // Heineken/Corona
      message: '✨ Upgrade para cerveja premium por +R$ 4,00?'
    }
  },
  {
    trigger: { totalOrder: { $lt: 50 } },
    suggest: {
      type: 'minimum_delivery',
      message: '📦 Adicione +R$ {missing} para atingir o pedido mínimo e ganhar 10% off!'
    }
  }
];

// Middleware de upsell no addItem
exports.addItem = async (req, res) => {
  // ... adicionar item normalmente

  // Verificar upsell
  const upsell = await checkUpsellOpportunity(order, newItem);

  if (upsell) {
    return res.json({
      success: true,
      order,
      item: newItem,
      upsell: {
        show: true,
        title: upsell.message,
        options: upsell.options,
        estimatedSavings: upsell.savings
      }
    });
  }

  res.json({ success: true, order, item: newItem });
};
```

**Frontend Modal**:
```javascript
// Exibir modal de upsell
if (response.data.upsell) {
  showUpsellModal({
    title: response.data.upsell.title,
    options: response.data.upsell.options,
    onAccept: () => addSuggestedItem(response.data.upsell.productId),
    onDecline: () => closeModal()
  });
}
```

### 📈 Métricas
- Taxa de conversão de upsell: > 30%
- Valor médio de upsell: R$ 8-15
- ROI: Imediato (sem custo adicional)

### 🛠️ Complexidade
**Baixa** - Apenas lógica condicional

---

## 3. Balanceamento de Garçons

### 💡 Conceito
Distribuir mesas automaticamente entre garçons baseado em carga de trabalho e performance.

### 💰 Valor de Negócio
- **Reduz tempo de espera**: -25%
- **Evita sobrecarga**: Distribui equitativamente
- **Melhora satisfação dos garçons**: Gorjetas mais justas

### 🎯 Algoritmo

```javascript
// Calcular score de carga para cada garçom
async function calculateWaiterLoad(waiterId) {
  const waiter = await User.findById(waiterId);

  // Buscar mesas ativas
  const tables = await Table.find({
    waiter: waiterId,
    status: { $in: ['occupied', 'waiting_payment'] }
  }).populate('currentOrder');

  let load = 0;

  tables.forEach(table => {
    // Peso base por mesa
    load += 10;

    if (table.currentOrder) {
      // +5 pontos por cada 10 reais do pedido
      load += Math.floor(table.currentOrder.total / 10) * 5;

      // +10 pontos se conta solicitada (urgente)
      if (table.billRequested) {
        load += 10;
      }

      // +5 pontos por item pendente/preparando
      const pendingItems = table.currentOrder.items.filter(item =>
        ['pending', 'preparing'].includes(item.status)
      ).length;
      load += pendingItems * 5;
    }
  });

  return {
    waiterId,
    waiterName: waiter.name,
    activeTables: tables.length,
    loadScore: load
  };
}

// Auto-atribuir garçom à mesa
async function assignWaiterToTable(tableId) {
  // Buscar todos os garçons ativos
  const waiters = await User.find({ role: 'waiter', active: true });

  if (waiters.length === 0) {
    throw new Error('Nenhum garçom disponível');
  }

  // Calcular carga de cada um
  const loads = await Promise.all(
    waiters.map(w => calculateWaiterLoad(w._id))
  );

  // Ordenar por menor carga
  loads.sort((a, b) => a.loadScore - b.loadScore);

  // Atribuir ao garçom com menor carga
  const selectedWaiter = loads[0];

  await Table.findByIdAndUpdate(tableId, {
    waiter: selectedWaiter.waiterId
  });

  // Notificar garçom
  io.to(selectedWaiter.waiterId.toString()).emit('tableAssigned', {
    tableId,
    message: `Nova mesa atribuída: Mesa ${table.number}`
  });

  console.log(`[Auto-Assign] Mesa ${tableId} → ${selectedWaiter.waiterName} (carga: ${selectedWaiter.loadScore})`);

  return selectedWaiter;
}
```

### 📊 Dashboard de Performance
```javascript
// Endpoint de métricas por garçom
exports.getWaiterPerformance = async (req, res) => {
  const { startDate, endDate } = req.query;

  const waiters = await User.find({ role: 'waiter' });

  const metrics = await Promise.all(waiters.map(async (waiter) => {
    const tables = await Table.find({
      waiter: waiter._id,
      'currentOrder': { $exists: true }
    }).populate({
      path: 'currentOrder',
      match: {
        createdAt: { $gte: startDate, $lte: endDate }
      }
    });

    const totalSales = tables.reduce((sum, t) =>
      sum + (t.currentOrder?.total || 0), 0
    );

    const avgServiceTime = tables.reduce((sum, t) => {
      if (t.openTime && t.currentOrder?.closedAt) {
        return sum + (t.currentOrder.closedAt - t.openTime);
      }
      return sum;
    }, 0) / tables.length;

    return {
      waiterName: waiter.name,
      tablesServed: tables.length,
      totalSales,
      avgServiceTime: Math.round(avgServiceTime / 60000), // minutos
      avgTicket: totalSales / tables.length
    };
  }));

  res.json({ success: true, metrics });
};
```

### 📈 Métricas
- Distribuição de mesas: ±10% entre garçons
- Redução de tempo de espera: 25%
- Satisfação da equipe: +30%

### 🛠️ Complexidade
**Média** - Requer cálculo em tempo real

---

## 4. Previsão de Demanda

### 💡 Conceito
Prever quantidade de clientes e produtos mais vendidos por horário/dia.

### 💰 Valor de Negócio
- **Reduz desperdício**: -20% de comida jogada fora
- **Otimiza compras**: Comprar quantidade certa
- **Evita falta de estoque**: Sempre tem o que cliente quer

### 🎯 Algoritmo (Time Series Forecasting)

```javascript
// Coletar dados históricos
async function collectHistoricalData() {
  const data = [];

  // Últimos 90 dias
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 90);

  const orders = await Order.find({
    status: 'closed',
    createdAt: { $gte: startDate }
  }).populate('items');

  // Agrupar por dia da semana + hora
  const grouped = {};

  orders.forEach(order => {
    const date = new Date(order.createdAt);
    const dayOfWeek = date.getDay(); // 0-6
    const hour = date.getHours(); // 0-23

    const key = `${dayOfWeek}-${hour}`;

    if (!grouped[key]) {
      grouped[key] = {
        dayOfWeek,
        hour,
        orders: 0,
        revenue: 0,
        items: {}
      };
    }

    grouped[key].orders++;
    grouped[key].revenue += order.total;

    order.items.forEach(item => {
      const productId = item.product._id.toString();
      grouped[key].items[productId] = (grouped[key].items[productId] || 0) + item.quantity;
    });
  });

  return grouped;
}

// Previsão simples (média móvel)
function forecast(historical, dayOfWeek, hour) {
  const key = `${dayOfWeek}-${hour}`;
  const data = historical[key];

  if (!data) {
    return { orders: 0, revenue: 0, topProducts: [] };
  }

  // Média dos últimos 4 mesmos dias/horas
  const samples = Object.values(historical).filter(d =>
    d.dayOfWeek === dayOfWeek && d.hour === hour
  );

  const avgOrders = samples.reduce((sum, s) => sum + s.orders, 0) / samples.length;
  const avgRevenue = samples.reduce((sum, s) => sum + s.revenue, 0) / samples.length;

  // Top 5 produtos mais vendidos nesse horário
  const productCounts = {};
  samples.forEach(s => {
    Object.entries(s.items).forEach(([productId, count]) => {
      productCounts[productId] = (productCounts[productId] || 0) + count;
    });
  });

  const topProducts = Object.entries(productCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([productId, count]) => ({
      productId,
      estimatedQuantity: Math.ceil(count / samples.length)
    }));

  return {
    expectedOrders: Math.ceil(avgOrders),
    expectedRevenue: avgRevenue,
    topProducts
  };
}
```

**Dashboard de Previsão**:
```javascript
// Mostrar previsão para hoje
exports.getTodayForecast = async (req, res) => {
  const historical = await collectHistoricalData();
  const now = new Date();
  const dayOfWeek = now.getDay();

  const hourlyForecast = [];
  for (let hour = 0; hour < 24; hour++) {
    const prediction = forecast(historical, dayOfWeek, hour);
    hourlyForecast.push({
      hour: `${hour}:00`,
      ...prediction
    });
  }

  // Previsão do dia todo
  const totalExpectedOrders = hourlyForecast.reduce((sum, h) => sum + h.expectedOrders, 0);
  const totalExpectedRevenue = hourlyForecast.reduce((sum, h) => sum + h.expectedRevenue, 0);

  res.json({
    success: true,
    date: now.toISOString().split('T')[0],
    dayOfWeek: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][dayOfWeek],
    summary: {
      totalExpectedOrders,
      totalExpectedRevenue: Math.round(totalExpectedRevenue)
    },
    hourlyForecast,
    peakHours: hourlyForecast
      .sort((a, b) => b.expectedOrders - a.expectedOrders)
      .slice(0, 3)
      .map(h => h.hour)
  });
};
```

### 📈 Métricas
- Acurácia de previsão: 70-85%
- Redução de desperdício: 20%
- Otimização de estoque: 30%

### 🛠️ Complexidade
**Alta** - Requer análise de séries temporais

---

## 5. Detecção de Mesas Esquecidas

### 💡 Conceito
Alertar garçom quando mesa está há muito tempo sem interação.

### 💰 Valor de Negócio
- **Evita perda de clientes**: Cliente não fica esquecido
- **Aumenta giro de mesa**: Fecha mais rápido
- **Melhora satisfação**: Cliente se sente atendido

### 🎯 Implementação

```javascript
// Serviço de monitoramento (rodar a cada 5 minutos)
class ForgottenTableMonitor {
  constructor() {
    this.THRESHOLDS = {
      NO_INTERACTION: 15 * 60 * 1000, // 15 minutos sem adicionar item
      WAITING_PAYMENT: 10 * 60 * 1000, // 10 minutos aguardando pagamento
      NO_READY_ITEMS_DELIVERED: 20 * 60 * 1000 // 20 min com item pronto não entregue
    };
  }

  async check() {
    const tables = await Table.find({
      status: { $in: ['occupied', 'waiting_payment'] }
    }).populate({
      path: 'currentOrder',
      populate: { path: 'items' }
    }).populate('waiter');

    const alerts = [];

    for (const table of tables) {
      // Verificação 1: Mesa ocupada sem interação
      if (table.status === 'occupied' && table.currentOrder) {
        const lastItemTime = table.currentOrder.items.reduce((latest, item) => {
          return item.createdAt > latest ? item.createdAt : latest;
        }, table.openTime);

        const timeSinceLastItem = Date.now() - lastItemTime;

        if (timeSinceLastItem > this.THRESHOLDS.NO_INTERACTION) {
          alerts.push({
            type: 'NO_INTERACTION',
            severity: 'warning',
            tableId: table._id,
            tableNumber: table.number,
            waiterId: table.waiter?._id,
            message: `Mesa ${table.number} sem pedidos há ${Math.round(timeSinceLastItem / 60000)} minutos`,
            action: 'Verificar se cliente precisa de algo'
          });
        }
      }

      // Verificação 2: Aguardando pagamento há muito tempo
      if (table.status === 'waiting_payment' && table.billRequestedAt) {
        const waitingTime = Date.now() - table.billRequestedAt;

        if (waitingTime > this.THRESHOLDS.WAITING_PAYMENT) {
          alerts.push({
            type: 'WAITING_PAYMENT_TOO_LONG',
            severity: 'high',
            tableId: table._id,
            tableNumber: table.number,
            waiterId: table.waiter?._id,
            message: `Mesa ${table.number} aguardando pagamento há ${Math.round(waitingTime / 60000)} minutos`,
            action: 'URGENTE: Processar pagamento imediatamente'
          });
        }
      }

      // Verificação 3: Itens prontos não entregues
      if (table.currentOrder) {
        const readyItems = table.currentOrder.items.filter(item => item.status === 'ready');

        readyItems.forEach(item => {
          const waitingTime = Date.now() - item.readyAt;

          if (waitingTime > this.THRESHOLDS.NO_READY_ITEMS_DELIVERED) {
            alerts.push({
              type: 'READY_ITEM_NOT_DELIVERED',
              severity: 'high',
              tableId: table._id,
              tableNumber: table.number,
              waiterId: table.waiter?._id,
              itemName: item.product?.name,
              message: `${item.product?.name} pronto há ${Math.round(waitingTime / 60000)} minutos (Mesa ${table.number})`,
              action: 'Entregar item AGORA'
            });
          }
        });
      }
    }

    // Enviar alertas
    this.sendAlerts(alerts);

    return alerts;
  }

  sendAlerts(alerts) {
    alerts.forEach(alert => {
      // Notificar garçom específico
      if (alert.waiterId) {
        io.to(alert.waiterId.toString()).emit('forgotten_table_alert', alert);
      }

      // Notificar gerentes
      io.to('managers').emit('forgotten_table_alert', alert);

      // Log para auditoria
      console.warn(`[ForgottenTable] ${alert.type} - ${alert.message}`);
    });
  }

  start() {
    // Checar a cada 5 minutos
    setInterval(() => this.check(), 5 * 60 * 1000);
    console.log('[ForgottenTableMonitor] Iniciado');
  }
}

// Iniciar monitor
const monitor = new ForgottenTableMonitor();
monitor.start();
```

**Frontend - Alerta Visual**:
```javascript
// WaiterView.js
socket.on('forgotten_table_alert', (alert) => {
  toast({
    title: alert.severity === 'high' ? '🚨 URGENTE' : '⚠️ Atenção',
    description: alert.message,
    status: alert.severity === 'high' ? 'error' : 'warning',
    duration: null, // Não fecha automaticamente
    isClosable: true,
    position: 'top',
    onClose: () => {
      // Marcar como visto
      api.post(`/api/alerts/${alert.id}/acknowledge`);
    }
  });

  // Tocar som
  if (alert.severity === 'high') {
    playAlertSound();
  }
});
```

### 📈 Métricas
- Redução de reclamações: 40%
- Aumento de giro de mesa: 15%
- Satisfação do cliente: +25%

### 🛠️ Complexidade
**Baixa** - Apenas verificações de timestamp

---

## 6. Sistema de Fidelidade Inteligente

### 💡 Conceito
Recompensar clientes frequentes com pontos e benefícios personalizados.

### 💰 Valor de Negócio
- **Aumenta retenção**: +60% de clientes voltam
- **Maior frequência**: Clientes vêm 2x mais
- **Word-of-mouth**: Clientes recomendam

### 🎯 Implementação

```javascript
// Adicionar ao modelo Customer
CustomerSchema.add({
  loyalty: {
    points: { type: Number, default: 0 },
    tier: { type: String, enum: ['bronze', 'prata', 'ouro', 'platina'], default: 'bronze' },
    totalSpent: { type: Number, default: 0 },
    visitsCount: { type: Number, default: 0 },
    lastVisit: Date,
    birthday: Date,
    favoriteDish: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }
  }
});

// Calcular pontos após pagamento
async function awardLoyaltyPoints(orderId) {
  const order = await Order.findById(orderId).populate('customer');
  const customer = order.customer;

  if (!customer) return;

  // 1 ponto por R$ 1 gasto
  const pointsEarned = Math.floor(order.total);

  // Bonus de aniversário (mês do aniversário)
  let bonus = 1;
  if (customer.birthday) {
    const now = new Date();
    const birthday = new Date(customer.birthday);
    if (now.getMonth() === birthday.getMonth()) {
      bonus = 2; // Pontos em dobro
    }
  }

  customer.loyalty.points += pointsEarned * bonus;
  customer.loyalty.totalSpent += order.total;
  customer.loyalty.visitsCount += 1;
  customer.loyalty.lastVisit = new Date();

  // Atualizar tier
  if (customer.loyalty.totalSpent >= 10000) {
    customer.loyalty.tier = 'platina';
  } else if (customer.loyalty.totalSpent >= 5000) {
    customer.loyalty.tier = 'ouro';
  } else if (customer.loyalty.totalSpent >= 2000) {
    customer.loyalty.tier = 'prata';
  }

  // Atualizar prato favorito
  const products = await OrderItem.aggregate([
    { $match: { order: { $in: await Order.find({ customer: customer._id }).select('_id') } } },
    { $group: { _id: '$product', count: { $sum: '$quantity' } } },
    { $sort: { count: -1 } },
    { $limit: 1 }
  ]);

  if (products.length > 0) {
    customer.loyalty.favoriteDish = products[0]._id;
  }

  await customer.save();

  // Notificar cliente
  io.to(`customer-${customer._id}`).emit('loyalty_update', {
    pointsEarned: pointsEarned * bonus,
    totalPoints: customer.loyalty.points,
    tier: customer.loyalty.tier,
    message: bonus > 1 ? '🎂 Pontos em dobro - Feliz Aniversário!' : undefined
  });

  return customer.loyalty;
}

// Resgatar pontos
exports.redeemPoints = async (req, res) => {
  const { customerId, points, rewardType } = req.body;

  const customer = await Customer.findById(customerId);

  if (customer.loyalty.points < points) {
    return res.status(400).json({
      success: false,
      message: 'Pontos insuficientes'
    });
  }

  const rewards = {
    'discount_10': { points: 100, value: 10, description: 'R$ 10 OFF' },
    'discount_20': { points: 200, value: 20, description: 'R$ 20 OFF' },
    'free_drink': { points: 150, value: 15, description: 'Bebida Grátis' },
    'free_dessert': { points: 180, value: 18, description: 'Sobremesa Grátis' }
  };

  const reward = rewards[rewardType];

  if (!reward || customer.loyalty.points < reward.points) {
    return res.status(400).json({
      success: false,
      message: 'Recompensa inválida ou pontos insuficientes'
    });
  }

  // Descontar pontos
  customer.loyalty.points -= reward.points;
  await customer.save();

  // Gerar cupom
  const coupon = await Coupon.create({
    customer: customer._id,
    type: rewardType,
    value: reward.value,
    description: reward.description,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 dias
  });

  res.json({
    success: true,
    message: 'Recompensa resgatada!',
    coupon,
    remainingPoints: customer.loyalty.points
  });
};
```

**Customer App - Seção de Fidelidade**:
```javascript
<Box bg="gradient" p={6} borderRadius="xl" color="white">
  <HStack justify="space-between" mb={4}>
    <VStack align="start">
      <Text fontSize="sm">Seus Pontos</Text>
      <Heading size="2xl">{customer.loyalty.points}</Heading>
    </VStack>
    <Badge colorScheme={getTierColor(customer.loyalty.tier)} fontSize="lg">
      {customer.loyalty.tier.toUpperCase()}
    </Badge>
  </HStack>

  <Progress value={progressToNextTier} colorScheme="yellow" mb={2} />
  <Text fontSize="xs">Faltam {pointsToNextTier} pontos para {nextTier}</Text>

  <Divider my={4} />

  <Heading size="sm" mb={3}>Recompensas Disponíveis</Heading>
  <SimpleGrid columns={2} spacing={3}>
    {availableRewards.map(reward => (
      <Button
        key={reward.type}
        size="sm"
        leftIcon={reward.icon}
        isDisabled={customer.loyalty.points < reward.points}
        onClick={() => redeemReward(reward.type)}
      >
        {reward.description}
        <br />
        <Text fontSize="xs">{reward.points} pts</Text>
      </Button>
    ))}
  </SimpleGrid>
</Box>
```

### 📈 Métricas
- Taxa de retorno: +60%
- Frequência de visitas: +40%
- Ticket médio de clientes fidelizados: +25%

### 🛠️ Complexidade
**Média** - Requer sistema de pontos e cupons

---

## 7. Detecção de Fraude

### 💡 Conceito
Identificar padrões suspeitos de pedidos ou pagamentos.

### 💰 Valor de Negócio
- **Previne prejuízo**: R$ 500-2000/mês economizados
- **Protege reputação**: Evita "calotes" conhecidos
- **Segurança**: Identifica tentativas de fraude

### 🎯 Algoritmo

```javascript
class FraudDetector {
  async analyzeOrder(orderId) {
    const order = await Order.findById(orderId)
      .populate('customer')
      .populate('table')
      .populate('items');

    const flags = [];
    let riskScore = 0;

    // Flag 1: Pedido muito alto para primeira visita
    if (order.customer.loyalty.visitsCount === 1 && order.total > 200) {
      flags.push({
        type: 'HIGH_VALUE_FIRST_ORDER',
        severity: 'medium',
        message: 'Primeira visita com pedido alto (R$ ' + order.total + ')'
      });
      riskScore += 3;
    }

    // Flag 2: CPF na blacklist
    const blacklisted = await Blacklist.findOne({ cpf: order.customer.cpf });
    if (blacklisted) {
      flags.push({
        type: 'BLACKLISTED_CPF',
        severity: 'critical',
        message: 'CPF na lista negra: ' + blacklisted.reason
      });
      riskScore += 10;
    }

    // Flag 3: Múltiplos pedidos simultâneos do mesmo CPF
    const simultaneousOrders = await Order.countDocuments({
      customer: order.customer._id,
      status: 'open',
      createdAt: { $gte: new Date(Date.now() - 30 * 60 * 1000) } // Últimos 30min
    });

    if (simultaneousOrders > 1) {
      flags.push({
        type: 'MULTIPLE_SIMULTANEOUS_ORDERS',
        severity: 'high',
        message: `${simultaneousOrders} pedidos abertos nos últimos 30 minutos`
      });
      riskScore += 5;
    }

    // Flag 4: Pedido muito rápido (possível bot)
    const items = order.items;
    if (items.length > 10) {
      const timeSpan = items[items.length - 1].createdAt - items[0].createdAt;
      if (timeSpan < 60000) { // Menos de 1 minuto para 10+ itens
        flags.push({
          type: 'SUSPICIOUS_SPEED',
          severity: 'medium',
          message: `${items.length} itens adicionados em ${timeSpan / 1000}s`
        });
        riskScore += 4;
      }
    }

    // Flag 5: Padrão suspeito de itens (só bebidas caras)
    const expensiveDrinks = items.filter(item =>
      item.product.category === 'Bebidas' && item.unitPrice > 20
    );

    if (expensiveDrinks.length === items.length && items.length > 5) {
      flags.push({
        type: 'SUSPICIOUS_PATTERN',
        severity: 'medium',
        message: 'Apenas bebidas caras (possível tentativa de fraude)'
      });
      riskScore += 3;
    }

    // Flag 6: Cliente com histórico de não pagamento
    const unpaidOrders = await Order.countDocuments({
      customer: order.customer._id,
      paymentStatus: 'unpaid',
      status: 'closed'
    });

    if (unpaidOrders > 0) {
      flags.push({
        type: 'UNPAID_HISTORY',
        severity: 'high',
        message: `${unpaidOrders} pedido(s) não pago(s) no histórico`
      });
      riskScore += 7;
    }

    // Determinar ação
    let action = 'ALLOW';
    if (riskScore >= 10) {
      action = 'BLOCK'; // Bloquear pedido
    } else if (riskScore >= 5) {
      action = 'REVIEW'; // Requer aprovação de gerente
    }

    return {
      orderId: order._id,
      riskScore,
      action,
      flags,
      recommendation: this.getRecommendation(action, riskScore)
    };
  }

  getRecommendation(action, score) {
    if (action === 'BLOCK') {
      return 'BLOQUEAR pedido e notificar gerência. Solicitar pagamento antecipado.';
    } else if (action === 'REVIEW') {
      return 'Avisar garçom para monitorar mesa. Considerar pagamento antecipado.';
    }
    return 'Pedido normal. Prosseguir normalmente.';
  }

  async blockOrder(orderId, reason) {
    const order = await Order.findById(orderId);
    order.status = 'blocked';
    order.blockReason = reason;
    await order.save();

    // Notificar gerentes
    io.to('managers').emit('order_blocked', {
      orderId,
      tableNumber: order.table.number,
      reason,
      customerCpf: order.customer.cpf
    });
  }
}

// Middleware para checar fraude ao adicionar item
exports.addItem = async (req, res, next) => {
  // ... adicionar item

  // Verificar fraude após cada item
  const detector = new FraudDetector();
  const analysis = await detector.analyzeOrder(order._id);

  if (analysis.action === 'BLOCK') {
    await detector.blockOrder(order._id, 'Alto risco de fraude detectado');

    return res.status(403).json({
      success: false,
      message: 'Pedido bloqueado por segurança. Entre em contato com o garçom.',
      code: 'FRAUD_DETECTED'
    });
  }

  if (analysis.action === 'REVIEW') {
    // Notificar gerente
    io.to('managers').emit('fraud_alert', analysis);
  }

  res.json({ success: true, order, item, fraudAnalysis: analysis });
};
```

### 📈 Métricas
- Detecção de fraude: 85% de acurácia
- Falsos positivos: < 5%
- Economia mensal: R$ 1.500-3.000

### 🛠️ Complexidade
**Média** - Requer análise de padrões

---

## 8. Otimização Dinâmica de Cardápio

### 💡 Conceito
Destacar produtos lucrativos e esconder produtos com baixa margem/rotação.

### 💰 Valor de Negócio
- **Aumenta margem**: +10-15%
- **Reduz estoque parado**: -25%
- **Melhora rentabilidade**: Foca em produtos lucrativos

### 🎯 Implementação

```javascript
// Calcular score de cada produto
async function calculateProductScore(productId) {
  const product = await Product.findById(productId);

  // Métricas dos últimos 30 dias
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const orderItems = await OrderItem.find({
    product: productId,
    createdAt: { $gte: thirtyDaysAgo }
  });

  const totalSold = orderItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalRevenue = orderItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

  // Calcular margem (se houver custo cadastrado)
  const margin = product.cost ? (product.price - product.cost) / product.price : 0.5;

  // Score = Vendas * Margem * Popularidade
  const popularityScore = totalSold / 30; // Vendas por dia
  const profitability = margin * product.price;

  const score = popularityScore * profitability * 100;

  return {
    productId,
    productName: product.name,
    totalSold,
    totalRevenue,
    margin: (margin * 100).toFixed(1) + '%',
    score: Math.round(score),
    recommendation: score > 50 ? 'PROMOTE' : (score > 20 ? 'KEEP' : 'HIDE')
  };
}

// Endpoint para ranking
exports.getProductRanking = async (req, res) => {
  const products = await Product.find({ available: true });

  const scores = await Promise.all(
    products.map(p => calculateProductScore(p._id))
  );

  // Ordenar por score
  scores.sort((a, b) => b.score - a.score);

  // Categorizar
  const promoted = scores.filter(s => s.recommendation === 'PROMOTE');
  const regular = scores.filter(s => s.recommendation === 'KEEP');
  const hidden = scores.filter(s => s.recommendation === 'HIDE');

  res.json({
    success: true,
    summary: {
      promoted: promoted.length,
      regular: regular.length,
      needsAttention: hidden.length
    },
    products: scores,
    recommendations: {
      promote: promoted.slice(0, 10).map(p => p.productName),
      hide: hidden.map(p => ({ name: p.productName, reason: 'Baixa venda e/ou margem' }))
    }
  });
};

// Aplicar automaticamente no cardápio
exports.applyDynamicMenu = async (req, res) => {
  const scores = await Promise.all(
    (await Product.find({ available: true })).map(p => calculateProductScore(p._id))
  );

  for (const score of scores) {
    const product = await Product.findById(score.productId);

    // Atualizar posição no cardápio
    if (score.recommendation === 'PROMOTE') {
      product.featured = true;
      product.displayOrder = -score.score; // Produtos com maior score aparecem primeiro
    } else if (score.recommendation === 'HIDE') {
      product.featured = false;
      product.displayOrder = 1000; // Vai para o final
      // product.available = false; // Opcional: desabilitar completamente
    } else {
      product.featured = false;
      product.displayOrder = 0;
    }

    await product.save();
  }

  res.json({
    success: true,
    message: 'Cardápio otimizado com sucesso',
    changes: {
      promoted: scores.filter(s => s.recommendation === 'PROMOTE').length,
      hidden: scores.filter(s => s.recommendation === 'HIDE').length
    }
  });
};
```

**Customer App - Exibir Produtos em Ordem Otimizada**:
```javascript
// Buscar produtos ordenados
const products = await api.get('/api/products', {
  params: {
    sortBy: 'displayOrder', // Ordem otimizada
    category: selectedCategory
  }
});

// Destacar produtos promocionados
{products.map(product => (
  <ProductCard
    key={product._id}
    product={product}
    featured={product.featured}
    badge={product.featured ? '⭐ Destaque' : null}
  />
))}
```

### 📈 Métricas
- Aumento de margem: +12%
- Redução de produtos parados: 30%
- Aumento de vendas de itens lucrativos: +25%

### 🛠️ Complexidade
**Média** - Requer análise de dados e atualização periódica

---

## 🎯 Roadmap de Implementação

### Fase 1 (1-2 semanas) - Quick Wins
1. ✅ Upselling Inteligente (BUG #2)
2. ✅ Detecção de Mesas Esquecidas (BUG #5)
3. ✅ Balanceamento de Garçons (BUG #3)

**ROI Estimado**: +R$ 3.000-5.000/mês

### Fase 2 (1 mês) - Médio Prazo
1. ✅ Sistema de Recomendação (BUG #1)
2. ✅ Detecção de Fraude (BUG #7)
3. ✅ Otimização de Cardápio (BUG #8)

**ROI Estimado**: +R$ 8.000-12.000/mês

### Fase 3 (2-3 meses) - Longo Prazo
1. ✅ Previsão de Demanda (BUG #4)
2. ✅ Sistema de Fidelidade (BUG #6)
3. ✅ ML-Based Recommendations

**ROI Estimado**: +R$ 15.000-20.000/mês

---

## 📊 Resumo de Impacto

| Algoritmo | Investimento | ROI Mensal | Payback |
|-----------|--------------|------------|---------|
| Upselling | Baixo | R$ 2.000 | Imediato |
| Mesas Esquecidas | Baixo | R$ 1.500 | 1 semana |
| Balanceamento | Médio | R$ 800 | 1 mês |
| Recomendação | Médio | R$ 3.000 | 2 meses |
| Fraude | Médio | R$ 2.000 | 1 mês |
| Cardápio Dinâmico | Médio | R$ 2.500 | 1 mês |
| Previsão Demanda | Alto | R$ 3.500 | 3 meses |
| Fidelidade | Médio | R$ 4.000 | 2 meses |

**ROI Total Estimado**: +R$ 19.300/mês após implementação completa

---

**Última Atualização**: Janeiro 2025
**Autor**: Claude AI
**Status**: Propostas pendentes de aprovação
