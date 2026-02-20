# Network Auto-Configuration & Build Automation

This guide explains the automated network configuration and Android build process powered by `update_network_ip.py`.

## What it Does

When you run the start script, the system automatically:

1.  **Detects your local IP address** (compatible with Windows, Linux, and macOS).
2.  **Updates IP addresses** in the following configuration files:
    *   `services/userService.ts`
    *   `vite.config.ts`
    *   `android/app/src/main/res/xml/network_security_config.xml`
    *   `server/qa_test_suite.js`
    *   `server/verify_system.js`
    *   `server/test_sim_swap.js`
3.  **Rebuilds the Android App** (only if an IP change is detected):
    *   Runs `npm run build` (Vite build)
    *   Runs `npx cap sync` (Capacitor sync)
    *   Runs `gradlew assembleDebug` (Android APK build)

---

## 🚀 How to Run

To start the system with automatic network configuration and Docker deployment, simply run the wrapper script for your OS.

### 🐧 For Linux / Mac
Open your terminal and run:
```bash
./run.sh
```

### 🪟 For Windows
Open Command Prompt or PowerShell and run:
```bat
run.bat
```

**These scripts will:**
1.  Run `update_network_ip.py` to check and update IPs.
2.  If IPs changed, automatically rebuild the Android app.
3.  Start the backend services using `docker-compose up -d --build`.

---

## ✅ Verification

After the script finishes, you can verify the update:

1.  **Check IP**: The terminal output will show the detected IP (matching your machine's LAN IP).
2.  **Check Files**: Open any of the files listed above to ensure they contain the new IP.
3.  **Check APK**: A new APK will be generated at:
    *   `android/app/build/outputs/apk/debug/app-debug.apk`
    *   It is also copied to `server/public/simtinel.apk` for easy download.
