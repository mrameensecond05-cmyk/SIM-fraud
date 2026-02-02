#!/bin/bash

# 1. Update Network IPs
echo "🔄 Updating Network Configuration..."
python3 update_network_ip.py

if [ $? -ne 0 ]; then
    echo "❌ Failed to update network IP. Aborting."
    exit 1
fi

# 2. Start Docker Compose with Build
echo "🚀 Starting Docker environment (Rebuilding to apply changes)..."
docker-compose up --build
