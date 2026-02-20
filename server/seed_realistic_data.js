const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function seedRealisticData() {
    const pool = mysql.createPool({
        host: '127.0.0.1',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'simtool',
        password: process.env.DB_PASSWORD || 'simtool',
        database: process.env.DB_NAME || 'simfraud_db',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });

    try {
        console.log("Connected to Database...");

        // 1. Create/Ensure Admin Exists (Already handled by index.js usually, but ensuring here)
        // ... (Skipping admin creation as it's likely there, focusing on data)

        // 2. Insert Users
        const users = [
            { name: "Rahul Sharma", email: "rahul.sharma@example.com", phone: "9876543210" },
            { name: "Priya Patel", email: "priya.patel@example.com", phone: "9123456789" },
            { name: "Amit Singh", email: "amit.singh@example.com", phone: "9988776655" },
            { name: "Sneha Gupta", email: "sneha.gupta@example.com", phone: "8877665544" },
            { name: "Vikram Malhotra", email: "vikram.m@example.com", phone: "7766554433" }
        ];

        console.log("Seeding Users...");
        const userIds = [];
        for (const user of users) {
            // Check if exists
            const [existing] = await pool.query("SELECT id FROM SIMFraudLogin WHERE email = ?", [user.email]);
            let loginId;

            if (existing.length === 0) {
                const salt = await bcrypt.genSalt(10);
                const hash = await bcrypt.hash('password123', salt);
                const [res] = await pool.query(
                    "INSERT INTO SIMFraudLogin (email, password_hash, role_id, phone_number) VALUES (?, ?, 1, ?)",
                    [user.email, hash, user.phone]
                );
                loginId = res.insertId;

                const [profileRes] = await pool.query(
                    "INSERT INTO SIMFraudUserProfile (login_id, name, email, phone) VALUES (?, ?, ?, ?)",
                    [loginId, user.name, user.email, user.phone]
                );
                userIds.push(profileRes.insertId);
            } else {
                const [profile] = await pool.query("SELECT id FROM SIMFraudUserProfile WHERE login_id = ?", [existing[0].id]);
                if (profile.length > 0) userIds.push(profile[0].id);
            }
        }

        // 3. Insert Transactions & Alerts
        // We'll create some transactions for the first few users
        console.log("Seeding Transactions & Alerts...");

        if (userIds.length > 0) {
            // User 1: Rahul - High Value Fraud Attempt (Blocked)
            const uid1 = userIds[0];
            await createTransactionWithAlert(pool, uid1, 50000.00, 'BLOCK', 'HIGH', "SIM Swap Detected + High Value Transfer", "9876543210");

            // User 2: Priya - Medium Risk (Flagged)
            const uid2 = userIds[1];
            await createTransactionWithAlert(pool, uid2, 10000.00, 'STEP_UP', 'MEDIUM', "Unusual Location + New Device", "9123456789");

            // User 3: Amit - Normal Transaction
            const uid3 = userIds[2];
            await pool.query(
                "INSERT INTO SIMFraudTransaction (user_id, amount, channel, status, timestamp) VALUES (?, ?, 'UPI', 'approved', DATE_SUB(NOW(), INTERVAL 2 HOUR))",
                [uid3, 500.00]
            );

            // User 4: Sneha - Critical Fraud (Blocked)
            const uid4 = userIds[3];
            await createTransactionWithAlert(pool, uid4, 150000.00, 'BLOCK', 'CRITICAL', "Multiple SIM Swaps + Overseas IP", "8877665544");
        }

        console.log("Seeding Complete!");

    } catch (err) {
        console.error("Seeding Failed:", err);
    } finally {
        await pool.end();
    }
}

async function createTransactionWithAlert(pool, userId, amount, decision, severity, reason, phone) {
    // 1. Transaction
    const [tx] = await pool.query(
        "INSERT INTO SIMFraudTransaction (user_id, amount, channel, status, timestamp) VALUES (?, ?, 'NETBANKING', ?, NOW())",
        [userId, amount, decision === 'BLOCK' ? 'blocked' : 'approved']
    );
    const txId = tx.insertId;

    // 2. Prediction
    const [pred] = await pool.query(
        "INSERT INTO SIMFraudPredictionOutput (transaction_id, fraud_score, decision, features_json, explanation_json) VALUES (?, ?, ?, ?, ?)",
        [
            txId,
            severity === 'CRITICAL' ? 0.95 : (severity === 'HIGH' ? 0.85 : 0.65),
            decision,
            JSON.stringify({ amount, channel: 'NETBANKING' }),
            JSON.stringify([{ reason: reason, weight: 0.9 }])
        ]
    );
    const predId = pred.insertId;

    // 3. Alert
    await pool.query(
        "INSERT INTO SIMFraudAlert (prediction_id, severity, status, created_at) VALUES (?, ?, 'open', NOW())",
        [predId, severity]
    );
}

seedRealisticData();
