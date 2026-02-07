@echo off
setlocal

echo 🔄 Updating Network Configuration...
python update_network_ip.py
set EXIT_CODE=%errorlevel%

if %EXIT_CODE% EQU 100 (
    echo ⚠️  Network change detected! Rebuilding Android App...
    
    echo 📦 Building Web Assets...
    call npm run build
    
    echo 🔄 Syncing Capacitor...
    call npx cap sync android
    
    echo 📱 Building Android APK...
    cd android
    call gradlew assembleDebug
    cd ..
    
    echo 🚀 Deploying APK...
    if not exist "server\public" mkdir "server\public"
    copy "android\app\build\outputs\apk\debug\app-debug.apk" "server\public\simtinel.apk"
    echo APK deployed to server\public\simtinel.apk

) else if %EXIT_CODE% NEQ 0 (
    echo ❌ Failed to update network IP. Aborting.
    pause
    exit /b %EXIT_CODE%
) else (
    echo ✅ No network changes detected. Skipping rebuild.
)

echo 🚀 Starting Docker environment (Rebuilding to apply changes)...
docker-compose up --build
pause
