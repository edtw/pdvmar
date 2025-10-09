#!/bin/bash

# Script de teste de conexões - Marambaia PDV
# Testa se todas as portas estão acessíveis

echo "================================================"
echo "🔍 TESTE DE CONEXÕES - MARAMBAIA PDV"
echo "================================================"
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Descobrir IP local
IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
echo "📍 IP Local detectado: ${YELLOW}$IP${NC}"
echo ""

echo "================================================"
echo "🧪 TESTANDO PORTAS LOCALMENTE (localhost)"
echo "================================================"

# Testar Backend
echo -n "Backend (3001): "
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api --max-time 2 | grep -q "200"; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ FALHOU${NC}"
fi

# Testar Client PDV
echo -n "Client PDV (3000): "
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 --max-time 2 | grep -q "200"; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ FALHOU${NC}"
fi

# Testar Customer App
echo -n "Customer App (3002): "
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3002 --max-time 2 | grep -q "200"; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ FALHOU${NC}"
fi

echo ""
echo "================================================"
echo "🌐 TESTANDO PORTAS VIA IP DA REDE ($IP)"
echo "================================================"

# Testar Backend via IP
echo -n "Backend ($IP:3001): "
if curl -s -o /dev/null -w "%{http_code}" http://$IP:3001/api --max-time 2 | grep -q "200"; then
    echo -e "${GREEN}✅ OK (acessível externamente)${NC}"
else
    echo -e "${RED}❌ FALHOU (firewall pode estar bloqueando)${NC}"
fi

# Testar Client PDV via IP
echo -n "Client PDV ($IP:3000): "
if curl -s -o /dev/null -w "%{http_code}" http://$IP:3000 --max-time 2 | grep -q "200"; then
    echo -e "${GREEN}✅ OK (acessível externamente)${NC}"
else
    echo -e "${RED}❌ FALHOU (firewall pode estar bloqueando)${NC}"
fi

# Testar Customer App via IP
echo -n "Customer App ($IP:3002): "
if curl -s -o /dev/null -w "%{http_code}" http://$IP:3002 --max-time 2 | grep -q "200"; then
    echo -e "${GREEN}✅ OK (acessível externamente)${NC}"
else
    echo -e "${RED}❌ FALHOU (firewall pode estar bloqueando)${NC}"
fi

echo ""
echo "================================================"
echo "🔥 STATUS DO FIREWALL"
echo "================================================"

# Verificar firewall (sem sudo)
FIREWALL_STATUS=$(/usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate 2>/dev/null | grep -o "enabled\|disabled" || echo "desconhecido")
echo "Firewall: ${YELLOW}${FIREWALL_STATUS}${NC}"

if [ "$FIREWALL_STATUS" = "enabled" ]; then
    echo -e "${YELLOW}⚠️  Firewall está ATIVADO - pode estar bloqueando conexões externas${NC}"
    echo ""
    echo "Para desabilitar temporariamente (CUIDADO!):"
    echo -e "${YELLOW}sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate off${NC}"
    echo ""
    echo "Ou adicionar exceção para Node.js:"
    echo -e "${YELLOW}sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add \$(which node)${NC}"
fi

echo ""
echo "================================================"
echo "📱 URLS PARA ACESSAR NO CELULAR"
echo "================================================"
echo ""
echo "Backend API: ${GREEN}http://$IP:3001/api${NC}"
echo "PDV Admin: ${GREEN}http://$IP:3000${NC}"
echo "Customer App: ${GREEN}http://$IP:3002${NC}"
echo "Garçom: ${GREEN}http://$IP:3000/waiter${NC}"
echo "Cozinha: ${GREEN}http://$IP:3000/kitchen${NC}"
echo ""
echo "================================================"
echo "🔧 DICAS DE TROUBLESHOOTING"
echo "================================================"
echo ""
echo "1. Certifique-se que o celular está na mesma rede Wi-Fi"
echo "2. Se firewall estiver bloqueando, desabilite ou adicione exceção"
echo "3. Verifique se todos os servidores estão rodando:"
echo "   lsof -i :3001,3000,3002"
echo ""
echo "4. Reinicie os servidores se necessário:"
echo "   killall node"
echo "   cd server && npm start &"
echo "   cd client && npm start &"
echo "   cd customer-app && npm start &"
echo ""
echo "================================================"
