const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const { analyzeWithOllama } = require('./aiService');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'simfraud_db',
    // Port 8889 is common for MAMP/MySQL, but default is 3306. 
    // Using default if not specified.
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test Connection
pool.getConnection()
    .then(conn => {
        console.log("Connected to MySQL Database (simfraud_db)!");
        conn.release();
    })
    .catch(err => {
        console.error("Database Connection Failed:", err.message);
    });

// --- API ROUTES ---

// Get Stats for Dashboard
app.get('/api/stats', async (req, res) => {
    try {
        const [users] = await pool.query('SELECT COUNT(*) as count FROM SIMFraudUserProfile');

        // Count threats blocked in last 24h (from Prediction Output where decision = BLOCK)
        const [incidents] = await pool.query(`
            SELECT COUNT(*) as count 
            FROM SIMFraudPredictionOutput 
            WHERE decision = 'BLOCK' 
            AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
        `);

        // Count open alerts
        const [activeThreats] = await pool.query(`
            SELECT COUNT(*) as count 
            FROM SIMFraudAlert 
            WHERE status IN ('open', 'in_review')
        `);

        res.json({
            totalUsers: users[0].count,
            threatsBlockedToday: incidents[0].count,
            activeThreats: activeThreats[0].count,
            systemHealth: '100%'
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Get Users
app.get('/api/users', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                p.id, 
                p.name, 
                p.email, 
                'ACTIVE' as status, -- Defaulting as status not in Profile
                0 as risk_score,    -- Placeholder, could join with latest prediction score
                p.created_at as last_active,
                l.role_id,
                r.role_name
            FROM SIMFraudUserProfile p
            JOIN SIMFraudLogin l ON p.login_id = l.id
            JOIN SIMFraudRole r ON l.role_id = r.id
        `);

        const formatted = rows.map(u => ({
            id: u.id.toString(),
            name: u.name,
            email: u.email,
            status: u.status,
            riskScore: 0,
            lastActive: u.last_active, // In real app, join with LoginEvent
            role: u.role_name
        }));
        res.json(formatted);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Get Incidents (Mapping Alerts + Predictions)
app.get('/api/incidents', async (req, res) => {
    try {
        // Joining Alert -> Prediction -> Transaction -> User
        const [rows] = await pool.query(`
            SELECT 
                a.id, 
                a.severity, 
                a.status,
                p.decision,
                p.fraud_score,
                t.tx_time,
                up.name as user_name,
                up.id as user_id,
                'SUSPICIOUS_ACTIVITY' as type -- Generic type for now
            FROM SIMFraudAlert a
            JOIN SIMFraudPredictionOutput p ON a.prediction_id = p.id
            JOIN SIMFraudTransaction t ON p.transaction_id = t.id
            JOIN SIMFraudUserProfile up ON t.user_id = up.id
            ORDER BY a.created_at DESC
            LIMIT 50
        `);

        const formatted = rows.map(i => ({
            id: i.id.toString(),
            userId: i.user_id.toString(),
            userName: i.user_name,
            type: i.decision === 'BLOCK' ? 'FRAUD_BLOCKED' : 'ALERT_FLAGGED',
            severity: i.severity, // matches enum
            timestamp: i.tx_time,
            details: `Fraud Score: ${i.fraud_score}. Decision: ${i.decision}`,
            status: i.status === 'open' ? 'ACTIVE' : i.status === 'closed' ? 'RESOLVED' : 'INVESTIGATING'
        }));
        res.json(formatted);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Get Alerts (Global Feed)
app.get('/api/alerts', async (req, res) => {
    try {
        // Mapping basic alerts. 
        // Note: Real "SMS" content might be in a different table or features_json
        // For now, we show the system alerts.
        const [rows] = await pool.query(`
            SELECT 
                a.id, 
                a.severity, 
                a.created_at,
                p.fraud_score,
                p.explanation_json,
                up.phone
            FROM SIMFraudAlert a
            JOIN SIMFraudPredictionOutput p ON a.prediction_id = p.id
            JOIN SIMFraudTransaction t ON p.transaction_id = t.id
            JOIN SIMFraudUserProfile up ON t.user_id = up.id
            ORDER BY a.created_at DESC
            LIMIT 20
        `);

        const formatted = rows.map(a => ({
            id: a.id.toString(),
            sender: a.phone || 'Unknown',
            timestamp: a.created_at,
            originalText: `System Alert: Fraud Score ${a.fraud_score}`,
            riskScore: Math.round(a.fraud_score * 100),
            riskLevel: a.severity, // LOW, MEDIUM, HIGH
            reasoning: JSON.stringify(a.explanation_json) || 'AI Model Prediction',
            isAadhaarVerified: true
        }));
        res.json(formatted);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Analyze SMS (AI + DB)
app.post('/api/analyze', async (req, res) => {
    const { smsText, deviceContext, userId } = req.body;

    try {
        // 1. Get AI Analysis
        const analysis = await analyzeWithOllama(smsText, deviceContext || {});

        // 2. Simulate Transaction ID (In real app, we'd have a transaction first)
        // For this demo, we'll create a dummy transaction if one doesn't exist, 
        // OR just log the prediction directly if your schema allows null transaction.
        // YOUR SCHEMA: Prediction requires `transaction_id`.

        // Let's create a placeholder transaction for this SMS event
        const [txResult] = await pool.query(`
            INSERT INTO SIMFraudTransaction 
            (user_id, amount, channel, status, tx_time) 
            VALUES (?, 0.00, 'OTHER', 'initiated', NOW())
        `, [userId || 1]); // Default to user 1 if not provided

        const txId = txResult.insertId;

        // 3. Save Prediction
        const [predResult] = await pool.query(`
            INSERT INTO SIMFraudPredictionOutput
            (transaction_id, fraud_score, decision, features_json, explanation_json)
            VALUES (?, ?, ?, ?, ?)
        `, [
            txId,
            analysis.riskScore,
            analysis.riskLevel === 'CRITICAL' ? 'BLOCK' : 'ALLOW',
            JSON.stringify({ sms: smsText, context: deviceContext }),
            JSON.stringify(analysis.reasoning)
        ]);

        const predId = predResult.insertId;

        // 4. Create Alert if High Risk
        if (['HIGH', 'CRITICAL'].includes(analysis.riskLevel)) {
            await pool.query(`
                INSERT INTO SIMFraudAlert
                (prediction_id, severity, status)
                VALUES (?, ?, 'open')
            `, [predId, analysis.riskLevel]);
        }

        res.json({
            success: true,
            analysis: analysis,
            alertId: predId
        });

    } catch (err) {
        console.error("Analysis Endpoint Error:", err);
        res.status(500).json({ error: err.message });
    }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
