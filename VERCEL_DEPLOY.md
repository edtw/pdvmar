# Como fazer deploy no Vercel - Guia Rápido

## Problema Comum

Se você importou o repositório inteiro no Vercel, ele não vai funcionar porque você tem múltiplas aplicações no mesmo repo.

## Solução: 2 Projetos Separados

Você precisa criar **2 projetos** no Vercel, cada um apontando para uma pasta diferente:

---

## 1. Frontend Admin (marambaia-pdv/client)

### Via Interface Web:

1. Acesse [vercel.com/new](https://vercel.com/new)
2. Selecione seu repositório `pdvmar`
3. Configure:

```
Project Name: marambaia-pdv-admin (ou o nome que preferir)
Framework Preset: Create React App
Root Directory: marambaia-pdv/client ← IMPORTANTE!
Build Command: npm run build
Output Directory: build
```

4. Adicione as Environment Variables:

```
REACT_APP_API_URL = https://sua-api.onrender.com/api
REACT_APP_SOCKET_URL = https://sua-api.onrender.com
```

5. Clique em "Deploy"

---

## 2. Frontend Cliente (marambaia-pdv/customer-app)

1. Volte ao dashboard da Vercel
2. Clique em "Add New" → "Project"
3. Selecione o **mesmo repositório** `pdvmar` novamente
4. Configure:

```
Project Name: marambaia-pdv-customer (ou o nome que preferir)
Framework Preset: Create React App
Root Directory: marambaia-pdv/customer-app ← IMPORTANTE!
Build Command: npm run build
Output Directory: build
```

5. Adicione as Environment Variables:

```
REACT_APP_API_URL = https://sua-api.onrender.com/api
REACT_APP_SOCKET_URL = https://sua-api.onrender.com
```

6. Clique em "Deploy"

---

## Alternativamente: Via CLI

Se preferir usar a linha de comando:

### Frontend Admin:

```bash
cd marambaia-pdv/client
vercel --prod
```

Quando o Vercel perguntar:

- Set up and deploy? **Yes**
- Which scope? (escolha seu usuário)
- Link to existing project? **No**
- Project name? `marambaia-pdv-admin`
- In which directory is your code located? `.` (ponto)
- Override settings? **Yes**
  - Build Command: `npm run build`
  - Output Directory: `build`
  - Development Command: `npm start`

### Frontend Cliente:

```bash
cd marambaia-pdv/customer-app
vercel --prod
```

Repita o processo acima, mudando o nome do projeto para `marambaia-pdv-customer`

---

## Verificação

Após o deploy, você terá 2 URLs:

- **Admin**: `https://marambaia-pdv-admin.vercel.app`
- **Cliente**: `https://marambaia-pdv-customer.vercel.app`

Teste ambas as URLs no navegador!

---

## Atualizando as URLs no Backend

Depois que os frontends estiverem no ar:

1. Vá ao **Render.com** → seu backend
2. Em "Environment", atualize:

```
FRONTEND_URL = https://marambaia-pdv-admin.vercel.app
CUSTOMER_APP_URL = https://marambaia-pdv-customer.vercel.app
```

3. Salve (o Render vai fazer redeploy automaticamente)

---

## Troubleshooting

### "Module not found" ou "Build failed"

- Verifique se o **Root Directory** está correto
- Deve ser `marambaia-pdv/client` ou `marambaia-pdv/customer-app`

### "Cannot find package.json"

- O Root Directory está errado
- Certifique-se de apontar para a pasta correta que contém o package.json

### Build funciona mas página em branco

- Faltam as variáveis de ambiente
- Adicione `REACT_APP_API_URL` e `REACT_APP_SOCKET_URL`
- Faça um novo deploy após adicionar as variáveis

---

Pronto! Seu sistema estará no ar gratuitamente!
