#!/bin/bash

# 1. Update Network IPs
echo "🔄 Updating Network Configuration..."
python3 update_network_ip.py
EXIT_CODE=$?

if [ $EXIT_CODE -eq 100 ]; then
    echo "⚠️  Network change detected! Rebuilding Android App..."
    
    # Build Web Assets
    echo "📦 Building Web Assets..."
    npm run build

    # Sync Capacitor
    echo "🔄 Syncing Capacitor..."
    npx cap sync android

    # Build Android APK
    echo "📱 Building Android APK..."
    cd android
    ./gradlew assembleDebug
    cd ..

    # Deploy APK
    echo "🚀 Deploying APK..."
    ./deploy_apk.sh

elif [ $EXIT_CODE -ne 0 ]; then
    echo "❌ Failed to update network IP. Aborting."
    exit 1
else
    echo "✅ No network changes detected. Skipping rebuild."
fi

# 2. Start Docker Compose with Build
echo "🚀 Starting Docker environment (Rebuilding to apply changes)..."
docker-compose up --build
