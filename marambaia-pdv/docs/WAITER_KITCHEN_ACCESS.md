# Guia de Acesso - Garçom e Cozinha

## 🔐 Sistema de Acesso por Função

Este documento descreve como acessar as interfaces específicas para **Garçons** e **Cozinha** no sistema PDV Marambaia.

---

## 📱 Vista do Garçom

### Como Acessar
**URL**: `http://localhost:3000/waiter` (ou IP da rede: `http://192.168.0.4:3000/waiter`)

### Requisitos de Acesso
- **Função necessária**: `waiter` (garçom)
- **Autenticação**: Sim (login obrigatório)

### Funcionalidades

#### 1. **Visualização de Mesas**
- Lista todas as mesas atribuídas ao garçom logado
- Cards com informações em tempo real:
  - Número da mesa
  - Status (Livre, Ocupada, Aguardando Pagamento)
  - Nome do cliente
  - Quantidade de itens no pedido
  - Valor total da conta
  - Badge quando há itens prontos

#### 2. **Notificações em Tempo Real**
O garçom recebe notificações automáticas para:
- 🔔 **Novo Pedido**: Quando cliente adiciona item ao pedido
- ✅ **Item Pronto**: Quando cozinha marca item como pronto
- 💳 **Conta Solicitada**: Quando cliente solicita a conta

#### 3. **Detalhes do Pedido**
Ao clicar em uma mesa, abre modal com:
- Informações do cliente (nome e CPF)
- Lista completa de itens do pedido
- Status de cada item (Pendente, Preparando, Pronto, Entregue)
- Observações especiais de cada item
- Valor total da conta

#### 4. **Marcar Item como Entregue**
- Botão "Entregar" aparece quando item está pronto
- Atualiza status do item para "Entregue"
- Notifica o cliente via app do cliente

### Layout
- **Mobile-First**: Otimizado para smartphones e tablets
- **Sem Sidebar**: Tela limpa, sem menu lateral
- **Cards Grandes**: Fácil toque em telas touchscreen
- **Cores**: Gradiente azul ciano (`#0891B2` → `#06B6D4`)

---

## 🍳 Vista da Cozinha

### Como Acessar
**URL**: `http://localhost:3000/kitchen` (ou IP da rede: `http://192.168.0.4:3000/kitchen`)

### Requisitos de Acesso
- **Funções permitidas**: `admin`, `manager`, `kitchen`
- **Autenticação**: Sim (login obrigatório)

### Funcionalidades

#### 1. **Quadro Kanban de Pedidos**
A cozinha visualiza pedidos em 3 colunas:

**🕐 Pendentes**
- Novos pedidos de **comida** aguardando preparo
- Badge laranja com contador
- Botão "Iniciar Preparo" (azul)

**🔵 Em Preparo**
- Itens sendo preparados atualmente
- Badge azul com contador
- Botão "Marcar Pronto" (verde)

**✅ Prontos**
- Itens prontos aguardando garçom
- Badge verde com contador
- Timer mostrando tempo desde que ficou pronto
- Texto "Aguardando garçom"

#### 2. **Filtro Automático**
- **APENAS COMIDA**: Bebidas NÃO aparecem na cozinha
- Sistema identifica automaticamente pelo campo `productType`
- Bebidas vão direto para o garçom

#### 3. **Notificações em Tempo Real**
- 🍽️ **Novo Pedido de Comida**: Som + toast notification
- **Som de Notificação**: `/sounds/notification.mp3` (se disponível)
- **Toast Visual**: Banner no topo da tela

#### 4. **Informações em Cada Card**
- **Mesa**: Número da mesa
- **Cliente**: Nome do cliente
- **Produto**: Nome e quantidade (ex: "2x Moqueca de Peixe")
- **Observações**: Detalhes especiais (ex: "Sem camarão", "Bem passado")
- **Status**: Badge colorido com status atual
- **Timer**: Tempo decorrido desde início do preparo (apenas em "Prontos")

#### 5. **Fluxo de Trabalho**
```
Pendente → [Iniciar Preparo] → Em Preparo → [Marcar Pronto] → Pronto → [Garçom Entrega]
```

### Layout
- **Mobile-First**: Funciona em tablets e smartphones
- **Kanban Responsivo**: 1 coluna em mobile, 3 em desktop
- **Cards Grandes**: Fácil leitura e toque
- **Cores**: Gradiente laranja-vermelho (`#F59E0B` → `#EF4444`)

---

## 🌐 Acessando pela Rede Local

### Em Computadores e Tablets
1. Descobrir IP do servidor (ex: `192.168.0.4`)
2. Acessar:
   - Garçom: `http://192.168.0.4:3000/waiter`
   - Cozinha: `http://192.168.0.4:3000/kitchen`

### Em Smartphones
1. Conectar no mesmo Wi-Fi
2. Acessar URL completa com IP da rede
3. Fazer login com credenciais de garçom/cozinha

### Dica: Adicionar à Tela Inicial
**No iOS (Safari)**:
1. Abrir URL no Safari
2. Tocar em "Compartilhar"
3. Tocar em "Adicionar à Tela de Início"
4. Agora acessa como app nativo

**No Android (Chrome)**:
1. Abrir URL no Chrome
2. Menu (⋮) → "Adicionar à tela inicial"
3. Ícone criado na tela inicial

---

## 👥 Criando Usuários

### Criar Usuário Garçom
```javascript
// No MongoDB ou via seed
{
  name: "João Silva",
  email: "joao@marambaia.com",
  password: "senha123", // Hash será gerado
  role: "waiter",
  active: true
}
```

### Criar Usuário Cozinha
```javascript
{
  name: "Cozinha Principal",
  email: "cozinha@marambaia.com",
  password: "senha123",
  role: "kitchen",
  active: true
}
```

### Via Interface PDV (Admin/Manager)
1. Login como admin/manager
2. Ir em "Usuários"
3. Clicar em "Novo Usuário"
4. Preencher dados e selecionar função:
   - `waiter` para garçons
   - `kitchen` para cozinha
5. Salvar

---

## 🔄 WebSocket e Tempo Real

### Como Funciona
- **Socket.io**: Conexão bidirecional automática
- **Reconexão**: Automática se conexão cair
- **Salas (Rooms)**:
  - `waiters`: Todos os garçons
  - `kitchen`: Todos da cozinha
  - `order_<ID>`: Pedido específico do cliente

### Eventos em Tempo Real

#### Garçom Recebe:
- `newOrder`: Novo item adicionado
- `itemStatusChanged`: Status de item mudou
- `billRequested`: Cliente solicitou conta

#### Cozinha Recebe:
- `newOrder`: Novo pedido de **comida** apenas
- `orderStatusChanged`: Status do pedido mudou

---

## 🎨 Diferenças Visuais

| Aspecto | Garçom | Cozinha |
|---------|--------|---------|
| **Cor Principal** | Azul Ciano | Laranja-Vermelho |
| **Layout** | Cards em Grid | Kanban (3 Colunas) |
| **Filtro** | Mesas do garçom | Apenas comida |
| **Ação Principal** | Entregar item | Mudar status |
| **Timer** | Não | Sim (itens prontos) |

---

## 🐛 Solução de Problemas

### "Nenhuma mesa atribuída" (Garçom)
- Verifique se há mesas com `waiter` definido
- Admin/Manager deve atribuir mesas na interface PDV
- Atualizar página (botão de refresh)

### "Nenhum pedido pendente" (Cozinha)
- Pode ser que não há pedidos de comida ativos
- Bebidas NÃO aparecem na cozinha
- Verificar se `productType` está definido corretamente

### Notificações não aparecem
- Verificar se WebSocket conectou (console do navegador)
- CORS pode estar bloqueando (ver console)
- Verificar IP correto no arquivo `/server/config/socket.js`

### CORS Error
Editar `/server/config/socket.js`:
```javascript
cors: {
  origin: [
    "http://localhost:3000",
    "http://SEU_IP:3000",  // Adicionar seu IP
    "http://localhost:3002",
    "http://SEU_IP:3002"
  ].filter(Boolean)
}
```

---

## 📊 Fluxo Completo do Pedido

1. **Cliente** (App Cliente): Escaneia QR Code, adiciona item
2. **Sistema**: Verifica `productType` do produto
3. **Se COMIDA**:
   - Notifica **Cozinha** (aparece em "Pendentes")
   - Notifica **Garçom** (aparece no pedido da mesa)
4. **Se BEBIDA**:
   - Notifica apenas **Garçom** (pronto para entregar)
5. **Cozinha**: Inicia preparo → Marca pronto
6. **Garçom**: Recebe notificação "Item Pronto" → Entrega → Marca entregue
7. **Cliente**: Vê status atualizar em tempo real no app

---

## 🔐 Segurança

- **JWT Authentication**: Token obrigatório em todas as rotas
- **Role-Based Access**: Cada rota verifica permissões
- **Token Armazenado**: `localStorage` do navegador
- **Expiração**: Token expira após X horas (configurável)
- **Logout**: Remove token do localStorage

---

## 💡 Dicas de Uso

### Para Garçons
- Mantenha a tela aberta durante expediente
- Ative som/notificações do navegador
- Verifique periodicamente badge de "itens prontos"
- Marque como entregue assim que entregar

### Para Cozinha
- Organize preparo da esquerda para direita (Kanban)
- Timer em "Prontos" mostra tempo de espera
- Som toca quando novo pedido chega
- Observações aparecem em amarelo (importantes!)

---

**Versão**: 1.0.0
**Data**: Janeiro 2025
**Sistema**: Marambaia PDV - Beach Restaurant Management
