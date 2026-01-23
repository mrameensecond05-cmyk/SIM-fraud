
const axios = require('axios');
const mysql = require('mysql2/promise');
require('dotenv').config();

// Config
const BASE_URL = 'http://localhost:5000/api';
const DB_CONFIG = {
    host: 'localhost',
    port: 3307, // Mapped port
    user: 'root',
    password: 'rootpassword',
    database: 'simfraud_db'
};

async function runFinalQA() {
    console.log("=== FINAL QA VERIFICATION ===");
    let conn;

    try {
        // 1. Trigger AI Analysis
        console.log("\n1. Triggering AI Analysis (POST /api/analyze)...");
        const payload = {
            smsText: "URGENT: Your bank account will be suspended. Click http://scam.com/verify now! Rs. 100000 deducted.",
            deviceContext: { imsiMatch: true, simSwapHours: 48 }, // High risk context
            userId: 1 // Admin user ID usually 1 or 2
        };

        const res = await axios.post(`${BASE_URL}/analyze`, payload);
        console.log("   API Response:", res.status);
        console.log("   Analysis:", JSON.stringify(res.data.analysis, null, 2));

        if (res.data.success && res.data.analysis.risk_score > 0) {
            console.log("   ✅ AI Service returned valid analysis.");
        } else {
            throw new Error("AI Service returned invalid response.");
        }

        // 2. Verify Database Persistence
        console.log("\n2. Verifying Database Persistence...");
        conn = await mysql.createConnection(DB_CONFIG);

        // Check Transaction
        const [txRows] = await conn.execute('SELECT * FROM SIMFraudTransaction ORDER BY id DESC LIMIT 1');
        if (txRows.length > 0) {
            console.log(`   ✅ Transaction persisted. ID: ${txRows[0].id}, Amount: ${txRows[0].amount}`);
        } else {
            throw new Error("Transaction not found in DB.");
        }

        // Check Prediction
        const [predRows] = await conn.execute('SELECT * FROM SIMFraudPredictionOutput WHERE transaction_id = ?', [txRows[0].id]);
        if (predRows.length > 0) {
            console.log(`   ✅ Prediction persisted. Score: ${predRows[0].fraud_score}, Decision: ${predRows[0].decision}`);
        } else {
            throw new Error("Prediction output not found in DB.");
        }

        // Check Alert (since we sent a scam message)
        const [alertRows] = await conn.execute('SELECT * FROM SIMFraudAlert WHERE prediction_id = ?', [predRows[0].id]);
        if (alertRows.length > 0) {
            console.log(`   ✅ Alert created. Severity: ${alertRows[0].severity}, Status: ${alertRows[0].status}`);
        } else {
            console.log("   ℹ️ No alert created (Risk score might be below threshold).");
        }

        console.log("\n=== FINAL QA PASSED SUCCESSFULLY ===");

    } catch (err) {
        console.error("\n❌ FINAL QA FAILED:", err.message);
        if (err.response) {
            console.error("   API Error Data:", err.response.data);
        }
        process.exit(1);
    } finally {
        if (conn) await conn.end();
    }
}

runFinalQA();
