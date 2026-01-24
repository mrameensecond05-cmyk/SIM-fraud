const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const { analyzeWithOllama } = require('./aiService');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
app.use(cors());
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

        res.status(201).json({ message: "Registration successful", success: true });

    } catch (err) {
        await conn.rollback();
        console.error("Register Error:", err);
        res.status(500).json({ error: "Registration failed. Please try again." });
    } finally {
        conn.release();
    }
});

// Login Endpoint
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password required." });
    }

    try {
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

        // 2. Verify Password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid credentials." });
        }

        // 3. Return User Data (No Token for this MVP, just user object)
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

// --- OTP ROUTES ---

// Send OTP
app.post('/api/otp/send', async (req, res) => {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: "Phone number required" });

    try {
        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Save to DB with 5 min expiry
        await pool.query(`
            INSERT INTO SIMFraudOTP (phone_number, otp_code, expires_at)
            VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 5 MINUTE))
        `, [phone, otp]);

        // Mock SMS Sending
        console.log(`[MOCK SMS] OTP for ${phone} is: ${otp}`);

        res.json({ success: true, message: "OTP sent successfully" });
    } catch (err) {
        console.error("OTP Send Error:", err);
        res.status(500).json({ error: "Failed to send OTP" });
    }
});

// Verify OTP
app.post('/api/otp/verify', async (req, res) => {
    const { phone, otp } = req.body;
    if (!phone || !otp) return res.status(400).json({ error: "Phone and OTP required" });

    try {
        // Check for valid, non-expired, matching OTP
        const [rows] = await pool.query(`
            SELECT id FROM SIMFraudOTP 
            WHERE phone_number = ? 
            AND otp_code = ? 
            AND expires_at > NOW()
            AND is_verified = FALSE
            ORDER BY created_at DESC LIMIT 1
        `, [phone, otp]);

        if (rows.length === 0) {
            return res.status(400).json({ error: "Invalid or expired OTP" });
        }

        // Mark as verified
        await pool.query('UPDATE SIMFraudOTP SET is_verified = TRUE WHERE id = ?', [rows[0].id]);

        res.json({ success: true, message: "Phone number verified" });
    } catch (err) {
        console.error("OTP Verify Error:", err);
        res.status(500).json({ error: "Verification failed" });
    }
});

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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
