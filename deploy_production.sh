#!/bin/bash
set -e

echo "=== SIMtinel Production Deployment using Native Node.js ==="

# 1. Environment Setup
echo "Step 1: Checking Environment..."
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed."
    exit 1
fi

if ! command -v mysql &> /dev/null; then
    echo "Warning: mysql client not found, skipping direct DB check (Backend will handle connection)."
fi

# 2. Install Dependencies
echo "Step 2: Installing Dependencies..."
echo "  - Frontend..."
npm install
echo "  - Backend..."
cd server
npm install
cd ..

# 3. Build Frontend
echo "Step 3: Building Frontend Application..."
npm run build

# 4. Prepare Backend Static Serving
# Copy dist to server/public/web to keep structure clean
echo "Step 4: Linking Frontend to Backend..."
mkdir -p server/public/web
rm -rf server/public/web/*
cp -r dist/* server/public/web/

# 5. Start Application
echo "Step 5: Starting Production Server..."
export NODE_ENV=production
export PORT=5000
# Ensure we set DB vars if not present
export DB_HOST=${DB_HOST:-localhost}
export DB_USER=${DB_USER:-root}
export DB_PASSWORD=${DB_PASSWORD:-rootpassword}

echo "  Server listening on http://localhost:5000"
echo "  - Web App: http://localhost:5000/"

cd server
nohup node index.js > app.log 2>&1 &
echo "  App running! Log: server/app.log"
