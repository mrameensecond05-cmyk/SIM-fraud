const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const { analyzeWithOllama } = require('./aiService');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const { sendSimulatedSMS, getRemainingQuota } = require('./smsService');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

// Request Logging Middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

const pool = require('./db');

const path = require('path');

// --- API ROUTES ---
// --- API ROUTES ---
app.use('/api/download', express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public/web')));

// Catch-all for React (must be last or after APIs)
app.get(new RegExp('.*'), (req, res, next) => {
    if (req.path.startsWith('/api')) {
        return next();
    }
    res.sendFile(path.join(__dirname, 'public/web', 'index.html'));
});

// --- AUTH ROUTES ---

// Helper: Seed Roles if empty
async function seedRoles() {
    try {
        const [rows] = await pool.query('SELECT COUNT(*) as count FROM SIMFraudRole');
        if (rows[0].count === 0) {
            console.log("Seeding Roles...");
            await pool.query("INSERT INTO SIMFraudRole (role_name) VALUES ('USER'), ('ADMIN')");
        }
        seedAdmin(); // Chain the admin seed
    } catch (err) {
        console.error("Role Seeding Error:", err);
    }
    await seedAdmin(); // Always check/seed admin
}

async function seedAdmin() {
    try {
        const [rows] = await pool.query("SELECT id FROM SIMFraudLogin WHERE email = 'admin@simtinel.com'");
        if (rows.length === 0) {
            console.log("Seeding Default Admin...");
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('admin123', salt);

            // Get Admin Role ID
            const [roles] = await pool.query("SELECT id FROM SIMFraudRole WHERE role_name = 'ADMIN'");
            const roleId = roles[0]?.id;

            if (roleId) {
                const [res] = await pool.query(`
                    INSERT INTO SIMFraudLogin (email, password_hash, role_id)
                    VALUES ('admin@simtinel.com', ?, ?)
                `, [hashedPassword, roleId]);

                await pool.query(`
                    INSERT INTO SIMFraudUserProfile (login_id, name, email)
                    VALUES (?, 'System Admin', 'admin@simtinel.com')
                `, [res.insertId]);
                console.log("Default Admin Created: admin@simtinel.com / admin123");
            }
        }
    } catch (err) {
        console.error("Admin Seeding Error:", err);
    }
}
seedRoles();

// Register Endpoint
app.post('/api/register', async (req, res) => {
    const { name, email, phone, password } = req.body;

    // Basic Validation
    if (!name || !email || !password) {
        return res.status(400).json({ error: "Name, email, and password are required." });
    }

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // 1. Check if user exists
        const [existing] = await conn.query('SELECT id FROM SIMFraudLogin WHERE email = ?', [email]);
        if (existing.length > 0) {
            await conn.rollback();
            return res.status(409).json({ error: "Email already registered." });
        }

        // 2. Hash Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Get USER Role ID
        const [roles] = await conn.query("SELECT id FROM SIMFraudRole WHERE role_name = 'USER'");
        const roleId = roles[0]?.id || 1; // Default to 1 if not found

        // 4. Create Login
        const [loginResult] = await conn.query(`
            INSERT INTO SIMFraudLogin (email, phone_number, password_hash, role_id)
            VALUES (?, ?, ?, ?)
        `, [email, phone || null, hashedPassword, roleId]);

        const loginId = loginResult.insertId;

        // 5. Create Profile
        await conn.query(`
            INSERT INTO SIMFraudUserProfile (login_id, name, email, phone)
            VALUES (?, ?, ?, ?)
        `, [loginId, name, email, phone || null]);

        await conn.commit();

        // --- SIMULATED SMS FLOW (Single SMS to conserve quota) ---
        try {
            if (phone) {
                await sendSimulatedSMS(phone, `Welcome ${name}! Your SIMTinel account is active. OTP: 123456. Stay protected.`);
            }
        } catch (smsErr) {
            console.error("Simulation SMS Error:", smsErr);
        }

        res.status(201).json({ message: "Registration successful", success: true });

    } catch (err) {
        await conn.rollback();
        console.error("Register Error:", err);
        require('fs').appendFileSync('error.log', `Register Error: ${err.stack}\n`);
        res.status(500).json({ error: "Registration failed. Please try again." });
    } finally {
        conn.release();
    }
});

// Login Endpoint
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    console.log("LOGIN API CALLED. Body:", req.body);

    if (!email || !password) {
        console.log("Missing credentials");
        return res.status(400).json({ error: "Email and password required." });
    }

    try {
        console.log("Searching for user:", email);
        // 1. Find User by Email
        const [users] = await pool.query(`
            SELECT l.id as login_id, l.password_hash, l.role_id, r.role_name, p.name, p.id as profile_id
            FROM SIMFraudLogin l
            JOIN SIMFraudRole r ON l.role_id = r.id
            LEFT JOIN SIMFraudUserProfile p ON l.id = p.login_id
            WHERE l.email = ?
        `, [email]);

        if (users.length === 0) {
            return res.status(401).json({ error: "Invalid credentials." });
        }

        const user = users[0];
        console.log("User Found:", user.login_id, user.role_name);

        // 2. Verify Password
        console.log("Verifying password...");
        const isMatch = await bcrypt.compare(password, user.password_hash);
        console.log("Password match result:", isMatch);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid credentials." });
        }

        // 3. Return User Data (No Token for this MVP, just user object)
        console.log("Login Successful relative to DB. Sending response.");
        res.json({
            success: true,
            user: {
                id: user.profile_id,
                name: user.name || 'User',
                email: email,
                role: user.role_name,
                loginId: user.login_id
            }
        });

    } catch (err) {
        console.error("Login Error:", err);
        try {
            require('fs').appendFileSync('/tmp/simfraud_error.log', `Login Error: ${err.message}\nStack: ${err.stack}\n`);
        } catch (e) {
            console.error("Failed to write log:", e);
        }
        res.status(500).json({ error: "Login failed." });
    }
});

// Device Registration / SIM Context Endpoint
app.post('/api/user/device', async (req, res) => {
    const { userId, imei, location } = req.body;

    if (!userId || !imei) {
        return res.status(400).json({ error: "User ID and IMEI required." });
    }

    try {
        // 1. Get last known SIM Event for this user
        const [rows] = await pool.query(`
            SELECT new_imei 
            FROM SIMFraudSIMEvent 
            WHERE user_id = ? 
            ORDER BY timestamp DESC LIMIT 1
        `, [userId]);

        const lastImei = rows[0]?.new_imei;
        let eventType = 'new_sim';

        if (lastImei) {
            if (lastImei !== imei) {
                eventType = 'imei_change'; // Potentially a SIM swap or device change
                console.warn(`[SIM SWAP DETECTED] User ${userId} changed IMEI from ${lastImei} to ${imei}`);
            } else {
                // Same IMEI, no new event needed unless we track periodic heartbeats. 
                // For now, let's just update the timestamp or return success.
                return res.json({ success: true, message: "Device verified", status: "unchanged" });
            }
        }

        // 2. Insert new event
        await pool.query(`
            INSERT INTO SIMFraudSIMEvent (user_id, event_type, old_imei, new_imei, location, timestamp)
            VALUES (?, ?, ?, ?, ?, NOW())
        `, [userId, eventType, lastImei || null, imei, location || 'Unknown']);

        res.json({ success: true, message: "Device registered", status: eventType });

    } catch (err) {
        console.error("Device Reg Error:", err);
        res.status(500).json({ error: "Failed to register device." });
    }
});


// --- OTP ROUTES REMOVED ---

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
// Analyze SMS (AI + DB)
app.post('/api/analyze', async (req, res) => {
    const { smsText, deviceContext, userId } = req.body;

    try {
        // 1. Create Placeholder Transaction (Required for AI context)
        // Parse Amount from SMS if possible
        const amountRegex = /(?:Rs\.?|INR|₹)\s*([\d,]+(?:\.\d{2})?)/i;
        const match = smsText ? smsText.match(amountRegex) : null;
        const parsedAmount = match ? parseFloat(match[1].replace(/,/g, '')) : 0.00;

        // In a real app, the transaction would theoretically exist before fraud check,
        // or be created here as part of the flow.
        const [txResult] = await pool.query(`
            INSERT INTO SIMFraudTransaction 
            (user_id, amount, channel, status, timestamp) 
            VALUES (?, ?, 'OTHER', 'initiated', NOW())
        `, [userId || 1, parsedAmount]); // Default to user 1 if not provided

        const txId = txResult.insertId;

        // 2. Get AI Analysis (Advanced Context-Aware)
        const { analyzeFraud } = require('./aiService');
        const analysis = await analyzeFraud(txId);

        // 3. Save Prediction (SIMFraudPredictionOutput)
        // Mapping new keys from Ollama JSON: risk_score, decision, risk_level
        const [predResult] = await pool.query(`
            INSERT INTO SIMFraudPredictionOutput
            (transaction_id, fraud_score, decision, features_json, explanation_json)
            VALUES (?, ?, ?, ?, ?)
        `, [
            txId,
            analysis.risk_score || 0,
            analysis.decision || 'BLOCK', // Default if undefined
            JSON.stringify({ sms: smsText, context: deviceContext }),
            JSON.stringify(analysis.reasons || [])
        ]);

        const predId = predResult.insertId;

        // 4. Create Alert if High Risk
        if (['HIGH', 'CRITICAL'].includes(analysis.risk_level)) {
            await pool.query(`
                INSERT INTO SIMFraudAlert
                (prediction_id, severity, status)
                VALUES (?, ?, 'open')
            `, [predId, analysis.risk_level]);
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

// --- SIMULATION ENDPOINTS ---

/**
 * Trigger a simulated Fraud Alert flow.
 * 1. Simulates an IMEI change (SIM Swap).
 * 2. Simulates a Transaction.
 * 3. Triggers AI Analysis.
 * 4. Sends Alert SMS.
 */
app.post('/api/simulate/alert', async (req, res) => {
    let { phone, userId } = req.body;

    // If no phone/userId provided, auto-target the latest registered user
    if (!userId && !phone) {
        try {
            const [latest] = await pool.query(
                "SELECT p.id, p.phone, p.name FROM SIMFraudUserProfile p WHERE p.phone IS NOT NULL ORDER BY p.id DESC LIMIT 1"
            );
            if (latest.length > 0) {
                userId = latest[0].id;
                phone = latest[0].phone;
                console.log(`[SIMULATION] Auto-targeting latest user: ${latest[0].name} (${phone})`);
            } else {
                return res.status(404).json({ error: "No registered users with phone numbers found" });
            }
        } catch (err) {
            return res.status(500).json({ error: "Failed to find latest user" });
        }
    }

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // 1. Resolve User
        let targetUserId = userId;
        let targetPhone = phone;
        let targetName = 'Unknown';

        if (!targetUserId) {
            const [users] = await conn.query("SELECT id, name FROM SIMFraudUserProfile WHERE phone = ?", [phone]);
            if (users.length === 0) {
                await conn.rollback();
                return res.status(404).json({ error: "User not found with that phone" });
            }
            targetUserId = users[0].id;
            targetName = users[0].name;
        } else {
            const [users] = await conn.query("SELECT phone, name FROM SIMFraudUserProfile WHERE id = ?", [targetUserId]);
            if (users.length > 0) {
                targetPhone = users[0].phone;
                targetName = users[0].name;
            }
        }

        console.log(`[SIMULATION] Starting Fraud Scenario for User ${targetUserId} (${targetName})`);

        // 2. Simulate SIM Swap (IMEI Change)
        // We look for the last event and just change the IMEI
        const [lastEvent] = await conn.query("SELECT new_imei FROM SIMFraudSIMEvent WHERE user_id = ? ORDER BY timestamp DESC LIMIT 1", [targetUserId]);
        const oldImei = lastEvent[0]?.new_imei || '111111111111111';
        const newImei = '999999999999999'; // Simulated Attacker IMEI

        await conn.query(`
            INSERT INTO SIMFraudSIMEvent (user_id, event_type, old_imei, new_imei, location, timestamp)
            VALUES (?, 'imei_change', ?, ?, 'Unknown (Simulated)', NOW())
        `, [targetUserId, oldImei, newImei]);

        console.log(`[SIMULATION] Step 1: SIM Swap Event Created`);

        // 3. Simulate Suspicious Transaction
        const [txRes] = await conn.query(`
            INSERT INTO SIMFraudTransaction (user_id, amount, channel, status, timestamp)
            VALUES (?, 50000.00, 'NETBANKING', 'initiated', NOW())
        `, [targetUserId]);
        const txId = txRes.insertId;

        console.log(`[SIMULATION] Step 2: Transaction Created (ID: ${txId})`);

        await conn.commit(); // Commit data so AI service can read it
        conn.release(); // Release early

        // 4. Trigger AI Analysis
        // We use the imported analyzeFraud function directly
        const { analyzeFraud } = require('./aiService');
        const analysis = await analyzeFraud(txId);

        console.log(`[SIMULATION] Step 3: AI Analysis Complete (Risk: ${analysis.risk_level})`);

        // 5. Send Alert SMS (Random from pool of realistic messages)
        if (targetPhone) {
            const alertMessages = [
                `ALERT: SIM swap detected on ${targetPhone}. Rs.50,000 transaction blocked. Call 1800-SIMTINEL if not you.`,
                `SIMTinel: Unusual login from new device IMEI:999999. Your account is temporarily locked for safety.`,
                `WARNING: Your SIM card was changed. A Rs.50,000 transfer was attempted. Reply STOP to block.`,
                `FRAUD ALERT: Suspicious activity on your account. New device detected. Contact support immediately.`,
                `SIMTinel Security: SIM swap attempt detected. Transaction of Rs.50,000 has been held for verification.`,
                `URGENT: Your number ${targetPhone} was ported to a new SIM. All transactions are paused. Call support.`,
                `SIMTinel: High-risk transaction blocked. New IMEI detected on your account. Verify identity to proceed.`,
                `ALERT: Identity mismatch detected. A device change + Rs.50,000 transfer flagged as suspicious.`,
                `SIMTinel Fraud Shield: SIM change + large transaction detected. Account frozen pending review.`,
                `SECURITY: Your SIM was swapped. Unauthorized Rs.50,000 NETBANKING attempt blocked by SIMTinel AI.`
            ];
            const alertMsg = alertMessages[Math.floor(Math.random() * alertMessages.length)];
            await sendSimulatedSMS(targetPhone, alertMsg);
        }

        res.json({
            success: true,
            message: "Simulation Complete",
            steps: [
                "SIM Swap Event Created",
                "Suspicious Transaction Created",
                "AI Analysis Performed",
                "Alert SMS Sent"
            ],
            analysis: analysis
        });

    } catch (err) {
        if (conn) conn.release();
        console.error("Simulation Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// --- SMS Quota Endpoint ---
app.get('/api/sms/quota', (req, res) => {
    res.json({ remaining: getRemainingQuota(), limit: 3 });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT} and accepting all connections (0.0.0.0)`));
