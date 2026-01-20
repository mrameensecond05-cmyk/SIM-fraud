# Ollama Setup & Integration Guide

The application is already configured to connect to Ollama at `http://localhost:11434`.

However, you encountered a **"bind: address already in use"** error, which means either:
1.  Ollama is *already running* in the background.
2.  Another process is blocking the port.

Follow these steps to fix the error and verify the connection.

## 1. Fix "Address Already in Use"

Run these commands in your terminal to find and stop the conflicting process:

```bash
# 1. Try to find the process ID (PID)
lsof -i :11434
# OR
ss -tulpn | grep 11434

# 2. Kill the process (Replace <PID> with the number from above)
kill -9 <PID>

# 3. If you can't find the PID, force kill all ollama instances:
pkill ollama
killall ollama
```

## 2. Start Ollama Server

Once the port is free, start the server in a separate terminal:

```bash
ollama serve
```

> **Success Indicator**: You should see "Listening on 127.0.0.1:11434".

## 3. Pull the Model

The code expects the `mistral` model. Run this in a *new* terminal window:

```bash
ollama pull mistral
```

## 4. Verify Integration

1.  **Test Script**: Run the verification script I created.
    ```bash
    cd server
    node test_ai_flow.js
    ```
    *Result*: It should print `✅ Ollama Response: ...` instead of "Service Unavailable".

2.  **User App**:
    -   Start Backend: `node server/index.js`
    -   Start Frontend: `npm run dev`
    -   Go to the "Feed" or "Alerts" tab.
    -   (Optional) If you implemented the "Simulate SMS" button, risk scores will now be calculated by the local AI.

## Troubleshooting

-   **"Connection Refused"**: The server is not running. Run `ollama serve`.
-   **"Model not found"**: You forgot step 3 (`ollama pull mistral`).
-   **Slow Response**: Local AI inference depends on your GPU/CPU. It may take a few seconds per SMS.
