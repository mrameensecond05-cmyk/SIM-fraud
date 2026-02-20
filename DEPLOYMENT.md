# SIM-Fraud System Deployment Guide

This guide explains how to deploy the SIM-Fraud system on a new device (e.g., a fresh server or laptop) by pulling the code from Git, configuring the IP addresses, and building the Android APK.

## Prerequisites

Ensure the new device has the following installed:
- **Git**
- **Node.js** (v18 or higher) & **npm**
- **Java JDK** (v17 recommended for Android builds)
- **Android Studio** (or Android SDK Command Line Tools)
- **Docker** (optional, for running MySQL/Ollama easily)
- **Ollama** (if running locally)

---

## Step 1: Clone the Repository

Open a terminal on the new device and run:

```bash
git clone <YOUR_GIT_REPO_URL>
cd SIM-fraud
```

*(Replace `<YOUR_GIT_REPO_URL>` with your actual Git repository URL)*

---

## Step 2: Identify Your New IP Address

You need the Local IP address of this new device so the Android app and other services can connect to it.

**On Linux/Mac:**
```bash
ip addr show | grep inet
# Look for an IP like 192.168.1.X or 10.0.0.X
```

**On Windows:**
```bash
ipconfig
```

*Let's assume your new IP is `192.168.1.50` for the rest of this guide.*

---

## Step 3: Update Configuration Files

You must update the IP address in 3 specific files.

### 1. Update Frontend/App Config
**File:** `services/userService.ts`

Open this file and find `SERVER_IP`. Change it to your new IP:

```typescript
// services/userService.ts

// CHANGE THIS:
export const SERVER_IP = 'http://192.168.1.50:5000'; 
```

### 2. Update Android Network Security (Critical)
**File:** `android/app/src/main/res/xml/network_security_config.xml`

Allow the app to trust your new local IP.

```xml
<!-- android/app/src/main/res/xml/network_security_config.xml -->
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
        <!-- ADD YOUR NEW IP HERE -->
        <domain includeSubdomains="true">192.168.1.50</domain>
        <domain includeSubdomains="true">localhost</domain>
    </domain-config>
</network-security-config>
```

### 3. Update Backend Environment
**File:** `server/.env`

Create or edit the `.env` file in the `server` folder.

```bash
cd server
nano .env
```

Ensure the contents match your setup (especially `DB_HOST` if your DB is on another machine, otherwise `localhost` or `127.0.0.1` is fine for local DB):

```env
DB_HOST=localhost
DB_USER=simtool
DB_PASSWORD=simtool
DB_NAME=simfraud_db
PORT=5000
OLLAMA_URL=http://localhost:11434/api/generate
```

---

## Step 4: Setup and Run the Backend

1.  **Install Dependencies:**
    ```bash
    cd server
    npm install
    ```

2.  **Start the Server:**
    ```bash
    node index.js
    # OR
    npm start
    ```

    *You should see "Server running on port 5000" and database connection success.*

---

## Step 5: Build the Android APK

Now that the IP address in the code (`userService.ts`) points to your new server, you need to rebuild the APK.

1.  **Go to Android Directory:**
    ```bash
    cd ../android
    ```

2.  **Build Debug APK:**
    ```bash
    ./gradlew assembleDebug
    ```
    *(On Windows, use `gradlew.bat assembleDebug`)*

    *This process may take a few minutes.*

3.  **Deploy/Rename the APK:**
    Go back to the root directory and use the deploy script (if configured) or move manually.

    ```bash
    cd ..
    npm run deploy-apk
    ```

    *This command will copy the new APK to `server/public/simtinel.apk`.*

---

## Step 6: Test the Deployment

1.  **Download the App:**
    Connect an Android phone to the same WiFi network.
    Open Chrome on the phone and go to:
    `http://192.168.1.50:5000/simtinel.apk`

2.  **Install & Run:**
    Install the APK and open it.
    Try to **Register** or **Login**.
    
    *If it works, the app successfully connected to your backend at `192.168.1.50`!*
