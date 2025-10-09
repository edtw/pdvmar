# 🔔 Sistema "Chamar Garçom" - Documentação Completa

## 📋 Resumo da Implementação

Sistema completo que permite clientes chamarem o garçom diretamente pelo aplicativo, com notificações em tempo real via WebSocket e histórico completo de chamadas.

---

## ✅ Componentes Implementados

### 1. **Modelo de Dados** (`WaiterCall`)

**Arquivo**: `/server/models/WaiterCall.js`

```javascript
{
  table: ObjectId,           // Mesa que chamou
  order: ObjectId,            // Pedido relacionado
  customer: ObjectId,         // Cliente que chamou
  waiter: ObjectId,           // Garçom responsável (pode ser null inicialmente)
  reason: String,             // Motivo: assistance, order, bill, complaint, question, other
  customReason: String,       // Razão personalizada (opcional)
  status: String,             // pending | attending | resolved | canceled
  respondedAt: Date,          // Quando o garçom começou a atender
  resolvedAt: Date,           // Quando foi resolvido
  responseTime: Number,       // Tempo de resposta em segundos (calculado automaticamente)
  notes: String              // Observações do garçom
}
```

**Features**:
- Cálculo automático de `responseTime` ao marcar como "attending"
- Índices para performance em queries
- Timestamps automáticos (createdAt, updatedAt)

---

### 2. **WebSocket Events**

**Arquivo**: `/server/config/socket.js`

**Evento Adicionado**: `emitWaiterCalled`

```javascript
emitWaiterCalled: (orderId, tableId, customer, reason) => {
  // Emite para sala de garçons
  io.to("waiters").emit("waiterCalled", {
    orderId,
    tableId,
    customer: { name, cpf },
    reason,
    timestamp: Date.now()
  });

  // Emite para sala de mesas (admin/manager)
  io.to("tables").emit("waiterCalled", { ... });
}
```

**Salas WebSocket**:
- `waiters` - Todos os garçons recebem notificação
- `tables` - Admin/managers também são notificados

---

### 3. **API Endpoint - Chamar Garçom**

**Arquivo**: `/server/controllers/customerController.js`

**Rota**: `POST /api/public/orders/:orderId/call-waiter`

**Body**:
```json
{
  "reason": "assistance",        // assistance | order | bill | complaint | question | other
  "customReason": "texto livre"  // opcional
}
```

**Validações**:
- ✅ CPF do cliente (middleware `verifyCpfForOrder`)
- ✅ Pedido existe e está aberto
- ✅ Tipo de pedido é `customer_self`
- ✅ Previne chamadas duplicadas (verifica se já existe pending/attending)

**Resposta Sucesso**:
```json
{
  "success": true,
  "message": "Garçom chamado com sucesso! Ele já foi notificado.",
  "call": { ... }
}
```

**Resposta Erro (já existe chamada pendente)**:
```json
{
  "success": false,
  "message": "Já existe uma solicitação em andamento. O garçom já foi avisado!",
  "existingCall": true
}
```

---

### 4. **Frontend - Customer App**

**Arquivo**: `/customer-app/src/pages/MyOrder.js`

**Botão Adicionado**:
```jsx
<Button
  colorScheme="purple"
  size="lg"
  width="full"
  onClick={handleCallWaiter}
  isLoading={callingWaiter}
  loadingText="Chamando..."
  borderRadius="full"
  boxShadow="lg"
  minH="60px"
  fontSize="lg"
  fontWeight="600"
>
  🔔 Chamar Garçom
</Button>
```

**Função**:
```javascript
const handleCallWaiter = async () => {
  try {
    setCallingWaiter(true);
    await publicAPI.callWaiter(orderId, { reason: 'assistance' });

    toast({
      title: '🔔 Garçom chamado!',
      description: 'O garçom foi notificado e virá atendê-lo em breve.',
      status: 'success',
      duration: 5000,
      position: 'top'
    });
  } catch (err) {
    toast({
      title: 'Erro',
      description: err.response?.data?.message,
      status: 'error'
    });
  } finally {
    setCallingWaiter(false);
  }
};
```

**API Service**:
```javascript
// customer-app/src/services/api.js
callWaiter: (orderId, data) => {
  return api.post(`/public/orders/${orderId}/call-waiter`, {
    ...data,
    customerCpf: getCustomerCpf()
  });
}
```

---

### 5. **Frontend - WaiterView (Notificações)**

**Arquivo**: `/client/src/pages/WaiterView.js`

**WebSocket Listener**:
```javascript
socket.on('waiterCalled', (data) => {
  console.log('[Waiter] Garçom chamado:', data);

  toast({
    title: '🔔 Cliente Chamando!',
    description: `Mesa ${data.tableId?.number} - ${data.customer?.name}`,
    status: 'info',
    duration: 8000,
    isClosable: true,
    position: 'top',
    variant: 'left-accent'
  });

  loadData(); // Atualiza lista de mesas
});
```

**Limpeza**:
```javascript
return () => {
  if (socket) {
    socket.off('newOrder');
    socket.off('itemStatusChanged');
    socket.off('billRequested');
    socket.off('waiterCalled');  // 👈 Adicionado
  }
};
```

---

### 6. **API - Histórico de Chamadas**

**Arquivo**: `/server/routes/waiterCallRoutes.js`

#### **GET /api/waiter-calls**
Lista todas as chamadas (com filtros)

**Query Params**:
- `status` - pending | attending | resolved | canceled
- `waiterId` - Filtrar por garçom
- `tableId` - Filtrar por mesa
- `startDate` - Data inicial
- `endDate` - Data final

**Permissões**:
- Garçom: vê apenas suas chamadas
- Manager/Admin: vê todas

**Resposta**:
```json
{
  "success": true,
  "calls": [
    {
      "_id": "...",
      "table": { "number": 5 },
      "customer": { "name": "João Silva" },
      "waiter": { "name": "Maria" },
      "order": { "_id": "...", "total": 120.50 },
      "reason": "assistance",
      "status": "resolved",
      "responseTime": 45,  // segundos
      "createdAt": "2025-10-06T...",
      "resolvedAt": "2025-10-06T..."
    }
  ],
  "count": 15
}
```

#### **GET /api/waiter-calls/pending**
Chamadas pendentes do garçom logado

**Permissões**: Apenas garçom

**Resposta**:
```json
{
  "success": true,
  "calls": [
    {
      "table": { "number": 3 },
      "customer": { "name": "Ana Costa" },
      "reason": "assistance",
      "status": "pending",
      "createdAt": "..."
    }
  ],
  "count": 2
}
```

#### **PUT /api/waiter-calls/:id/status**
Atualizar status da chamada

**Body**:
```json
{
  "status": "attending",  // attending | resolved | canceled
  "notes": "Cliente queria pedir sobremesa"
}
```

**Validações**:
- ✅ Garçom pode atualizar apenas suas chamadas
- ✅ Admin/Manager podem atualizar qualquer chamada
- ✅ Auto-atribui garçom se estava sem waiter

**Resposta**:
```json
{
  "success": true,
  "message": "Status atualizado com sucesso",
  "call": { ... }
}
```

#### **GET /api/waiter-calls/stats**
Estatísticas sobre chamadas

**Permissões**: Manager/Admin

**Query Params**:
- `startDate`, `endDate` - Período

**Resposta**:
```json
{
  "success": true,
  "stats": {
    "totalCalls": 150,
    "pendingCalls": 3,
    "avgResponseTime": 62.5,  // segundos
    "callsByReason": [
      { "_id": "assistance", "count": 80 },
      { "_id": "bill", "count": 40 },
      { "_id": "order", "count": 30 }
    ]
  }
}
```

---

## 🎯 Fluxo Completo

### **1. Cliente Chama Garçom**

```
Cliente no MyOrder
  ↓
Clica "🔔 Chamar Garçom"
  ↓
POST /api/public/orders/:orderId/call-waiter
  ↓
Validações (CPF, pedido ativo, sem chamada duplicada)
  ↓
Cria WaiterCall no MongoDB
  ↓
Emite WebSocket → io.to("waiters").emit("waiterCalled", ...)
  ↓
Toast de sucesso para cliente
```

### **2. Garçom Recebe Notificação**

```
WaiterView escuta socket.on("waiterCalled")
  ↓
Exibe Toast: "🔔 Cliente Chamando! Mesa X - Nome"
  ↓
Atualiza lista de mesas (loadData())
  ↓
Garçom vê visualmente que tem chamada pendente
```

### **3. Garçom Atende**

```
Garçom vai até a mesa
  ↓
PUT /api/waiter-calls/:id/status
Body: { "status": "attending" }
  ↓
WaiterCall.respondedAt = now
WaiterCall.responseTime = (respondedAt - createdAt) / 1000
  ↓
Garçom resolve o problema
  ↓
PUT /api/waiter-calls/:id/status
Body: { "status": "resolved", "notes": "Cliente queria pedir sobremesa" }
  ↓
WaiterCall.resolvedAt = now
```

### **4. Admin Analisa Métricas**

```
GET /api/waiter-calls/stats?startDate=2025-10-01&endDate=2025-10-07
  ↓
Recebe:
- Total de chamadas: 150
- Tempo médio de resposta: 62.5s
- Chamadas por motivo: assistance (80), bill (40), order (30)
  ↓
Identifica gargalos e oportunidades de melhoria
```

---

## 📊 Motivos de Chamada

| Reason | Descrição | Exemplo |
|--------|-----------|---------|
| `assistance` | Precisa de ajuda geral | Cliente quer ajuda para escolher vinho |
| `order` | Fazer pedido adicional | Cliente quer pedir sobremesa |
| `bill` | Pedir conta | Cliente quer fechar a conta |
| `complaint` | Reclamação | Comida veio fria |
| `question` | Dúvida | Pergunta sobre ingrediente |
| `other` | Outro | Qualquer outro motivo |

---

## 🔒 Segurança

### **Validações Implementadas**:

1. ✅ **CPF obrigatório** (middleware `verifyCpfForOrder`)
2. ✅ **Pedido deve ser customer_self** (não permite em pedidos de garçom)
3. ✅ **Pedido deve estar aberto** (não permite em pedidos fechados)
4. ✅ **Previne spam**: Verifica se já existe chamada pending/attending
5. ✅ **Garçom só atualiza suas chamadas** (ou admin/manager)

### **Rate Limiting**:
- Rota pública: 100 req/15min (via `publicLimiter`)
- Previne abuso de chamadas

---

## 📈 Métricas e Analytics

### **KPIs Disponíveis**:

1. **Tempo Médio de Resposta**
   - Medido em segundos
   - Calculado automaticamente
   - Útil para avaliar qualidade do serviço

2. **Chamadas por Motivo**
   - Identifica principais necessidades dos clientes
   - Ajuda a treinar equipe

3. **Taxa de Resolução**
   - % de chamadas resolvidas vs canceladas
   - Indica eficiência do atendimento

4. **Chamadas por Garçom**
   - Identifica sobrecarga de trabalho
   - Ajuda no balanceamento

---

## 🚀 Próximas Melhorias (Opcionais)

### **1. Dashboard de Chamadas (Frontend)**
- Painel visual para garçons verem chamadas pendentes
- Botão para marcar como atendendo/resolvido
- Histórico de chamadas

### **2. Notificações Push**
- Notificação nativa no celular do garçom
- Som de alerta customizado
- Vibração

### **3. Priorização Inteligente**
- Chamadas mais antigas têm prioridade maior
- Clientes VIP têm prioridade alta
- Algoritmo de fila inteligente

### **4. Chat Rápido**
- Cliente pode enviar mensagem junto com chamada
- "Preciso de mais guardanapos"
- Garçom vê antes de ir até a mesa

### **5. Integração com Smart Notifications**
- Mostrar chamadas pendentes no componente SmartNotifications
- Badge com contador de chamadas pendentes
- Alerta sonoro no navegador

---

## 🧪 Como Testar

### **1. Testar Chamada do Cliente**

```bash
# Via curl (simula o app do cliente)
curl -X POST http://localhost:5000/api/public/orders/ORDER_ID/call-waiter \
  -H "Content-Type: application/json" \
  -d '{
    "customerCpf": "12345678900",
    "reason": "assistance",
    "customReason": "Preciso de mais água"
  }'
```

### **2. Testar Recebimento (Garçom)**

1. Abrir WaiterView no navegador
2. Abrir console do navegador
3. Cliente chama garçom
4. Verificar:
   - Log: `[Waiter] Garçom chamado:`
   - Toast aparece na tela
   - Dados corretos (mesa, cliente)

### **3. Testar Histórico**

```bash
# Listar todas as chamadas
curl http://localhost:5000/api/waiter-calls \
  -H "Authorization: Bearer TOKEN_DO_GARCOM"

# Listar apenas pendentes
curl http://localhost:5000/api/waiter-calls/pending \
  -H "Authorization: Bearer TOKEN_DO_GARCOM"

# Atualizar status
curl -X PUT http://localhost:5000/api/waiter-calls/CALL_ID/status \
  -H "Authorization: Bearer TOKEN_DO_GARCOM" \
  -H "Content-Type: application/json" \
  -d '{"status": "attending"}'
```

### **4. Testar Estatísticas (Admin)**

```bash
curl "http://localhost:5000/api/waiter-calls/stats?startDate=2025-10-01&endDate=2025-10-07" \
  -H "Authorization: Bearer TOKEN_DO_ADMIN"
```

---

## ✅ Checklist de Implementação

- [x] Modelo WaiterCall criado
- [x] Evento WebSocket emitWaiterCalled
- [x] Endpoint POST /call-waiter
- [x] Validações de segurança (CPF, duplicate check)
- [x] Botão no Customer App (MyOrder)
- [x] API callWaiter no publicAPI
- [x] Notificação no WaiterView (WebSocket)
- [x] Rotas de histórico (/api/waiter-calls)
- [x] GET /waiter-calls (lista com filtros)
- [x] GET /waiter-calls/pending
- [x] PUT /waiter-calls/:id/status
- [x] GET /waiter-calls/stats
- [x] Documentação completa

---

## 📝 Arquivos Criados/Modificados

### **Criados**:
- `/server/models/WaiterCall.js`
- `/server/routes/waiterCallRoutes.js`
- `/docs/CALL_WAITER_FEATURE.md` (este arquivo)

### **Modificados**:
- `/server/config/socket.js` - Adicionado emitWaiterCalled
- `/server/controllers/customerController.js` - Adicionado callWaiter
- `/server/routes/customerRoutes.js` - Adicionada rota call-waiter
- `/server/server.js` - Registrada rota waiterCallRoutes
- `/customer-app/src/pages/MyOrder.js` - Adicionado botão e função
- `/customer-app/src/services/api.js` - Adicionada callWaiter
- `/client/src/pages/WaiterView.js` - Adicionado listener waiterCalled

---

**Sistema "Chamar Garçom" 100% Funcional!** 🎉

Agora os clientes podem chamar o garçom com um simples toque, e os garçons recebem notificações em tempo real. Tudo registrado em histórico completo para análise de performance! 🔔
