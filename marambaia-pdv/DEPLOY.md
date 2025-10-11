# Guia de Deploy Gratuito - PDV Marambaia

Este guia mostra como fazer deploy do sistema PDV Marambaia de forma **100% gratuita** usando serviços cloud.

## Arquitetura

- **Backend (API)**: Render.com (Free Tier)
- **Frontend Admin**: Vercel (Free Tier)
- **Frontend Cliente**: Vercel (Free Tier)
- **Banco de Dados**: MongoDB Atlas (Free Tier)

---

## Passo 1: Configurar MongoDB Atlas

1. Acesse [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Crie uma conta gratuita (se ainda não tiver)
3. Crie um novo cluster (selecione o tier **FREE**)
4. Configure o usuário do banco de dados:
   - Vá em "Database Access" → "Add New Database User"
   - Crie um usuário e senha (guarde essas credenciais!)
5. Configure o acesso de rede:
   - Vá em "Network Access" → "Add IP Address"
   - Selecione "Allow Access from Anywhere" (0.0.0.0/0) para ambientes de produção
6. Obtenha a string de conexão:
   - Clique em "Connect" → "Connect your application"
   - Copie a connection string (exemplo: `mongodb+srv://usuario:senha@cluster.mongodb.net/`)

---

## Passo 2: Deploy do Backend no Render

1. Acesse [Render.com](https://render.com) e crie uma conta gratuita
2. Conecte seu repositório GitHub ao Render
3. Clique em "New +" → "Web Service"
4. Selecione seu repositório
5. Configure o serviço:

   - **Name**: `marambaia-pdv-api` (ou o nome que preferir)
   - **Region**: Oregon (ou mais próxima)
   - **Branch**: `main`
   - **Root Directory**: `marambaia-pdv/server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free`

6. Configure as **Environment Variables**:

   ```
   NODE_ENV=production
   PORT=3001
   MONGODB_URI=sua_connection_string_do_mongodb_atlas
   JWT_SECRET=gere_uma_chave_segura_aqui
   CPF_ENCRYPTION_KEY=gere_outra_chave_segura_aqui
   FRONTEND_URL=https://seu-app-admin.vercel.app
   CUSTOMER_APP_URL=https://seu-app-cliente.vercel.app
   ```

   **Dica para gerar chaves seguras**:

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

7. Clique em "Create Web Service"
8. Aguarde o build e deploy (pode levar alguns minutos)
9. **Copie a URL do seu backend** (exemplo: `https://marambaia-pdv-api.onrender.com`)

---

## Passo 3: Deploy do Frontend Admin no Vercel

1. Acesse [Vercel.com](https://vercel.com) e crie uma conta gratuita
2. Instale a CLI do Vercel (opcional):
   ```bash
   npm install -g vercel
   ```

### Método 1: Via Interface Web

1. No dashboard da Vercel, clique em "Add New" → "Project"
2. Importe seu repositório GitHub
3. Configure o projeto:

   - **Framework Preset**: Create React App
   - **Root Directory**: `marambaia-pdv/client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`

4. Configure as **Environment Variables**:

   ```
   REACT_APP_API_URL=https://marambaia-pdv-api.onrender.com/api
   REACT_APP_SOCKET_URL=https://marambaia-pdv-api.onrender.com
   ```

   (Use a URL do backend que você copiou no Passo 2)

5. Clique em "Deploy"

### Método 2: Via CLI

```bash
cd marambaia-pdv/client
vercel
```

Siga as instruções e configure as variáveis de ambiente quando solicitado.

---

## Passo 4: Deploy do Frontend Cliente no Vercel

Repita o processo do Passo 3, mas agora para o **customer-app**:

1. Crie um novo projeto na Vercel
2. Configure:

   - **Root Directory**: `marambaia-pdv/customer-app`
   - **Framework Preset**: Create React App
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`

3. Configure as **Environment Variables**:

   ```
   REACT_APP_API_URL=https://marambaia-pdv-api.onrender.com/api
   REACT_APP_SOCKET_URL=https://marambaia-pdv-api.onrender.com
   ```

4. Faça o deploy

---

## Passo 5: Atualizar URLs no Backend

Depois que os frontends estiverem no ar:

1. Copie as URLs dos dois frontends (exemplo: `https://seu-app.vercel.app`)
2. Volte ao **Render.com** → seu serviço do backend
3. Vá em "Environment" e atualize:
   ```
   FRONTEND_URL=https://seu-app-admin.vercel.app
   CUSTOMER_APP_URL=https://seu-app-cliente.vercel.app
   ```
4. Salve as mudanças (o Render vai fazer redeploy automaticamente)

---

## Passo 6: Testar a Aplicação

1. Acesse o **Frontend Admin**: `https://seu-app-admin.vercel.app`
2. Acesse o **Frontend Cliente**: `https://seu-app-cliente.vercel.app`
3. Teste o login e funcionalidades principais

---

## Limitações do Plano Gratuito

### Render.com (Backend)

- **750 horas/mês** de execução (suficiente para 1 app rodando 24/7)
- **Sleep após inatividade**: O serviço "dorme" após 15 minutos sem requisições e leva ~30 segundos para "acordar"
- **512 MB de RAM**
- **Bandwidth**: Razoável para aplicações pequenas/médias

### Vercel (Frontends)

- **100 GB de bandwidth/mês**
- **100 deployments/dia**
- Sem limitação de sleep (sempre online)

### MongoDB Atlas

- **512 MB de armazenamento**
- Suficiente para milhares de registros
- **Conexões limitadas**, mas adequado para aplicações pequenas

---

## Alternativas Gratuitas

### Para o Backend:

- **Railway**: Similar ao Render, com 500 horas/mês grátis
- **Fly.io**: Opção alternativa com tier gratuito

### Para os Frontends:

- **Netlify**: Alternativa ao Vercel, também gratuito
- **GitHub Pages**: Para sites estáticos simples

---

## Troubleshooting

### Backend não conecta ao MongoDB

- Verifique se a string de conexão está correta
- Confirme que o IP 0.0.0.0/0 está permitido no MongoDB Atlas

### Frontend não conecta ao Backend

- Verifique se as variáveis `REACT_APP_API_URL` e `REACT_APP_SOCKET_URL` estão corretas
- Confirme que o CORS está configurado corretamente no backend

### Backend "dorme" muito (Render Free Tier)

- Isso é esperado no plano gratuito
- Considere fazer um "ping" periódico ou upgrade para plano pago (~$7/mês)

### Socket.io não funciona

- Verifique se as URLs do Socket.io estão corretas (sem `/api` no final)
- Confirme que o CORS está permitindo a origem dos frontends

---

## Comandos Úteis

### Gerar chaves de segurança:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Testar API localmente:

```bash
cd server
npm install
npm start
```

### Testar frontend localmente:

```bash
cd client  # ou customer-app
npm install
npm start
```

---

## Próximos Passos

1. Configure um domínio customizado (opcional)
2. Adicione monitoramento (Uptime Robot, etc.)
3. Configure backups automáticos do MongoDB
4. Implemente CI/CD com GitHub Actions

---

## Suporte

Em caso de dúvidas:

- Documentação Render: https://render.com/docs
- Documentação Vercel: https://vercel.com/docs
- Documentação MongoDB Atlas: https://docs.atlas.mongodb.com/

---

Feito com ❤️ para o Marambaia PDV
