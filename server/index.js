const express = require('express');
const cors = require('cors');
const { analyzeWithOllama } = require('./aiService');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const { sendSimulatedSMS, getRemainingQuota } = require('./smsService');

// Connect to MongoDB
require('./db');

// Import Models
const Role = require('./models/Role');
const Login = require('./models/Login');
const UserProfile = require('./models/UserProfile');
const SIMEvent = require('./models/SIMEvent');
const Transaction = require('./models/Transaction');
const PredictionOutput = require('./models/PredictionOutput');
const Alert = require('./models/Alert');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const path = require('path');

// Request Logging Middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// --- STATIC FILES ---
app.use('/api/download', express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public/web')));

// Catch-all for React (must be last or after APIs)
app.get(new RegExp('.*'), (req, res, next) => {
    if (req.path.startsWith('/api')) {
        return next();
    }
    res.sendFile(path.join(__dirname, 'public/web', 'index.html'));
});

// --- SEEDING ---

async function seedRoles() {
    try {
        const count = await Role.countDocuments();
        if (count === 0) {
            console.log('Seeding Roles...');
            await Role.insertMany([{ role_name: 'USER' }, { role_name: 'ADMIN' }]);
        }
        await seedAdmin();
    } catch (err) {
        console.error('Role Seeding Error:', err);
    }
}

async function seedAdmin() {
    try {
        const existing = await Login.findOne({ email: 'admin@simtinel.com' });
        if (!existing) {
            console.log('Seeding Default Admin...');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('admin123', salt);

            const adminRole = await Role.findOne({ role_name: 'ADMIN' });
            if (!adminRole) return;

            const login = await Login.create({
                email: 'admin@simtinel.com',
                password_hash: hashedPassword,
                role: adminRole._id
            });

            await UserProfile.create({
                login: login._id,
                name: 'System Admin',
                email: 'admin@simtinel.com'
            });

            console.log('Default Admin Created: admin@simtinel.com / admin123');
        }
    } catch (err) {
        console.error('Admin Seeding Error:', err);
    }
}

// Seed after DB connection stabilises
setTimeout(seedRoles, 3000);

// --- AUTH ROUTES ---

// Register Endpoint
app.post('/api/register', async (req, res) => {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    try {
        // 1. Check if user exists
        const existing = await Login.findOne({ email });
        if (existing) {
            return res.status(409).json({ error: 'Email already registered.' });
        }

        // 2. Hash Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Get USER Role
        const userRole = await Role.findOne({ role_name: 'USER' });
        const roleId = userRole?._id;

        // 4. Create Login
        const login = await Login.create({
            email,
            phone_number: phone || null,
            password_hash: hashedPassword,
            role: roleId
        });

        // 5. Create Profile
        await UserProfile.create({
            login: login._id,
            name,
            email,
            phone: phone || null
        });

        // 6. Simulated SMS
        try {
            if (phone) {
                await sendSimulatedSMS(phone, `Welcome ${name}! Your SIMTinel account is active. OTP: 123456. Stay protected.`);
            }
        } catch (smsErr) {
            console.error('Simulation SMS Error:', smsErr);
        }

        res.status(201).json({ message: 'Registration successful', success: true });

    } catch (err) {
        console.error('Register Error:', err);
        res.status(500).json({ error: 'Registration failed. Please try again.' });
    }
});

// Login Endpoint
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    console.log('LOGIN API CALLED. Body:', req.body);

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required.' });
    }

    try {
        console.log('Searching for user:', email);

        // Find Login + populate role
        const login = await Login.findOne({ email }).populate('role');
        if (!login) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        // Find UserProfile
        const profile = await UserProfile.findOne({ login: login._id });

        console.log('User Found:', login._id, login.role?.role_name);

        // Verify Password
        console.log('Verifying password...');
        const isMatch = await bcrypt.compare(password, login.password_hash);
        console.log('Password match result:', isMatch);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        console.log('Login Successful. Sending response.');
        res.json({
            success: true,
            user: {
                id: profile?._id?.toString() || login._id.toString(),
                name: profile?.name || 'User',
                email: email,
                role: login.role?.role_name || 'USER',
                loginId: login._id.toString()
            }
        });

    } catch (err) {
        console.error('Login Error:', err);
        res.status(500).json({ error: 'Login failed.' });
    }
});

// Device Registration / SIM Context Endpoint
app.post('/api/user/device', async (req, res) => {
    const { userId, imei, location } = req.body;

    if (!userId || !imei) {
        return res.status(400).json({ error: 'User ID and IMEI required.' });
    }

    try {
        // Get last known SIM Event for this user
        const lastEvent = await SIMEvent.findOne({ user: userId }).sort({ timestamp: -1 });
        const lastImei = lastEvent?.new_imei;
        let eventType = 'new_sim';

        if (lastImei) {
            if (lastImei !== imei) {
                eventType = 'imei_change';
                console.warn(`[SIM SWAP DETECTED] User ${userId} changed IMEI from ${lastImei} to ${imei}`);
            } else {
                return res.json({ success: true, message: 'Device verified', status: 'unchanged' });
            }
        }

        // Insert new event
        await SIMEvent.create({
            user: userId,
            event_type: eventType,
            old_imei: lastImei || null,
            new_imei: imei,
            location: location || 'Unknown'
        });

        res.json({ success: true, message: 'Device registered', status: eventType });

    } catch (err) {
        console.error('Device Reg Error:', err);
        res.status(500).json({ error: 'Failed to register device.' });
    }
});

// --- DASHBOARD ROUTES ---

// Get Stats for Dashboard
app.get('/api/stats', async (req, res) => {
    try {
        const totalUsers = await UserProfile.countDocuments();

        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const threatsBlockedToday = await PredictionOutput.countDocuments({
            decision: 'BLOCK',
            created_at: { $gte: yesterday }
        });

        const activeThreats = await Alert.countDocuments({
            status: { $in: ['open', 'in_review'] }
        });

        res.json({
            totalUsers,
            threatsBlockedToday,
            activeThreats,
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
        const profiles = await UserProfile.find()
            .populate({ path: 'login', populate: { path: 'role' } });

        const formatted = profiles.map(u => ({
            id: u._id.toString(),
            name: u.name,
            email: u.email,
            status: 'ACTIVE',
            riskScore: 0,
            lastActive: u.created_at,
            role: u.login?.role?.role_name || 'USER'
        }));

        res.json(formatted);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Get Incidents (Alerts + Predictions + Transactions + Users)
app.get('/api/incidents', async (req, res) => {
    try {
        const alerts = await Alert.find()
            .sort({ created_at: -1 })
            .limit(50)
            .populate({
                path: 'prediction',
                populate: {
                    path: 'transaction',
                    populate: { path: 'user' }
                }
            });

        const formatted = alerts.map(a => {
            const pred = a.prediction;
            const tx = pred?.transaction;
            const user = tx?.user;
            return {
                id: a._id.toString(),
                userId: user?._id?.toString() || '',
                userName: user?.name || 'Unknown',
                type: pred?.decision === 'BLOCK' ? 'FRAUD_BLOCKED' : 'ALERT_FLAGGED',
                severity: a.severity,
                timestamp: tx?.tx_time || a.created_at,
                details: `Fraud Score: ${pred?.fraud_score}. Decision: ${pred?.decision}`,
                status: a.status === 'open' ? 'ACTIVE' : a.status === 'closed' ? 'RESOLVED' : 'INVESTIGATING'
            };
        });

        res.json(formatted);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Get Alerts (Global Feed)
app.get('/api/alerts', async (req, res) => {
    try {
        const alerts = await Alert.find()
            .sort({ created_at: -1 })
            .limit(20)
            .populate({
                path: 'prediction',
                populate: {
                    path: 'transaction',
                    populate: { path: 'user' }
                }
            });

        const formatted = alerts.map(a => {
            const pred = a.prediction;
            const user = pred?.transaction?.user;
            return {
                id: a._id.toString(),
                sender: user?.phone || 'Unknown',
                timestamp: a.created_at,
                originalText: `System Alert: Fraud Score ${pred?.fraud_score}`,
                riskScore: Math.round((pred?.fraud_score || 0) * 100),
                riskLevel: a.severity,
                reasoning: JSON.stringify(pred?.explanation_json) || 'AI Model Prediction',
                isAadhaarVerified: true
            };
        });

        res.json(formatted);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// --- ANALYZE SMS ---
app.post('/api/analyze', async (req, res) => {
    const { smsText, deviceContext, userId } = req.body;

    try {
        // 1. Parse amount from SMS
        const amountRegex = /(?:Rs\.?|INR|₹)\s*([\d,]+(?:\.\d{2})?)/i;
        const match = smsText ? smsText.match(amountRegex) : null;
        const parsedAmount = match ? parseFloat(match[1].replace(/,/g, '')) : 0.00;

        // Get default user if none provided
        let targetUser = userId;
        if (!targetUser) {
            const firstProfile = await UserProfile.findOne();
            targetUser = firstProfile?._id;
        }

        // 2. Create Transaction
        const tx = await Transaction.create({
            user: targetUser,
            amount: parsedAmount,
            channel: 'OTHER',
            status: 'initiated'
        });

        // 3. AI Analysis
        const { analyzeFraud } = require('./aiService');
        const analysis = await analyzeFraud(tx._id.toString());

        // 4. Save Prediction
        const pred = await PredictionOutput.create({
            transaction: tx._id,
            fraud_score: analysis.risk_score || 0,
            decision: analysis.decision || 'BLOCK',
            features_json: { sms: smsText, context: deviceContext },
            explanation_json: analysis.reasons || []
        });

        // 5. Create Alert if High Risk
        if (['HIGH', 'CRITICAL'].includes(analysis.risk_level)) {
            await Alert.create({
                prediction: pred._id,
                severity: analysis.risk_level,
                status: 'open'
            });
        }

        res.json({ success: true, analysis, alertId: pred._id.toString() });

    } catch (err) {
        console.error('Analysis Endpoint Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// --- SIMULATION ENDPOINT ---

app.post('/api/simulate/alert', async (req, res) => {
    let { phone, userId } = req.body;

    // Auto-target latest user if none given
    if (!userId && !phone) {
        try {
            const latest = await UserProfile.findOne({ phone: { $ne: null } }).sort({ _id: -1 });
            if (latest) {
                userId = latest._id.toString();
                phone = latest.phone;
                console.log(`[SIMULATION] Auto-targeting latest user: ${latest.name} (${phone})`);
            } else {
                return res.status(404).json({ error: 'No registered users with phone numbers found' });
            }
        } catch (err) {
            return res.status(500).json({ error: 'Failed to find latest user' });
        }
    }

    try {
        // 1. Resolve User
        let targetProfile;
        if (userId) {
            targetProfile = await UserProfile.findById(userId);
        } else {
            targetProfile = await UserProfile.findOne({ phone });
        }

        if (!targetProfile) {
            return res.status(404).json({ error: 'User not found' });
        }

        const targetUserId = targetProfile._id;
        const targetPhone = targetProfile.phone || phone;
        const targetName = targetProfile.name;

        console.log(`[SIMULATION] Starting Fraud Scenario for User ${targetUserId} (${targetName})`);

        // 2. Simulate SIM Swap (IMEI Change)
        const lastEvent = await SIMEvent.findOne({ user: targetUserId }).sort({ timestamp: -1 });
        const oldImei = lastEvent?.new_imei || '111111111111111';
        const newImei = '999999999999999';

        await SIMEvent.create({
            user: targetUserId,
            event_type: 'imei_change',
            old_imei: oldImei,
            new_imei: newImei,
            location: 'Unknown (Simulated)'
        });
        console.log('[SIMULATION] Step 1: SIM Swap Event Created');

        // 3. Simulate Suspicious Transaction
        const tx = await Transaction.create({
            user: targetUserId,
            amount: 50000.00,
            channel: 'NETBANKING',
            status: 'initiated'
        });
        console.log(`[SIMULATION] Step 2: Transaction Created (ID: ${tx._id})`);

        // 4. AI Analysis
        const { analyzeFraud } = require('./aiService');
        const analysis = await analyzeFraud(tx._id.toString());
        console.log(`[SIMULATION] Step 3: AI Analysis Complete (Risk: ${analysis.risk_level})`);

        // 5. Save Prediction + Alert
        const pred = await PredictionOutput.create({
            transaction: tx._id,
            fraud_score: analysis.risk_score || 0.95,
            decision: analysis.decision || 'BLOCK',
            features_json: { simulated: true },
            explanation_json: analysis.reasons || []
        });

        await Alert.create({
            prediction: pred._id,
            severity: analysis.risk_level || 'HIGH',
            status: 'open'
        });

        // 6. Send Alert SMS
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
            message: 'Simulation Complete',
            steps: [
                'SIM Swap Event Created',
                'Suspicious Transaction Created',
                'AI Analysis Performed',
                'Alert SMS Sent'
            ],
            analysis
        });

    } catch (err) {
        console.error('Simulation Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// --- SMS Quota ---
app.get('/api/sms/quota', (req, res) => {
    res.json({ remaining: getRemainingQuota(), limit: 3 });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT} and accepting all connections (0.0.0.0)`));
