@echo off
echo 🔄 Updating Network Configuration...
python update_network_ip.py
if %errorlevel% neq 0 (
    echo ❌ Failed to update network IP. Aborting.
    pause
    exit /b %errorlevel%
)

echo 🚀 Starting Docker environment (Rebuilding to apply changes)...
docker-compose up --build
pause
