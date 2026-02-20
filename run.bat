@echo off
setlocal

echo 🔄 Checking Network Configuration...
python update_network_ip.py
if %errorlevel% neq 0 (
    echo ❌ Network update or build failed. Aborting.
    pause
    exit /b %errorlevel%
)

echo 🚀 Starting Docker environment...
docker-compose up -d --build
pause
