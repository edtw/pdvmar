# Sistema de Segurança do QR Code - Marambaia PDV

## Visão Geral

O sistema de QR Code do Marambaia PDV foi projetado com múltiplas camadas de segurança para proteger os pedidos dos clientes e prevenir acessos não autorizados.

## Arquitetura de Segurança

### 1. QR Code Permanente

**Implementação:**
- Cada mesa possui um QR code único e permanente
- O QR code físico é colado na mesa e nunca precisa ser trocado
- O token do QR code (`qrToken`) é um UUID v4 único por mesa

**Benefícios:**
- ✅ QR codes físicos permanecem válidos indefinidamente
- ✅ Não há necessidade de reimprimir códigos
- ✅ Facilita a operação do restaurante

**Código:**
```javascript
// models/Table.js
qrToken: {
  type: String,
  unique: true,
  sparse: true,
  default: null
}
```

### 2. Proteção por CPF

**Camadas de Proteção:**

#### a) Criação de Comanda (createCommand)
```javascript
// Requisitos:
- Nome (obrigatório)
- CPF (obrigatório, 11 dígitos)
- Telefone (opcional)
- Email (opcional)

// Validações:
1. CPF é obrigatório
2. CPF deve ter 11 dígitos
3. Verificação de blacklist
4. Se mesa já está ocupada, verifica se CPF é o mesmo
```

#### b) Acesso ao Pedido (getOrder)
```javascript
// Middleware: verifyCpfForGetOrder
- CPF enviado via query parameter ou header
- Verifica se CPF corresponde ao customer do pedido
- Bloqueia acesso se CPF não corresponder
- Log de segurança em caso de tentativa não autorizada
```

#### c) Operações no Pedido (addItem, removeItem, requestBill)
```javascript
// Middleware: verifyCpfForOrder
- CPF enviado no corpo da requisição
- Validação completa do CPF
- Verificação de correspondência com o pedido
- Proteção contra modificações não autorizadas
```

### 3. Fluxo de Segurança Completo

```
1. Cliente escaneia QR Code da mesa
   ↓
2. Sistema verifica se mesa existe (qrToken válido)
   ↓
3. Cliente cria comanda fornecendo CPF
   ↓
4. Sistema verifica:
   - CPF válido (11 dígitos)
   - Cliente não está na blacklist
   - Mesa não está ocupada por outro CPF
   ↓
5. Comanda criada, CPF armazenado no sessionStorage
   ↓
6. Todas as operações subsequentes:
   - Enviam CPF automaticamente
   - Middleware verifica CPF antes de processar
   - Operação bloqueada se CPF não corresponder
```

## Cenários de Segurança

### Cenário 1: Cliente Retornando à Mesa
```
Cliente A escaneia QR code → Mesa já tem pedido do Cliente A
→ Sistema verifica CPF → Acesso permitido ✅
```

### Cenário 2: Tentativa de Acesso Não Autorizado
```
Cliente B escaneia QR code → Mesa tem pedido do Cliente A
→ Cliente B tenta criar comanda com seu CPF
→ Sistema detecta CPF diferente → Acesso negado ❌
Mensagem: "Esta mesa já está ocupada por outro cliente"
```

### Cenário 3: Tentativa de Modificar Pedido de Outro Cliente
```
Cliente B tenta adicionar item ao pedido do Cliente A
→ Middleware verifyCpfForOrder verifica CPF
→ CPF não corresponde → Operação bloqueada ❌
→ Log de segurança registrado
Mensagem: "CPF não autorizado para este pedido"
```

### Cenário 4: Mesa Livre
```
Mesa está livre (sem pedido ativo)
→ Qualquer cliente pode escanear QR code
→ Criar nova comanda com seu CPF
→ Mesa agora protegida pelo CPF deste cliente ✅
```

## Implementação Técnica

### Middleware de Verificação

**verifyCpfForOrder** (`/middlewares/verifyCpf.js`)
```javascript
exports.verifyCpfForOrder = async (req, res, next) => {
  // 1. Extrai CPF da requisição
  const { customerCpf } = req.body;

  // 2. Valida CPF
  const cpfClean = customerCpf.replace(/\D/g, '');
  if (cpfClean.length !== 11) return error;

  // 3. Busca pedido e cliente
  const order = await Order.findById(orderId).populate('customer');

  // 4. CRITICAL SECURITY: Verifica correspondência
  if (order.customer.cpf !== cpfClean) {
    console.warn(`[SECURITY] CPF mismatch attempt`);
    return res.status(403).json({ cpfMismatch: true });
  }

  // 5. CPF válido - permite operação
  next();
};
```

### Frontend: Armazenamento Seguro do CPF

**SessionStorage** (não localStorage)
```javascript
// Armazenamento quando comanda é criada
sessionStorage.setItem('customerCpf', cpfClean);

// Recuperação automática para todas as requisições
const getCustomerCpf = () => {
  return sessionStorage.getItem('customerCpf') || null;
};

// Benefícios:
- Dados apagados quando aba do navegador é fechada
- Não persiste entre sessões
- Mais seguro que localStorage
```

## Proteções Adicionais

### 1. Blacklist de Clientes
```javascript
// Verifica blacklist ao criar comanda
if (customer.isBlacklisted()) {
  return res.status(403).json({
    message: 'Acesso negado. Entre em contato com o gerente.',
    blacklisted: true
  });
}
```

### 2. Proteção de Itens em Preparo
```javascript
// Não permite remover itens já em preparo
if (item.status !== 'pending') {
  return res.status(400).json({
    message: 'Item já está em preparo e não pode ser removido'
  });
}
```

### 3. Logs de Segurança
```javascript
// Log de tentativas de acesso não autorizado
console.warn(`[SECURITY] CPF mismatch attempt for order ${orderId}.
  Provided: ${cpfClean}, Expected: ${order.customer?.cpf}`);
```

## Boas Práticas

### ✅ O que FAZER:
1. Sempre validar CPF antes de qualquer operação
2. Usar middleware de verificação em todas as rotas protegidas
3. Armazenar CPF no sessionStorage (não localStorage)
4. Registrar logs de tentativas de acesso não autorizado
5. Limpar sessionStorage quando cliente solicita conta

### ❌ O que NÃO fazer:
1. ❌ Regenerar QR token ao fechar mesa (invalida QR físico)
2. ❌ Permitir operações sem verificação de CPF
3. ❌ Armazenar CPF em localStorage (persiste demais)
4. ❌ Expor informações sensíveis nos logs
5. ❌ Permitir acesso a pedidos de outros clientes

## Testes de Segurança

### Teste 1: Acesso Não Autorizado
```bash
# Tentativa de adicionar item com CPF errado
curl -X POST http://localhost:3001/api/public/orders/{orderId}/items \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "xxx",
    "quantity": 1,
    "customerCpf": "99999999999"  # CPF errado
  }'

# Esperado: 403 Forbidden
# Mensagem: "CPF não autorizado para este pedido"
```

### Teste 2: CPF Correto
```bash
# Adicionar item com CPF correto
curl -X POST http://localhost:3001/api/public/orders/{orderId}/items \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "xxx",
    "quantity": 1,
    "customerCpf": "12345678901"  # CPF do cliente
  }'

# Esperado: 201 Created
# Item adicionado com sucesso
```

## Resumo de Segurança

| Aspecto | Implementação | Status |
|---------|---------------|--------|
| QR Code Permanente | UUID único por mesa | ✅ Implementado |
| Proteção por CPF | Middleware em todas as operações | ✅ Implementado |
| Blacklist | Verificação ao criar comanda | ✅ Implementado |
| Logs de Segurança | Registro de tentativas não autorizadas | ✅ Implementado |
| SessionStorage | CPF armazenado temporariamente | ✅ Implementado |
| Validação de CPF | 11 dígitos obrigatório | ✅ Implementado |
| Verificação de Mesa | Bloqueio se ocupada por outro CPF | ✅ Implementado |

## Conclusão

O sistema de QR Code do Marambaia PDV implementa múltiplas camadas de segurança:

1. **QR Code Permanente**: Cada mesa tem um código único e imutável
2. **Autenticação por CPF**: Todas as operações verificam o CPF do cliente
3. **Middleware de Verificação**: Bloqueia acesso não autorizado
4. **Logs de Segurança**: Rastreiam tentativas suspeitas
5. **Proteção de Mesa**: Impede que outros clientes acessem pedidos ativos

Este sistema garante que apenas o cliente que criou o pedido possa visualizá-lo e modificá-lo, enquanto mantém a conveniência de QR codes físicos permanentes nas mesas.
