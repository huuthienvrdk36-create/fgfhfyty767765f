#!/bin/bash

# Auto Platform - One-Click Setup Script
# Usage: ./scripts/setup.sh

set -e

echo "🚀 Auto Platform Setup"
echo "======================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "\n${YELLOW}Checking prerequisites...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js not found. Please install Node.js 18+${NC}"
    exit 1
fi

if ! command -v yarn &> /dev/null; then
    echo -e "${YELLOW}Installing yarn...${NC}"
    npm install -g yarn
fi

if ! command -v mongosh &> /dev/null; then
    echo -e "${YELLOW}Warning: MongoDB shell not found. Make sure MongoDB is running.${NC}"
fi

# Backend setup
echo -e "\n${GREEN}[1/5] Setting up Backend...${NC}"
cd backend

if [ ! -f ".env" ]; then
    echo "Creating .env from template..."
    cp .env.example .env 2>/dev/null || cat > .env << 'EOF'
MONGO_URL=mongodb://localhost:27017
DB_NAME=auto_platform
JWT_ACCESS_SECRET=auto_service_jwt_secret_key_2025_very_secure
PORT=3001
EOF
fi

echo "Installing backend dependencies..."
yarn install --frozen-lockfile 2>/dev/null || yarn install

echo "Building NestJS..."
yarn build

# Frontend setup
echo -e "\n${GREEN}[2/5] Setting up Frontend...${NC}"
cd ../frontend

if [ ! -f ".env" ]; then
    echo "Creating .env from template..."
    cat > .env << 'EOF'
REACT_APP_BACKEND_URL=http://localhost:8001
EOF
fi

echo "Installing frontend dependencies..."
yarn install --frozen-lockfile 2>/dev/null || yarn install

# Admin panel setup
echo -e "\n${GREEN}[3/5] Setting up Admin Panel...${NC}"
cd ../admin

echo "Installing admin dependencies..."
yarn install --frozen-lockfile 2>/dev/null || yarn install

echo "Building admin panel..."
yarn build

# Python dependencies
echo -e "\n${GREEN}[4/5] Setting up Python proxy...${NC}"
cd ../backend

pip install -r requirements.txt --quiet 2>/dev/null || pip3 install -r requirements.txt --quiet

# Seed database
echo -e "\n${GREEN}[5/5] Seeding database...${NC}"
cd ..

if command -v mongosh &> /dev/null; then
    node scripts/seed.js 2>/dev/null || yarn --cwd backend seed 2>/dev/null || echo "Seed via MongoDB..."
    mongosh auto_platform --file scripts/seed.mongo.js 2>/dev/null || true
fi

echo -e "\n${GREEN}✅ Setup complete!${NC}"
echo ""
echo "To start the application:"
echo ""
echo "  Option 1 (Development):"
echo "    Terminal 1: cd backend && yarn start:dev"
echo "    Terminal 2: cd frontend && yarn start"
echo ""
echo "  Option 2 (Production with Python proxy):"
echo "    cd backend && python server.py"
echo "    (This serves both API and admin panel)"
echo ""
echo "Access points:"
echo "  - Frontend: http://localhost:3000"
echo "  - Backend API: http://localhost:8001/api"
echo "  - Admin Panel: http://localhost:8001/api/admin-panel/"
echo ""
echo "Test credentials:"
echo "  Admin: admin@autoservice.com / Admin123!"
echo "  Provider: provider@bmwgarage.com / Provider123!"
