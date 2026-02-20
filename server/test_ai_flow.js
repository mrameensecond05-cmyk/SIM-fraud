const mysql = require('mysql2/promise');
const { analyzeWithOllama } = require('./aiService');
require('dotenv').config();

async function testAiFlow() {
    console.log("=== STARTING AI & DB FLOW TEST ===");

    // 1. Test AI Analysis
    const testSms = "URGENT: Your bank account is locked. Click here to verify: http://bit.ly/fake-bank";
    const context = { imsiMatch: true, simSwapHours: 48, isAadhaarVerified: false };

    console.log(`\n1. Sending SMS to Ollama: "${testSms}"`);
    let analysis;
    try {
        analysis = await analyzeWithOllama(testSms, context);
        console.log("   ✅ Ollama Response:", JSON.stringify(analysis, null, 2));
    } catch (err) {
        // Fallback for demo if Ollama is down
        console.log("   ⚠️  Ollama Service Offline (Expected if not running locally)");
        analysis = {
            riskScore: 0.95,
            riskLevel: "CRITICAL",
            reasoning: "Simulated HIGH RISK prediction for testing DB flow.",
            category: "Phishing"
        };
        console.log("   -> Using Simulated Analysis:", analysis);
    }

    // 2. Test DB Write
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'simfraud_db'
        });
        console.log("\n2. DB Connection Successful");

        // --- PRE-REQ: Ensure User Exists ---
        const [users] = await connection.execute('SELECT id FROM SIMFraudUserProfile LIMIT 1');
        let userId;

        if (users.length === 0) {
            console.log("   -> Creating Dependency: Dummy User...");
            // Ensure Role Exists
            try {
                await connection.execute("INSERT IGNORE INTO SIMFraudRole (id, role_name) VALUES (1, 'USER')");
            } catch (e) {
                // Ignore if exists
            }

            // Create Login with EMAIL
            const [lRes] = await connection.execute(
                "INSERT INTO SIMFraudLogin (email, password_hash, role_id) VALUES (?, 'hash', 1)",
                [`test_${Date.now()}@example.com`]
            );

            // Create Profile
            const [uRes] = await connection.execute(
                "INSERT INTO SIMFraudUserProfile (login_id, name, email, phone) VALUES (?, 'Test User', ?, '1234567890')",
                [lRes.insertId, `test_${Date.now()}@example.com`]
            );
            userId = uRes.insertId;
        } else {
            userId = users[0].id;
        }
        console.log(`   -> Using User ID: ${userId}`);

        // A. Create Transaction
        console.log("   -> Inserting Dummy Transaction...");
        const [txRes] = await connection.execute(`
            INSERT INTO SIMFraudTransaction (user_id, amount, channel, status, tx_time) 
            VALUES (?, 0.00, 'OTHER', 'initiated', NOW())
        `, [userId]);
        const txId = txRes.insertId;
        console.log(`      Transaction ID: ${txId}`);

        // B. Save Prediction
        console.log("   -> Saving AI Prediction...");
        const [predRes] = await connection.execute(`
            INSERT INTO SIMFraudPredictionOutput
            (transaction_id, fraud_score, decision, features_json, explanation_json)
            VALUES (?, ?, ?, ?, ?)
        `, [
            txId,
            analysis.riskScore,
            analysis.riskLevel === 'CRITICAL' ? 'BLOCK' : 'STEP_UP',
            JSON.stringify({ sms: testSms }),
            JSON.stringify(analysis.reasoning)
        ]);
        const predId = predRes.insertId;
        console.log(`      Prediction ID: ${predId}`);

        // C. Create Alert
        if (['HIGH', 'CRITICAL'].includes(analysis.riskLevel)) {
            console.log("   -> Creating High Risk Alert...");
            const [alertRes] = await connection.execute(`
                INSERT INTO SIMFraudAlert (prediction_id, severity, status)
                VALUES (?, ?, 'open')
            `, [predId, analysis.riskLevel]);
            console.log(`      Alert ID: ${alertRes.insertId}`);
        }

        console.log("\n=== TEST COMPLETED SUCCESSFULLY ✅ ===");

    } catch (err) {
        console.error("\n❌ DB Operation Failed:", err.message);
        console.error(err);
    } finally {
        if (connection) await connection.end();
    }
}

testAiFlow();
