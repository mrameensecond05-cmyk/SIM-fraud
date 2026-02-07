# System Update Walkthrough

## 1. 🔄 Network Auto-Configuration
We implemented a feature to automatically update your application's configuration when you switch networks (e.g., moving from Home to Office Wi-Fi).

### How to use
Instead of manually editing files, simply run the start script for your OS:

- **Linux/Mac**: `./run.sh`
- **Windows**: `run.bat`

### What it does
1. Detects your computer's local IP address (e.g., `192.168.1.X`).
2. Automatically updates the IP in:
   - `services/userService.ts` (Connects Frontend to Backend)
   - `android/app/src/main/res/xml/network_security_config.xml` (Android Permissions)
   - `server/qa_test_suite.js` (QA Tests)
   - `server/verify_system.js` (System Checks)
   - `server/test_sim_swap.js` (Sim Swap Tests)
3. Rebuilds and starts your Docker containers.

---

## 2. ⚡ Simplified User Flow (OTP Removed)
As requested, the requirement for mobile number verification via OTP has been removed to streamline testing and usage.

- **Frontend**: The "Add SIM" modal in `ProfileView` now adds the number directly without asking for an OTP.
- **Backend**: The `/api/otp/send` and `/api/otp/verify` endpoints have been removed from `server/index.js`.

---

## 3. ✅ Quality Assurance (QA) Status
We performed a full system audit.

| Feature | Status | Notes |
| :--- | :--- | :--- |
| **Registration** | ✅ PASS | Users can sign up successfully. |
| **Login** | ✅ PASS | Auth works; unregistered users correctly blocked. |
| **SIM Swap Check** | ✅ PASS | System detects "New SIM" vs "Same SIM" vs "IMEI Change". |
| **AI Analysis** | ✅ PASS | Ollama integration is functional and returning risk scores. |
| **Alerts API** | ✅ PASS | Alerts are correctly fetched and displayed. |

### Running Tests Manually
You can run the comprehensive test suite at any time:
```bash
node server/qa_test_suite.js
```
