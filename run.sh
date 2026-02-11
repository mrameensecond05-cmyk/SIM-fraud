#!/bin/bash

# 1. Update Network IPs & Rebuild App (if needed)
echo "🔄 Checking Network Configuration..."
python3 update_network_ip.py
if [ $? -ne 0 ]; then
    echo "❌ Network update or build failed. Aborting."
    exit 1
fi

# 2. Start Docker Compose
echo "🚀 Starting Docker environment..."
docker-compose up -d --build
