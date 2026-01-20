# SIMtinel Technical Documentation v1.0

## 1. Executive Summary
SIMtinel is an advanced fraud detection and SIM integrity monitoring system designed to protect users from SIM swap attacks, phishing, and unauthorized transaction intercepts. By combining local device heuristics with the **Ollama (Mistral)** neural engine, SIMtinel provides real-time risk assessment of incoming SMS traffic.

---

## 2. Technical Architecture

### 2.1 Current Web Stack (MVP/Prototype)
- **Frontend:** React 19, Tailwind CSS (Mobile-First Design)
- **State Management:** React Context + Hooks
- **AI Engine:** Ollama (Mistral - Local Inference)
- **Visualizations:** Recharts (SVG-based)
- **Heuristics:** Simulated Java Spring Boot backend (Aadhaar Genuineness Service)

### 2.2 Native Target Stack (Migration Path)
- **Cross-Platform:** Flutter (Dart)
- **Native Interop:** MethodChannels (Kotlin/Swift)
- **Background Tasks:** WorkManager (Android)
- **Persistence:** Hive or Sqflite (Local Secure Storage)

---

## 3. Core Features & Logic

### 3.1 SMS Analysis Pipeline
1. **Interception:** (Native only) `BroadcastReceiver` captures PDUs.
2. **Pre-processing:** Extract sender, body, and timestamp.
3. **Contextual Enrichment:** 
   - Check `IMSI` match (Is the current SIM the registered one?).
   - Check `SIM Swap Timer` (Has the SIM changed in the last 72 hours?).
   - Check `Identity Trust` (Is the number Aadhaar-verified?).
4. **AI Inference:** Payload sent to local Ollama instance with strict JSON schema response.

### 3.2 AI Prompt Engineering
SIMtinel utilizes `mistral` (via Ollama) for low-latency analysis. The system instruction prioritizes:
- **Financial Pattern Recognition:** Detecting "Zelle," "OTP," "Verify," and "Urgent."
- **Risk Weighting:** Elevating scores if the device context (SIM Swap < 72h) is compromised.
- **Identity Verification Status:** Adjusting confidence levels based on Aadhaar linkage.

---

## 4. Database Schema (Target)

### `SimProfile`
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Unique Identifier |
| phone_number | String | E.164 formatted number |
| imsi_hash | String | SHA-256 hash of SIM IMSI |
| identity_linked | Boolean | Aadhaar verification status |
| last_swap_check | DateTime | Last time telco registry was polled |

### `FraudAlert`
| Field | Type | Description |
|-------|------|-------------|
| id | String | Alert identifier |
| sender | String | Originating address |
| risk_score | Int | 0-100 score |
| category | Enum | Phishing, Transaction, etc. |
| timestamp | DateTime | Detection time |

---

## 5. Security & Privacy
- **Zero-Storage Policy:** SMS content is analyzed in-memory and discarded. Only metadata (sender/score) is retained for the security log.
- **Hardware Binding:** In the native implementation, the app utilizes the **Android KeyStore** to bind the user identity to the specific hardware IMEI/IMSI pair.
- **Privacy Masking:** The Admin panel utilizes content redaction to ensure that even system administrators cannot view sensitive user message content.

---

## 6. Implementation Roadmap

### Phase 1: Native Foundation (Week 1-2)
- Scaffold Flutter project.
- Implement Kotlin MethodChannels for `TelephonyManager`.
- Create the background `SmsReceiver` service.

### Phase 2: AI & Logic (Week 3-4)
- Port `geminiService.ts` to Dart using the `google_generative_ai` package.
- Implement the local heuristics engine (IMSI/IMEI matching).
- Design the "Safety Gauge" custom painter in Flutter.

### Phase 3: Identity Integration (Week 5-6)
- Integrate Aadhaar verification flow using a secure WebView or native API.
- Implement Biometric lock for the profile section.
- Beta testing of the background monitoring engine.

---

## 7. API Reference

### Ollama Analysis Request
```bash
POST http://localhost:11434/api/generate
{
  "model": "mistral",
  "prompt": "...",
  "format": "json",
  "stream": false
}
```

### Aadhaar Genuineness Check
`GET /api/v1/verify-ownership?phone={msisdn}`
Returns status of MSISDN relative to carrier registry records.
