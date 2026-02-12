const mysql = require('mysql2/promise');
require('dotenv').config();

// --- CONFIGURATION ---
const SIMULATION_INTERVAL_MS = 5000; // New event every 5 seconds
const FRAUD_PROBABILITY = 0.3; // 30% chance of fraud scenario

// --- REALISTIC DATA POOLS ---
const LOCATIONS = [
    'Mumbai, Maharashtra', 'Delhi, NCR', 'Bangalore, Karnataka',
    'Hyderabad, Telangana', 'Chennai, Tamil Nadu', 'Pune, Maharashtra',
    'Kolkata, West Bengal', 'Ahmedabad, Gujarat', 'Jaipur, Rajasthan'
];

const MERCHANTS = [
    'Amazon India', 'Flipkart', 'Swiggy', 'Zomato', 'Uber India',
    'Ola Cabs', 'Reliance Jio', 'Airtel Payments', 'Paytm Mall',
    'Myntra', 'Nykaa', 'BigBasket', 'Blinkit'
];

const CHANNELS = ['UPI', 'NETBANKING', 'CREDIT_CARD', 'DEBIT_CARD', 'WALLET'];

const FRAUD_SCENARIOS = [
    {
        type: 'SIM_SWAP',
        reason: 'New SIM detected + High Value Transaction',
        severity: 'CRITICAL',
        riskScore: 0.95,
        decision: 'BLOCK'
    },
    {
        type: 'LOCATION_MISMATCH',
        reason: 'Transaction form unusual location (IP Mismatch)',
        severity: 'HIGH',
        riskScore: 0.85,
        decision: 'BLOCK'
    },
    {
        type: 'VELOCITY',
        reason: 'High frequency of transactions in short duration',
        severity: 'MEDIUM',
        riskScore: 0.65,
        decision: 'STEP_UP' // e.g. ask for OTP
    }
];

// --- DATABASE CONNECTION ---
const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'simtool',
    password: process.env.DB_PASSWORD || 'simtool',
    database: process.env.DB_NAME || 'simfraud_db',
    waitForConnections: true,
    connectionLimit: 5
});

// --- HELPER FUNCTIONS ---
const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];
const getRandomAmount = (min, max) => (Math.random() * (max - min) + min).toFixed(2);

async function getUsers(conn) {
    const [users] = await conn.query('SELECT id, name, phone, email FROM SIMFraudUserProfile');
    return users;
}

// --- SIMULATION LOGIC ---
async function simulateActivity() {
    console.log(`[${new Date().toISOString()}] Simulation Cycle Started...`);

    try {
        const users = await getUsers(pool);
        if (users.length === 0) {
            console.log("No users found. Please run seed script first.");
            return;
        }

        const targetUser = getRandomElement(users);
        const isFraud = Math.random() < FRAUD_PROBABILITY;

        let amount, merchant, channel, status, location;
        let fraudScenario = null;

        if (isFraud) {
            // FRAUD TRANSACTION
            fraudScenario = getRandomElement(FRAUD_SCENARIOS);
            amount = getRandomAmount(10000, 150000); // Higher amounts for fraud
            merchant = getRandomElement(MERCHANTS); // Can be normal merchant
            channel = 'NETBANKING'; // Common for high value
            status = fraudScenario.decision === 'BLOCK' ? 'blocked' : 'flagged';
            location = getRandomElement(LOCATIONS); // Could be mismatched

            console.log(`⚠️  GENERATING FRAUD: ${targetUser.name} | ${fraudScenario.type} | Rs.${amount}`);
        } else {
            // NORMAL TRANSACTION
            amount = getRandomAmount(50, 5000); // Lower realistic amounts
            merchant = getRandomElement(MERCHANTS);
            channel = getRandomElement(CHANNELS);
            status = 'approved';
            location = 'Home Location'; // Simplified

            console.log(`✅ GENERATING NORMAL: ${targetUser.name} | ${merchant} | Rs.${amount}`);
        }

        // 1. Insert Transaction
        const [txRes] = await pool.query(`
            INSERT INTO SIMFraudTransaction (user_id, amount, channel, status, timestamp)
            VALUES (?, ?, ?, ?, NOW())
        `, [targetUser.id, amount, channel, status]);

        const txId = txRes.insertId;

        // 2. Insert Prediction & Alert (Only if relevant, or record as 'safe' for normal)
        // Even normal transactions get analyzed in a real system
        const riskScore = isFraud ? fraudScenario.riskScore : 0.05;
        const decision = isFraud ? fraudScenario.decision : 'APPROVE';
        const explanation = isFraud
            ? [{ reason: fraudScenario.reason, weight: 0.9 }]
            : [{ reason: 'Normal usage pattern', weight: 0.1 }];

        const [predRes] = await pool.query(`
            INSERT INTO SIMFraudPredictionOutput 
            (transaction_id, fraud_score, decision, features_json, explanation_json, created_at)
            VALUES (?, ?, ?, ?, ?, NOW())
        `, [
            txId,
            riskScore,
            decision,
            JSON.stringify({ merchant, location, channel }),
            JSON.stringify(explanation)
        ]);

        // 3. Create Alert if Fraud
        if (isFraud) {
            await pool.query(`
                INSERT INTO SIMFraudAlert (prediction_id, severity, status, created_at)
                VALUES (?, ?, 'open', NOW())
            `, [predRes.insertId, fraudScenario.severity]);
        }

    } catch (err) {
        console.error("Simulation Attempt Failed:", err);
    }
}

// --- RUNNER ---
console.log("🚀 SIMTinel Live Traffic Simulator Started");
console.log("Press Ctrl+C to stop");

// Run immediately then interval
simulateActivity();
setInterval(simulateActivity, SIMULATION_INTERVAL_MS);
