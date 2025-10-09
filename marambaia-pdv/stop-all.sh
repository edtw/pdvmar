#!/bin/bash

# Marambaia PDV - Stop All Services

echo "🛑 Stopping Marambaia PDV System..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Kill processes on ports
echo "${RED}Stopping Backend (Port 3001)...${NC}"
lsof -ti:3001 | xargs kill -9 2>/dev/null

echo "${RED}Stopping Admin App (Port 3000)...${NC}"
lsof -ti:3000 | xargs kill -9 2>/dev/null

echo "${RED}Stopping Customer App (Port 3002)...${NC}"
lsof -ti:3002 | xargs kill -9 2>/dev/null

echo ""
echo "${GREEN}✅ All services stopped!${NC}"
