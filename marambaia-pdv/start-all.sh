#!/bin/bash

# Marambaia PDV - Start All Services
# This script starts Backend, Admin App, and Customer App

echo "🚀 Starting Marambaia PDV System..."
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Kill existing processes
echo "${YELLOW}Cleaning up existing processes...${NC}"
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:3001 | xargs kill -9 2>/dev/null
lsof -ti:3002 | xargs kill -9 2>/dev/null
sleep 2

# Start Backend
echo ""
echo "${BLUE}========================================${NC}"
echo "${GREEN}1/3 Starting Backend Server (Port 3001)${NC}"
echo "${BLUE}========================================${NC}"
cd server
npm start > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"
sleep 3

# Start Admin App
echo ""
echo "${BLUE}========================================${NC}"
echo "${GREEN}2/3 Starting Admin App (Port 3000)${NC}"
echo "${BLUE}========================================${NC}"
cd ../client
PORT=3000 npm start > ../logs/admin.log 2>&1 &
ADMIN_PID=$!
echo "Admin PID: $ADMIN_PID"
sleep 3

# Start Customer App
echo ""
echo "${BLUE}========================================${NC}"
echo "${GREEN}3/3 Starting Customer App (Port 3002)${NC}"
echo "${BLUE}========================================${NC}"
cd ../customer-app
PORT=3002 npm start > ../logs/customer.log 2>&1 &
CUSTOMER_PID=$!
echo "Customer PID: $CUSTOMER_PID"

echo ""
echo "${BLUE}========================================${NC}"
echo "${GREEN}✅ All Services Started!${NC}"
echo "${BLUE}========================================${NC}"
echo ""
echo "Backend:      http://localhost:3001"
echo "Admin App:    http://localhost:3000"
echo "Customer App: http://localhost:3002"
echo ""
echo "Logs: ./logs/"
echo ""
echo "To stop all: ./stop-all.sh"
echo "To view logs: tail -f logs/*.log"
echo ""
echo "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

# Wait for processes
wait
