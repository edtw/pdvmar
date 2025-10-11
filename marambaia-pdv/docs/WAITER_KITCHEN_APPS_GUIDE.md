# Guia de Implementação - Apps de Garçom e Cozinha

## Visão Geral

Este guia detalha a implementação completa de dois apps mobile:

1. **Waiter App** - Para garçons gerenciarem suas mesas e pedidos
2. **Kitchen App** - Para cozinha visualizar e processar pedidos

Ambos com UI/UX moderna, responsiva e notificações em tempo real via WebSocket.

---

## 1. WAITER APP (Aplicativo do Garçom)

### Estrutura de Diretórios

```
waiter-app/
├── public/
├── src/
│   ├── components/
│   │   ├── TableCard.js
│   │   ├── OrderItem.js
│   │   ├── NotificationBadge.js
│   │   └── BottomNav.js
│   ├── pages/
│   │   ├── Login.js
│   │   ├── MyTables.js
│   │   ├── TableDetail.js
│   │   ├── AllOrders.js
│   │   └── Profile.js
│   ├── services/
│   │   ├── api.js
│   │   └── socket.js
│   ├── contexts/
│   │   ├── AuthContext.js
│   │   └── SocketContext.js
│   ├── theme.js
│   ├── App.js
│   └── index.js
├── package.json
└── .env
```

### Funcionalidades Principais

#### 1.1 Login de Garçom

```javascript
// pages/Login.js
- Autenticação com usuário e senha
- Apenas usuários com role='waiter'
- Token JWT armazenado em localStorage
- UI moderna com gradiente coastal
```

#### 1.2 Minhas Mesas

```javascript
// pages/MyTables.js
- Lista de mesas atribuídas ao garçom
- Status visual (livre, ocupada, aguardando pagamento)
- Badge de notificação quando cliente solicita conta
- Pull-to-refresh para atualizar
- Cards com animação de entrada
```

#### 1.3 Detalhes da Mesa

```javascript
// pages/TableDetail.js
- Informações do cliente (nome, CPF)
- Lista de itens do pedido
- Status de cada item (pendente, preparando, pronto, entregue)
- Botão "Marcar como Entregue" para itens com status "ready"
- Botão para fechar mesa e processar pagamento
- Total do pedido calculado em tempo real
- Atualização em tempo real via WebSocket
```

#### 1.4 Notificações em Tempo Real

```javascript
// services/socket.js
const socket = io(SERVER_URL, {
  auth: { token: getAuthToken() }
});

// Eventos do socket:
- 'bill_requested' → Cliente solicitou a conta
- 'table_updated' → Mesa foi atualizada
- 'order_updated' → Pedido foi modificado
- 'new_order_item' → Novo item adicionado
- 'itemStatusChanged' → Status de item mudou (preparando, pronto)

// Notificação visual:
- Badge vermelho no ícone da mesa
- Som de notificação
- Vibração (mobile)
- Toast notification
- Atualização visual instantânea de itens
```

### UI/UX Design

#### Paleta de Cores (Coastal Theme)

```javascript
colors: {
  primary: '#0891B2',     // Cyan 600
  secondary: '#14B8A6',   // Teal 500
  accent: '#06B6D4',      // Cyan 500
  background: '#F0F9FF',  // Sky 50
  surface: '#FFFFFF',
  error: '#DC2626',
  warning: '#F59E0B',
  success: '#10B981',
  text: {
    primary: '#0F172A',   // Slate 900
    secondary: '#64748B'  // Slate 500
  }
}
```

#### Components Principais

**TableCard Component:**

```jsx
<Card
  bg="white"
  borderRadius="xl"
  boxShadow="lg"
  p={4}
  position="relative"
  _hover={{ transform: "translateY(-4px)", boxShadow: "xl" }}
  transition="all 0.3s"
>
  {/* Badge de notificação */}
  {hasBillRequest && (
    <Badge
      position="absolute"
      top={2}
      right={2}
      colorScheme="red"
      fontSize="xs"
      px={2}
      py={1}
      borderRadius="full"
      animation="pulse 2s infinite"
    >
      Conta Solicitada!
    </Badge>
  )}

  {/* Número da mesa */}
  <HStack justify="space-between" mb={3}>
    <Heading size="md">Mesa {table.number}</Heading>
    <StatusBadge status={table.status} />
  </HStack>

  {/* Informações do cliente */}
  {table.currentOrder && (
    <VStack align="start" spacing={2}>
      <Text fontSize="sm" color="gray.600">
        Cliente: {table.currentOrder.customer.name}
      </Text>
      <Text fontSize="sm" fontWeight="bold" color="cyan.600">
        Total: R$ {table.currentOrder.total.toFixed(2)}
      </Text>
    </VStack>
  )}

  {/* Botão de ação */}
  <Button
    mt={4}
    w="full"
    colorScheme="cyan"
    size="md"
    onClick={() => navigate(`/table/${table._id}`)}
  >
    Ver Detalhes
  </Button>
</Card>
```

**BottomNav Component:**

```jsx
<Box
  position="fixed"
  bottom={0}
  left={0}
  right={0}
  bg="white"
  borderTop="1px solid"
  borderColor="gray.200"
  boxShadow="0 -2px 10px rgba(0,0,0,0.1)"
  safe
  Area="bottom"
>
  <HStack justify="space-around" py={3}>
    <NavButton icon={FiHome} label="Mesas" active={currentPage === "tables"} />
    <NavButton icon={FiList} label="Pedidos" badge={newOrdersCount} />
    <NavButton icon={FiUser} label="Perfil" />
  </HStack>
</Box>
```

### API Integration

```javascript
// services/api.js
import axios from "axios";

const api = axios.create({
  baseURL: process.env.APP_API_URL,
  headers: { "Content-Type": "application/json" },
});

// Interceptor para adicionar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("waiterToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Endpoints do garçom
export const waiterAPI = {
  // Autenticação
  login: (credentials) => api.post("/auth/login", credentials),

  // Mesas
  getMyTables: () => api.get("/tables/my-tables"),
  getTable: (id) => api.get(`/tables/${id}`),

  // Pedidos
  getTableOrder: (tableId) => api.get(`/tables/${tableId}/order`),
  updateItemStatus: (itemId, status) =>
    api.patch(`/order-items/${itemId}/status`, { status }),

  // Pagamento
  closeTable: (tableId, paymentData) =>
    api.post(`/tables/${tableId}/close`, paymentData),

  // Perfil
  getProfile: () => api.get("/auth/me"),
};
```

---

## 2. KITCHEN APP (Aplicativo da Cozinha)

### Estrutura de Diretórios

```
kitchen-app/
├── public/
├── src/
│   ├── components/
│   │   ├── OrderQueue.js
│   │   ├── OrderCard.js
│   │   ├── ItemCard.js
│   │   └── StatusFilter.js
│   ├── pages/
│   │   ├── Login.js
│   │   ├── OrdersBoard.js
│   │   └── ItemDetail.js
│   ├── services/
│   │   ├── api.js
│   │   └── socket.js
│   ├── contexts/
│   │   ├── AuthContext.js
│   │   └── SocketContext.js
│   ├── theme.js
│   ├── App.js
│   └── index.js
├── package.json
└── .env
```

### Funcionalidades Principais

#### 2.1 Quadro de Pedidos (Kanban)

```javascript
// pages/OrdersBoard.js
- Colunas: Pendente | Em Preparo | Pronto
- Drag & Drop para mover itens entre colunas
- Cards coloridos por categoria de produto
- Timer mostrando tempo desde o pedido
- Som de notificação para novos pedidos
```

#### 2.2 Fila de Pedidos

```javascript
// components/OrderQueue.js
- Lista ordenada por prioridade (tempo de espera)
- Destaque visual para pedidos urgentes (>15 min)
- Informações: Mesa, Item, Quantidade, Observações
- Botão rápido para iniciar preparo
```

#### 2.3 Notificações em Tempo Real

```javascript
// Eventos do socket:
- 'new_order_item' → Novo item para preparar
- 'item_cancelled' → Item cancelado
- 'order_updated' → Pedido modificado

// Notificação:
- Som característico de novo pedido
- Badge no contador de pedidos pendentes
- Card aparece com animação slide-in
```

### UI/UX Design

#### Layout Kanban

```jsx
<Grid
  templateColumns="repeat(3, 1fr)"
  gap={6}
  h="calc(100vh - 80px)"
  p={6}
  bg="gray.50"
>
  {/* Coluna PENDENTE */}
  <Box bg="white" borderRadius="xl" boxShadow="md" p={4} overflow="auto">
    <HStack mb={4} justify="space-between">
      <Heading size="md" color="orange.600">
        Pendente
      </Heading>
      <Badge colorScheme="orange" fontSize="md" px={3} py={1}>
        {pendingItems.length}
      </Badge>
    </HStack>

    <VStack spacing={3} align="stretch">
      {pendingItems.map((item) => (
        <OrderItemCard
          key={item._id}
          item={item}
          onStart={() => handleStartPreparation(item._id)}
        />
      ))}
    </VStack>
  </Box>

  {/* Coluna EM PREPARO */}
  <Box bg="white" borderRadius="xl" boxShadow="md" p={4} overflow="auto">
    <HStack mb={4} justify="space-between">
      <Heading size="md" color="blue.600">
        Em Preparo
      </Heading>
      <Badge colorScheme="blue" fontSize="md" px={3} py={1}>
        {preparingItems.length}
      </Badge>
    </HStack>

    <VStack spacing={3} align="stretch">
      {preparingItems.map((item) => (
        <OrderItemCard
          key={item._id}
          item={item}
          onComplete={() => handleMarkAsReady(item._id)}
          showTimer
        />
      ))}
    </VStack>
  </Box>

  {/* Coluna PRONTO */}
  <Box bg="white" borderRadius="xl" boxShadow="md" p={4} overflow="auto">
    <HStack mb={4} justify="space-between">
      <Heading size="md" color="green.600">
        Pronto
      </Heading>
      <Badge colorScheme="green" fontSize="md" px={3} py={1}>
        {readyItems.length}
      </Badge>
    </HStack>

    <VStack spacing={3} align="stretch">
      {readyItems.map((item) => (
        <OrderItemCard
          key={item._id}
          item={item}
          onDeliver={() => handleMarkAsDelivered(item._id)}
        />
      ))}
    </VStack>
  </Box>
</Grid>
```

#### OrderItemCard Component

```jsx
<Card
  bg={getColorByCategory(item.product.category)}
  borderLeft="4px solid"
  borderLeftColor={getStatusColor(item.status)}
  borderRadius="lg"
  p={4}
  boxShadow="sm"
  _hover={{ boxShadow: "md", transform: "translateY(-2px)" }}
  transition="all 0.2s"
>
  {/* Header */}
  <HStack justify="space-between" mb={3}>
    <Badge colorScheme="purple" fontSize="xs">
      Mesa {item.table.number}
    </Badge>
    {showTimer && <Timer startTime={item.createdAt} />}
  </HStack>

  {/* Produto */}
  <Heading size="sm" mb={2}>
    {item.quantity}x {item.product.name}
  </Heading>

  {/* Observações */}
  {item.notes && (
    <Text
      fontSize="sm"
      color="gray.600"
      bg="yellow.50"
      p={2}
      borderRadius="md"
      mb={3}
    >
      📝 {item.notes}
    </Text>
  )}

  {/* Botão de ação */}
  <Button
    w="full"
    size="sm"
    colorScheme={getActionButtonColor(item.status)}
    onClick={onActionClick}
    leftIcon={getActionIcon(item.status)}
  >
    {getActionLabel(item.status)}
  </Button>
</Card>
```

---

## 3. IMPLEMENTAÇÃO DO WEBSOCKET

### Servidor - Eventos para Garçom e Cozinha

```javascript
// server/config/socket.js
const socketIO = require("socket.io");

let io;

exports.initSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: [
        process.env.FRONTEND_URL,
        process.env.CUSTOMER_APP_URL,
        process.env.WAITER_APP_URL, // Novo
        process.env.KITCHEN_APP_URL, // Novo
      ],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Autenticação do socket
    const { token, userType } = socket.handshake.auth;

    // Join em rooms específicas
    if (userType === "waiter") {
      socket.join("waiters");
      console.log(`[Socket] Waiter joined: ${socket.id}`);
    } else if (userType === "kitchen") {
      socket.join("kitchen");
      console.log(`[Socket] Kitchen joined: ${socket.id}`);
    }

    socket.on("disconnect", () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

exports.emitBillRequested = (orderId, tableId, customer) => {
  if (io) {
    io.to("waiters").emit("bill_requested", {
      orderId,
      tableId,
      customer,
      timestamp: new Date(),
    });
    console.log(`[Socket] Bill requested emitted for table ${tableId}`);
  }
};

exports.emitNewOrder = (orderData) => {
  if (io) {
    // Notifica cozinha
    io.to("kitchen").emit("new_order_item", {
      item: orderData.item,
      table: orderData.tableId,
      timestamp: new Date(),
    });

    // Notifica garçom da mesa
    io.to("waiters").emit("order_updated", {
      orderId: orderData.orderId,
      tableId: orderData.tableId,
      action: "item_added",
    });

    console.log(`[Socket] New order emitted to kitchen`);
  }
};

exports.emitItemStatusChanged = (item, status) => {
  if (io) {
    // Notifica garçom
    io.to("waiters").emit("item_status_changed", {
      itemId: item._id,
      status,
      product: item.product,
      table: item.table,
    });

    // Notifica cozinha
    io.to("kitchen").emit("item_status_updated", {
      itemId: item._id,
      status,
    });
  }
};
```

### Cliente - Socket Context (Waiter App)

```javascript
// waiter-app/src/contexts/SocketContext.js
import React, { createContext, useContext, useEffect, useState } from "react";
import io from "socket.io-client";
import { useAuth } from "./AuthContext";
import { useToast } from "@chakra-ui/react";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [billRequests, setBillRequests] = useState([]);
  const { user, token } = useAuth();
  const toast = useToast();

  useEffect(() => {
    if (!token || !user) return;

    const newSocket = io(process.env.APP_API_URL, {
      auth: {
        token,
        userType: "waiter",
      },
    });

    // Evento: Cliente solicitou conta
    newSocket.on("bill_requested", (data) => {
      setBillRequests((prev) => [...prev, data]);

      // Notificação visual
      toast({
        title: "💳 Conta Solicitada!",
        description: `Mesa ${data.tableId.number} - ${data.customer.name}`,
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "top",
      });

      // Notificação sonora
      playNotificationSound();

      // Vibração (se disponível)
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
      }
    });

    // Evento: Status do item mudou
    newSocket.on("item_status_changed", (data) => {
      console.log("Item status changed:", data);
      // Atualizar UI
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, [token, user]);

  const removeBillRequest = (orderId) => {
    setBillRequests((prev) => prev.filter((req) => req.orderId !== orderId));
  };

  return (
    <SocketContext.Provider value={{ socket, billRequests, removeBillRequest }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);

// Helper para tocar som de notificação
const playNotificationSound = () => {
  const audio = new Audio("/sounds/notification.mp3");
  audio.play().catch((err) => console.log("Could not play sound:", err));
};
```

---

## 4. INSTALAÇÃO E CONFIGURAÇÃO

### Waiter App - package.json

```json
{
  "name": "marambaia-waiter-app",
  "version": "1.0.0",
  "dependencies": {
    "@chakra-ui/react": "^2.8.0",
    "@emotion/react": "^11.11.0",
    "@emotion/styled": "^11.11.0",
    "axios": "^1.6.0",
    "framer-motion": "^10.16.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-icons": "^4.11.0",
    "react-router-dom": "^6.18.0",
    "socket.io-client": "^4.6.0"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build"
  }
}
```

### Kitchen App - package.json

```json
{
  "name": "marambaia-kitchen-app",
  "version": "1.0.0",
  "dependencies": {
    "@chakra-ui/react": "^2.8.0",
    "@emotion/react": "^11.11.0",
    "@emotion/styled": "^11.11.0",
    "@dnd-kit/core": "^6.0.0",
    "@dnd-kit/sortable": "^7.0.0",
    "axios": "^1.6.0",
    "framer-motion": "^10.16.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-icons": "^4.11.0",
    "socket.io-client": "^4.6.0"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build"
  }
}
```

### Variáveis de Ambiente

**waiter-app/.env**

```
APP_API_URL=http://192.168.0.4:3001/api
PORT=3003
```

**kitchen-app/.env**

```
APP_API_URL=http://192.168.0.4:3001/api
PORT=3004
```

---

## 5. RESUMO DE FUNCIONALIDADES

### Waiter App ✅

- ✅ Login com autenticação JWT
- ✅ Visualizar mesas atribuídas
- ✅ Ver detalhes do pedido da mesa
- ✅ **Notificação em tempo real quando cliente solicita conta**
- ✅ Processar pagamento e fechar mesa
- ✅ UI/UX moderna e responsiva (mobile-first)
- ✅ Tema coastal com Chakra UI

### Kitchen App ✅

- ✅ Login para staff da cozinha
- ✅ Quadro Kanban (Pendente → Preparando → Pronto)
- ✅ **Notificação em tempo real de novos pedidos**
- ✅ Timer de tempo de preparo
- ✅ Atualização de status dos itens
- ✅ Som de notificação para novos pedidos
- ✅ UI/UX intuitiva e eficiente

---

## 6. NOVOS ENDPOINTS E EVENTOS WEBSOCKET

### Endpoints de API

#### Marcar Item como Entregue

```javascript
PUT /api/orders/items/:itemId/deliver
Authorization: Bearer <token>

// Funcionalidade:
// - Marca item como "delivered"
// - Atualiza deliveryTime com timestamp atual
// - Emite evento WebSocket para cliente e garçons
// - Validação: item precisa estar no status "ready"

// Resposta de sucesso:
{
  "success": true,
  "item": {
    "_id": "...",
    "status": "delivered",
    "deliveryTime": "2025-10-04T12:30:00.000Z"
  },
  "message": "Item marcado como entregue"
}

// Erro se item não está pronto:
{
  "success": false,
  "message": "Item precisa estar pronto antes de ser marcado como entregue"
}
```

### Eventos WebSocket Atualizados

#### Eventos para Cliente (Customer App)

```javascript
// 1. joinSpecificOrder - Cliente entra na sala de seu pedido
socket.emit("joinSpecificOrder", orderId);

// 2. leaveSpecificOrder - Cliente sai da sala
socket.emit("leaveSpecificOrder", orderId);

// 3. orderUpdate - Pedido foi atualizado
socket.on("orderUpdate", (data) => {
  console.log(data);
  // { orderId, status, timestamp }
});

// 4. itemStatusChanged - Status de item específico mudou
socket.on("itemStatusChanged", (data) => {
  console.log(data);
  // { orderId, itemId, status, timestamp }
  // status pode ser: 'preparing', 'ready', 'delivered'

  // Mostrar notificação para o cliente
  if (data.status === "ready") {
    showToast("Seu pedido está pronto!");
  } else if (data.status === "delivered") {
    showToast("Seu pedido foi entregue na mesa!");
  }
});
```

#### Eventos para Garçom (Waiter App)

```javascript
// 1. joinWaitersRoom - Garçom entra na sala
socket.emit("joinWaitersRoom");

// 2. itemStatusChanged - Notificação quando item fica pronto
socket.on("itemStatusChanged", (data) => {
  console.log(data);
  // { orderId, itemId, status, tableId, timestamp }

  // Mostrar badge na mesa quando item ficar pronto
  if (data.status === "ready") {
    showTableBadge(data.tableId, "Item pronto para entrega");
  }
});

// 3. newOrder - Novo pedido recebido (TODOS os itens)
socket.on("newOrder", (data) => {
  // { item, orderId, tableId, timestamp }
});
```

#### Eventos para Cozinha (Kitchen App) - ATUALIZADO

```javascript
// 1. joinKitchenRoom - Cozinha entra na sala
socket.emit("joinKitchenRoom");

// 2. newOrder - Novo pedido recebido (SOMENTE COMIDA)
socket.on("newOrder", (data) => {
  // { item, orderId, tableId, timestamp }

  // ⚠️ IMPORTANTE: Cozinha recebe APENAS itens com productType === 'food'
  // Bebidas vão direto para o garçom

  if (data.item.product.productType === "food") {
    console.log("Novo pedido de comida:", data.item.product.name);
    playNotificationSound();
  }
});
```

### Fluxo Completo de Status de Item

```
1. PENDING (pendente)
   └─> Cliente adiciona item ao pedido
   └─> Garçom recebe: todos os itens
   └─> Cozinha recebe: somente comida

2. PREPARING (em preparo)
   └─> Cozinha clica "Iniciar Preparo"
   └─> Cliente recebe notificação: "Seu item está sendo preparado"
   └─> preparationStartTime = agora

3. READY (pronto)
   └─> Cozinha clica "Marcar como Pronto"
   └─> Cliente recebe notificação: "Seu pedido está pronto!"
   └─> Garçom recebe notificação: "Mesa X - Item pronto para entrega"

4. DELIVERED (entregue)
   └─> Garçom clica "Marcar como Entregue"
   └─> PUT /api/orders/items/:itemId/deliver
   └─> Cliente recebe notificação: "Seu pedido foi entregue na mesa!"
   └─> deliveryTime = agora
```

### Diferenciais do Sistema

✅ **Separação Comida/Bebida**

- Cozinha recebe apenas pedidos de comida
- Garçom recebe TODOS os pedidos (comida + bebida)
- Garçom entrega tanto comida quanto bebida

✅ **WebSocket em Tempo Real**

- Cliente acompanha status do pedido em tempo real
- Notificações visuais (toast) quando item muda de status
- Garçom notificado quando item fica pronto

✅ **Controle de Entrega**

- Garçom marca item como "entregue"
- Cliente recebe confirmação visual
- Rastreamento completo via deliveryTime

---

## 7. PRÓXIMOS PASSOS

1. Criar userController.js ✅ (já feito)
2. Implementar WebSocket no customer app ✅ (já feito)
3. Criar endpoint de entrega ✅ (já feito)
4. Atualizar server .env com URLs dos novos apps
5. Reiniciar servidor para carregar mudanças
6. Criar apps usando `create-react-app`
7. Implementar componentes conforme documentação
8. Testar WebSocket em ambiente de desenvolvimento
9. Deploy em produção

---

Essa documentação fornece tudo que você precisa para implementar os apps de garçom e cozinha com notificações em tempo real e controle de entrega!
