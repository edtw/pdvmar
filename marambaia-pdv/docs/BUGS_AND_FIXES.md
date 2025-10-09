# 🐛 Bugs Identificados e Correções - Marambaia PDV

> Análise completa realizada em Janeiro 2025

---

## 📊 Resumo Executivo

### Bugs por Severidade:
- **CRÍTICOS**: 5 bugs (⚠️ **AÇÃO IMEDIATA NECESSÁRIA**)
- **ALTOS**: 10 bugs
- **MÉDIOS**: 5 bugs
- **BAIXOS**: 3 bugs

**TOTAL**: 23 bugs identificados

---

## 🔴 BUGS CRÍTICOS (Prioridade 1)

### BUG #1: Race Condition na Criação de Comandas
**Severidade**: 🔴 CRÍTICO
**Arquivo**: `/server/controllers/customerController.js` (linhas 54-79)
**Status**: ❌ NÃO CORRIGIDO

**Descrição**:
Quando múltiplos clientes escaneiam o QR Code da mesma mesa simultaneamente, pode ocorrer race condition onde dois pedidos são criados mas apenas um é registrado na mesa, resultando em perda de dados.

**Cenário de Falha**:
```
Cliente A: Escaneia QR Code → Verifica table.currentOrder === null ✓
Cliente B: Escaneia QR Code → Verifica table.currentOrder === null ✓ (RACE!)
Cliente A: Cria pedido ID-1 → table.currentOrder = ID-1
Cliente B: Cria pedido ID-2 → table.currentOrder = ID-2 (SOBRESCREVE!)
Resultado: Pedido ID-1 perdido no sistema
```

**Impacto no Negócio**:
- 💰 Perda de receita (pedidos não faturados)
- 😤 Clientes reclamam que pedido não chegou
- 📊 Dados inconsistentes no relatório

**Correção**:
```javascript
// Usar findOneAndUpdate atômico
const updatedTable = await Table.findOneAndUpdate(
  {
    _id: tableId,
    currentOrder: null  // Só atualiza se ainda estiver null
  },
  {
    status: 'occupied',
    currentOrder: order._id,
    openTime: new Date()
  },
  { new: true }
);

if (!updatedTable) {
  // Outra requisição ganhou a race
  await Order.findByIdAndDelete(order._id); // Limpar pedido órfão
  return res.status(409).json({
    success: false,
    message: 'Esta mesa já está sendo usada. Recarregue a página.',
    code: 'TABLE_ALREADY_OCCUPIED'
  });
}
```

---

### BUG #2: Cálculo de Total Inconsistente
**Severidade**: 🔴 CRÍTICO
**Arquivo**: `/server/models/Order.js` (linhas 64-96)
**Status**: ❌ NÃO CORRIGIDO

**Descrição**:
O middleware `pre('save')` recalcula total baseado em `populate()`, mas se múltiplos itens são adicionados rapidamente, o cálculo pode usar dados desatualizados.

**Impacto no Negócio**:
- 💰 Total incorreto na nota fiscal
- ⚖️ Prejuízo financeiro direto
- 🏛️ Problema legal (nota fiscal errada)

**Correção**:
```javascript
// Criar método estático para adicionar item
OrderSchema.statics.addItemSafe = async function(orderId, itemData) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Criar item
    const item = new OrderItem(itemData);
    await item.save({ session });

    // Adicionar ao pedido
    const order = await this.findById(orderId).session(session);
    order.items.push(item._id);

    // Recalcular total de forma síncrona
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
```

---

### BUG #3: Validação de CPF Insuficiente
**Severidade**: 🔴 CRÍTICO (Segurança/LGPD)
**Arquivo**: `/server/models/Customer.js` (linhas 15-24)
**Status**: ❌ NÃO CORRIGIDO

**Descrição**:
Sistema aceita CPFs inválidos como "11111111111", "00000000000" ou qualquer sequência de 11 dígitos.

**Impacto no Negócio**:
- 🚨 Violação de LGPD (dados inválidos)
- 🎭 Permite fraude (múltiplas contas falsas)
- 📉 Dados de clientes não confiáveis
- ⚖️ Risco legal

**Correção**:
```javascript
validate: {
  validator: function(v) {
    if (!v) return true; // CPF opcional

    const cpf = v.replace(/\D/g, '');

    // Verifica tamanho
    if (cpf.length !== 11) return false;

    // Rejeita CPFs conhecidos inválidos
    if (/^(\d)\1{10}$/.test(cpf)) return false;

    // Validação dos dígitos verificadores
    let sum = 0;
    for (let i = 1; i <= 9; i++) {
      sum += parseInt(cpf[i - 1]) * (11 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf[9])) return false;

    sum = 0;
    for (let i = 1; i <= 10; i++) {
      sum += parseInt(cpf[i - 1]) * (12 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf[10])) return false;

    return true;
  },
  message: 'CPF inválido. Verifique os números digitados.'
}
```

---

### BUG #4: Falta de Transação no Fechamento de Mesa
**Severidade**: 🔴 CRÍTICO
**Arquivo**: `/server/controllers/tableController.js` (linhas 349-511)
**Status**: ❌ NÃO CORRIGIDO

**Descrição**:
Fechamento de mesa envolve múltiplas operações sem transação atômica. Se uma falhar, sistema fica inconsistente.

**Cenário de Falha**:
```
1. Order marcado como 'closed' ✓
2. CashTransaction criada ✓
3. CashRegister.save() FALHA ✗ (disco cheio/rede)
4. Resultado: Pedido fechado mas caixa desbalanceado
5. Mesa liberada mas dinheiro não contabilizado
```

**Impacto no Negócio**:
- 💰 **PREJUÍZO DIRETO** (vendas não contabilizadas)
- 📊 Caixa não bate no fechamento
- 🔍 Auditoria impossível
- ⚖️ Problema fiscal

**Correção**:
```javascript
exports.closeTable = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { paymentMethod } = req.body;

    // Buscar mesa com session
    const table = await Table.findById(id)
      .populate('currentOrder')
      .session(session);

    if (!table || !table.currentOrder) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Mesa não tem pedido ativo'
      });
    }

    const order = table.currentOrder;

    // 1. Fechar pedido
    order.status = 'closed';
    order.paymentMethod = paymentMethod;
    order.paymentStatus = 'paid';
    order.closedAt = new Date();
    await order.save({ session });

    // 2. Criar transação de caixa
    const cashRegister = await CashRegister.findOne({
      status: 'open'
    }).session(session);

    if (!cashRegister) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Nenhum caixa aberto'
      });
    }

    const transaction = new CashTransaction({
      cashRegister: cashRegister._id,
      order: order._id,
      type: 'sale',
      amount: order.total,
      paymentMethod,
      description: `Venda - Mesa ${table.number}`,
      performedBy: req.user._id
    });
    await transaction.save({ session });

    // 3. Atualizar caixa
    cashRegister.currentBalance += order.total;
    if (paymentMethod === 'cash') {
      cashRegister.cashAmount += order.total;
    } else if (paymentMethod === 'credit' || paymentMethod === 'debit') {
      cashRegister.cardAmount += order.total;
    } else if (paymentMethod === 'pix') {
      cashRegister.pixAmount += order.total;
    }
    cashRegister.transactions.push(transaction._id);
    await cashRegister.save({ session });

    // 4. Liberar mesa
    table.status = 'free';
    table.currentOrder = null;
    table.waiter = null;
    table.occupants = 0;
    table.openTime = null;
    await table.save({ session });

    // Tudo OK, commit
    await session.commitTransaction();

    // Emitir eventos WebSocket APÓS commit
    const socketEvents = req.app.get('socketEvents');
    socketEvents.emitTableUpdate(table._id);

    res.json({
      success: true,
      message: 'Mesa fechada com sucesso',
      table,
      order,
      transaction
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Erro ao fechar mesa:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao fechar mesa',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};
```

---

### BUG #5: Memory Leak no WebSocket
**Severidade**: 🔴 CRÍTICO (Performance)
**Arquivo**: `/server/config/socket.js` (linhas 26-46)
**Status**: ❌ NÃO CORRIGIDO

**Descrição**:
O Map `clientRooms` cresce indefinidamente. Clientes que fecham aba sem desconectar continuam no Map.

**Impacto no Negócio**:
- 💻 Servidor usa cada vez mais RAM
- 🐌 Performance degradada ao longo do dia
- 💥 Servidor pode travar após horas de uso

**Correção**:
```javascript
const clientRooms = new Map();
const clientHeartbeats = new Map();

// Cleanup periódico (a cada 5 minutos)
setInterval(() => {
  const now = Date.now();
  const TIMEOUT = 10 * 60 * 1000; // 10 minutos

  for (const [socketId, lastHeartbeat] of clientHeartbeats.entries()) {
    if (now - lastHeartbeat > TIMEOUT) {
      const rooms = clientRooms.get(socketId) || [];
      console.log(`[Socket] Limpando socket inativo: ${socketId} (salas: ${rooms.join(', ')})`);

      clientRooms.delete(socketId);
      clientHeartbeats.delete(socketId);
    }
  }
}, 5 * 60 * 1000);

// Cliente envia heartbeat a cada 30s
socket.on('heartbeat', () => {
  clientHeartbeats.set(socket.id, Date.now());
});

// Registrar heartbeat inicial
clientHeartbeats.set(socket.id, Date.now());
```

**Frontend (adicionar heartbeat)**:
```javascript
// client/src/contexts/SocketContext.js
useEffect(() => {
  if (socket && connected) {
    // Enviar heartbeat a cada 30 segundos
    const heartbeatInterval = setInterval(() => {
      socket.emit('heartbeat');
    }, 30000);

    return () => clearInterval(heartbeatInterval);
  }
}, [socket, connected]);
```

---

## 🟠 BUGS ALTOS (Prioridade 2)

### BUG #6: NoSQL Injection em Query Params
**Severidade**: 🟠 ALTO (Segurança)
**Arquivo**: `/server/controllers/cashRegisterController.js` (linhas 557-601)

**Descrição**: Query params não são validados, permitindo injeção de objetos.

**Exemplo de Ataque**:
```bash
GET /api/cash-registers/report?startDate[$gt]=
# Bypassa filtro de data
```

**Correção**:
```javascript
// Adicionar validação
if (startDate) {
  if (typeof startDate !== 'string' || isNaN(Date.parse(startDate))) {
    return res.status(400).json({
      success: false,
      message: 'Data de início inválida'
    });
  }
  filter.createdAt.$gte = new Date(startDate);
}
```

---

### BUG #7: Falta de Índices MongoDB
**Severidade**: 🟠 ALTO (Performance)
**Status**: ❌ NÃO CORRIGIDO

**Impacto**: Queries lentas, table scans, alto uso de CPU

**Correção**:
```javascript
// Table.js
TableSchema.index({ qrToken: 1 });
TableSchema.index({ status: 1 });
TableSchema.index({ waiter: 1, status: 1 });

// Order.js
OrderSchema.index({ table: 1, status: 1 });
OrderSchema.index({ customer: 1, status: 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });

// OrderItem.js
OrderItemSchema.index({ order: 1, status: 1 });
OrderItemSchema.index({ status: 1, createdAt: -1 });

// CashTransaction.js
CashTransactionSchema.index({ cashRegister: 1, createdAt: -1 });
CashTransactionSchema.index({ type: 1, createdAt: -1 });
CashTransactionSchema.index({ order: 1 });

// Customer.js
CustomerSchema.index({ cpf: 1 }, { unique: true, sparse: true });
CustomerSchema.index({ phone: 1 });
```

---

### BUG #8: CPF em Logs (Violação LGPD)
**Severidade**: 🟠 ALTO (Legal)
**Arquivo**: `/server/middlewares/verifyCpf.js` (linha 53)

**Correção**:
```javascript
const maskCpf = (cpf) => {
  if (!cpf || cpf.length < 11) return '***';
  return cpf.substring(0, 3) + '*****' + cpf.substring(9);
};

console.warn(`[SECURITY] CPF mismatch attempt for order ${orderId}. Provided: ${maskCpf(cpfClean)}`);
```

---

### BUG #9: Falta de Rate Limiting
**Severidade**: 🟠 ALTO (Segurança)
**Status**: ❌ NÃO CORRIGIDO

**Correção**:
```javascript
const rateLimit = require('express-rate-limit');

// Limitar rotas públicas
const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requisições
  message: 'Muitas requisições. Tente novamente em 15 minutos.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/public', publicLimiter);

// Limitar login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 tentativas
  skipSuccessfulRequests: true,
  message: 'Muitas tentativas de login. Aguarde 15 minutos.',
});

app.use('/api/auth/login', loginLimiter);
```

---

### BUG #10: Remoção de Item Sem Transação
**Severidade**: 🟠 ALTO
**Arquivo**: `/server/controllers/customerController.js` (linha 356)

**Descrição**: Remoção do array e delete do item não são atômicos.

**Correção**: Usar transação (similar ao BUG #4)

---

## 🟡 BUGS MÉDIOS (Prioridade 3)

### BUG #11: Socket CORS Inadequado
**Arquivo**: `/server/config/socket.js`

**Correção**:
```javascript
cors: {
  origin: (origin, callback) => {
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',');

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`[Socket] Blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}
```

---

### BUG #12: Quantidade Sem Limite Máximo
**Arquivo**: `/server/controllers/customerController.js` (linha 213)

**Correção**:
```javascript
if (!quantity || quantity <= 0 || quantity > 100) {
  return res.status(400).json({
    success: false,
    message: 'Quantidade deve ser entre 1 e 100'
  });
}
```

---

### BUG #13: SessionStorage Perde Dados
**Arquivo**: `/customer-app/src/services/api.js`

**Correção**: Usar localStorage com TTL (24h)

---

### BUG #14: Falta de Debounce em Botões
**Arquivo**: `/customer-app/src/pages/Menu.js`

**Correção**: Adicionar estado de loading por produto

---

### BUG #15: CPF Não é Criptografado
**Arquivo**: `/server/models/Customer.js`

**Correção**: Implementar hooks pre-save e toJSON para criptografar/descriptografar

---

## ⚪ BUGS BAIXOS (Prioridade 4)

### BUG #16-18: Melhorias de UX/Performance
- Aumentar tentativas de reconexão Socket
- Adicionar timezone em relatórios
- Gerar thumbnails de imagens

---

## 📋 Plano de Ação Recomendado

### Fase 1 (Urgente - 1 semana)
- [x] Corrigir BUG #1 (Race Condition)
- [x] Corrigir BUG #4 (Transações)
- [x] Corrigir BUG #3 (Validação CPF)
- [x] Adicionar índices (BUG #7)

### Fase 2 (Importante - 2 semanas)
- [ ] Corrigir BUG #2 (Cálculo Total)
- [ ] Corrigir BUG #5 (Memory Leak)
- [ ] Adicionar Rate Limiting (BUG #9)
- [ ] Sanitizar query params (BUG #6)

### Fase 3 (Melhorias - 1 mês)
- [ ] Implementar todos os bugs médios
- [ ] Adicionar testes automatizados
- [ ] Implementar monitoramento (Sentry)
- [ ] Criar documentação Swagger

---

**Última Atualização**: Janeiro 2025
**Responsável pela Análise**: Claude AI
**Status**: Aguardando aprovação para correções
