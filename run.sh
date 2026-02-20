#!/bin/bash

# 1. Update Network IPs (detects local IP and patches source files)
echo "🔄 Checking Network Configuration..."
python3 update_network_ip.py
if [ $? -ne 0 ]; then
    echo "⚠️  Network update skipped or no changes needed. Continuing..."
fi

# 2. Start Docker Compose (v2 syntax — works on Kali Linux)
echo "🚀 Starting Docker environment..."
docker compose up -d --build
