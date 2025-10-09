# Guia de Conexão Mobile - Marambaia PDV

## 🔧 Solução de Problemas de Conexão

### ✅ Checklist Rápido

1. **Celular e servidor na mesma rede Wi-Fi?**
2. **IP correto configurado?**
3. **Portas abertas no firewall?**
4. **Servidores rodando?**

---

## 📱 Configuração para Acesso Mobile

### 1️⃣ Descobrir o IP da Máquina do Servidor

**No Mac/Linux:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**No Windows:**
```bash
ipconfig
```

Exemplo de resultado: `192.168.0.4`

---

### 2️⃣ Configurar Variáveis de Ambiente

#### **Servidor** (`/server/.env`)
```env
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb+srv://...
FRONTEND_URL=http://192.168.0.4:3000
CUSTOMER_APP_URL=http://192.168.0.4:3002
```

#### **Client PDV** (`/client/.env`)
```env
REACT_APP_API_URL=http://192.168.0.4:3001/api
REACT_APP_SOCKET_URL=http://192.168.0.4:3001
HOST=0.0.0.0
PORT=3000
```

#### **Customer App** (`/customer-app/.env`)
```env
REACT_APP_API_URL=http://192.168.0.4:3001/api
REACT_APP_SOCKET_URL=http://192.168.0.4:3001
HOST=0.0.0.0
PORT=3002
```

**IMPORTANTE**: Substitua `192.168.0.4` pelo IP real da sua máquina!

---

### 3️⃣ Configurar Firewall (macOS)

#### **Verificar se firewall está bloqueando:**
```bash
# Ver status do firewall
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate

# Listar aplicações bloqueadas
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --listapps
```

#### **Permitir Node.js:**
```bash
# Adicionar exceção para Node.js
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/local/bin/node

# OU desabilitar temporariamente (NÃO RECOMENDADO EM PRODUÇÃO)
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate off
```

#### **Alternativa: Configurar via Interface Gráfica**
1. Preferências do Sistema → Segurança e Privacidade
2. Aba "Firewall"
3. Clicar no cadeado para desbloquear
4. Clicar em "Opções do Firewall"
5. Adicionar "node" e marcar "Permitir conexões de entrada"

---

### 4️⃣ Iniciar Todos os Servidores

**Método 1: Manualmente**
```bash
# Terminal 1: Servidor Backend
cd server
npm start

# Terminal 2: Cliente PDV
cd client
npm start

# Terminal 3: App do Cliente
cd customer-app
npm start
```

**Método 2: Script Automático** (se disponível)
```bash
# Na raiz do projeto
./start-all.sh
```

---

### 5️⃣ Verificar se Servidores Estão Rodando

```bash
# Verificar portas abertas
lsof -i :3001   # Backend
lsof -i :3000   # Client PDV
lsof -i :3002   # Customer App
```

Deve mostrar algo como:
```
node    21764  eto   13u  IPv6 0x...  TCP *:3001 (LISTEN)
```

O `*:3001` significa que está escutando em TODAS as interfaces (0.0.0.0), aceitando conexões externas.

---

## 🌐 URLs de Acesso

### **No Computador (localhost)**
- Backend: `http://localhost:3001`
- PDV Admin: `http://localhost:3000`
- App Cliente: `http://localhost:3002`
- Garçom: `http://localhost:3000/waiter`
- Cozinha: `http://localhost:3000/kitchen`

### **No Celular (mesma rede Wi-Fi)**
Substitua `192.168.0.4` pelo IP da sua máquina:

- Backend: `http://192.168.0.4:3001`
- PDV Admin: `http://192.168.0.4:3000`
- App Cliente: `http://192.168.0.4:3002`
- Garçom: `http://192.168.0.4:3000/waiter`
- Cozinha: `http://192.168.0.4:3000/kitchen`

---

## 🐛 Erros Comuns e Soluções

### ❌ Erro: "ERR_CONNECTION_REFUSED"

**Causa**: Servidor não está rodando ou IP errado

**Solução**:
1. Verificar se servidor está rodando: `lsof -i :3001`
2. Verificar IP da máquina: `ifconfig | grep "inet "`
3. Testar no navegador do computador primeiro

---

### ❌ Erro: "ERR_CONNECTION_TIMED_OUT"

**Causa**: Firewall bloqueando ou não estão na mesma rede

**Solução**:
1. Verificar se celular e servidor estão no mesmo Wi-Fi
2. Desabilitar VPN (se estiver usando)
3. Permitir Node.js no firewall (ver seção 3️⃣)
4. Testar ping do celular para o servidor:
   - Instalar app "Network Analyzer" ou similar
   - Fazer ping para o IP do servidor

---

### ❌ Erro: "CORS Policy Blocked"

**Causa**: IP não está na lista de origens permitidas

**Solução**:
Editar `/server/config/socket.js` e adicionar o IP:
```javascript
cors: {
  origin: [
    "http://localhost:3000",
    "http://192.168.0.4:3000",
    "http://localhost:3002",
    "http://192.168.0.4:3002",
    "http://SEU_IP:3000",     // Adicionar aqui
    "http://SEU_IP:3002",     // Adicionar aqui
    process.env.FRONTEND_URL,
    process.env.CUSTOMER_APP_URL
  ].filter(Boolean)
}
```

E também em `/server/config/index.js`:
```javascript
const whitelist = [
  process.env.FRONTEND_URL || "http://localhost:3000",
  process.env.CUSTOMER_APP_URL || "http://localhost:3002",
  "http://192.168.0.4:3000",
  "http://192.168.0.4:3002",
  "http://SEU_IP:3000",    // Adicionar aqui
  "http://SEU_IP:3002",    // Adicionar aqui
];
```

**IMPORTANTE**: Após editar, reiniciar o servidor!

---

### ❌ Erro: "WebSocket connection failed"

**Causa**: Socket.io não consegue conectar

**Solução**:
1. Verificar se `REACT_APP_SOCKET_URL` está correto no `.env`
2. Verificar console do navegador para detalhes
3. Testar endpoint do socket: `http://192.168.0.4:3001/socket.io/`
   - Deve retornar: `{"code":0,"message":"Transport unknown"}`
   - Se der erro 404, servidor não está rodando

---

### ❌ App não carrega no celular (tela branca)

**Causa**: React app não está configurado para aceitar conexões externas

**Solução**:
Verificar se `.env` tem `HOST=0.0.0.0`:
```env
HOST=0.0.0.0
PORT=3000
```

**Reiniciar o servidor React** após adicionar!

---

### ❌ Erro: "Cannot GET /"

**Causa**: Tentando acessar rota que não existe

**Solução**:
- Para PDV: `http://192.168.0.4:3000/` (redireciona para /dashboard)
- Para Customer: `http://192.168.0.4:3002/` (redireciona para /qr-scan)
- Para Garçom: `http://192.168.0.4:3000/waiter`
- Para Cozinha: `http://192.168.0.4:3000/kitchen`

---

## 📲 Testar Conexão

### Teste 1: Backend Funcionando
No navegador do **celular**, acessar:
```
http://192.168.0.4:3001/api
```

Deve retornar JSON:
```json
{
  "message": "API PDV Marambaia Beach funcionando!",
  "version": "1.0.0",
  "environment": "development"
}
```

### Teste 2: WebSocket Funcionando
No navegador do **celular**, acessar:
```
http://192.168.0.4:3001/socket.io/
```

Deve retornar (ou erro específico do Socket.io):
```json
{"code":0,"message":"Transport unknown"}
```

### Teste 3: Client Carregando
No navegador do **celular**, acessar:
```
http://192.168.0.4:3000
```

Deve carregar a tela de login do PDV.

### Teste 4: Customer App Carregando
No navegador do **celular**, acessar:
```
http://192.168.0.4:3002
```

Deve carregar a tela de escaneamento de QR Code.

---

## 🔐 Rede Corporativa ou Universidade

Se estiver em rede corporativa/universidade com restrições:

### Solução 1: Usar Hotspot
1. Ativar hotspot no celular
2. Conectar o computador no hotspot do celular
3. Descobrir novo IP: `ifconfig | grep "inet "`
4. Atualizar `.env` com novo IP
5. Reiniciar servidores

### Solução 2: Usar Ngrok (Túnel)
```bash
# Instalar ngrok
brew install ngrok

# Criar túnel para o backend
ngrok http 3001

# Ngrok vai gerar uma URL pública tipo:
# https://abc123.ngrok.io

# Atualizar .env com URL do ngrok:
REACT_APP_API_URL=https://abc123.ngrok.io/api
REACT_APP_SOCKET_URL=https://abc123.ngrok.io
```

---

## 🎯 Adicionar App à Tela Inicial (PWA)

### **iOS (Safari)**
1. Acessar URL no Safari
2. Tocar no botão "Compartilhar" (quadrado com seta)
3. Rolar para baixo e tocar em "Adicionar à Tela de Início"
4. Dar um nome (ex: "Marambaia - Cliente")
5. Tocar em "Adicionar"

Agora aparece como um app na tela inicial!

### **Android (Chrome)**
1. Acessar URL no Chrome
2. Tocar no menu (⋮)
3. Tocar em "Adicionar à tela inicial"
4. Dar um nome
5. Tocar em "Adicionar"

---

## 📊 Monitorar Conexões

### Ver logs em tempo real:
```bash
# Backend
cd server
npm start | grep -E "(Socket|CORS|Error)"

# Ver conexões Socket.io ativas
# (adicionar no código do servidor)
io.on('connection', (socket) => {
  console.log(`[Socket] Cliente conectado: ${socket.id} | IP: ${socket.handshake.address}`);
});
```

---

## 🔄 Reiniciar Tudo (Reset Completo)

Se nada funcionar, fazer reset completo:

```bash
# 1. Parar todos os servidores
# Ctrl+C em cada terminal ou:
killall node

# 2. Limpar cache do React
cd client && rm -rf node_modules/.cache
cd ../customer-app && rm -rf node_modules/.cache

# 3. Reiniciar
cd ../server && npm start &
cd ../client && npm start &
cd ../customer-app && npm start &
```

---

## ✅ Checklist Final

Antes de testar no celular:

- [ ] IP da máquina correto (ex: `192.168.0.4`)
- [ ] Celular e servidor na MESMA rede Wi-Fi
- [ ] `.env` do servidor atualizado com IP
- [ ] `.env` do client atualizado com IP
- [ ] `.env` do customer-app atualizado com IP
- [ ] `HOST=0.0.0.0` em ambos os `.env` dos apps React
- [ ] Firewall permite Node.js (ou desabilitado)
- [ ] Servidor backend rodando (`lsof -i :3001`)
- [ ] Client PDV rodando (`lsof -i :3000`)
- [ ] Customer app rodando (`lsof -i :3002`)
- [ ] Teste 1: Backend responde no celular
- [ ] Teste 2: Socket.io responde no celular
- [ ] Teste 3: Client carrega no celular
- [ ] Teste 4: Customer app carrega no celular

---

## 🆘 Suporte

Se ainda não funcionar:

1. Abrir console do navegador (Chrome DevTools)
2. Ir na aba "Network"
3. Recarregar página
4. Ver qual request falha
5. Copiar mensagem de erro completa
6. Verificar logs do servidor no terminal

**Dica**: Erros vermelhos são os mais importantes!

---

**Última atualização**: Janeiro 2025
**Sistema**: Marambaia PDV Beach Restaurant
