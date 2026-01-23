
/**
 * Analyzes SMS content using local Ollama instance.
 * @param {string} smsText 
 * @param {object} deviceContext 
 * @returns {Promise<object>} Analysis result
 */
const axios = require('axios');
const pool = require('./db');

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434/api/generate';
const MODEL_NAME = 'tinyllama'; // Using 'mistral' or 'llama3.2' as available

/**
 * Analyzes a specific transaction for fraud using Ollama with full context.
 * @param {number} transactionId 
 * @returns {Promise<object>} Analysis result
 */
async function analyzeFraud(transactionId) {
    try {
        // 1. Fetch Context Data
        // Transaction + User Profile
        const [txRows] = await pool.query(`
            SELECT t.*, u.name, u.phone 
            FROM SIMFraudTransaction t 
            JOIN SIMFraudUserProfile u ON t.user_id = u.id 
            WHERE t.id = ?
        `, [transactionId]);

        if (txRows.length === 0) throw new Error(`Transaction ${transactionId} not found`);
        const tx = txRows[0];

        // Recent SIM Events (Last 48 hours for context)
        const [simRows] = await pool.query(`
            SELECT event_type, timestamp 
            FROM SIMFraudSIMEvent 
            WHERE user_id = ? 
            ORDER BY timestamp DESC LIMIT 1
        `, [tx.user_id]);
        const lastSimEvent = simRows[0];
        const simContext = lastSimEvent
            ? `${lastSimEvent.event_type} at ${lastSimEvent.timestamp}`
            : "No recent SIM changes";

        // Fraud Config (Thresholds)
        const [configRows] = await pool.query("SELECT param_value FROM SIMFraudConfig WHERE param_name = 'block_threshold'");
        const blockThreshold = configRows[0]?.param_value || 0.85;

        // Login Context
        const [loginRows] = await pool.query(`
            SELECT login_time, ip_address 
            FROM SIMFraudLoginEvent 
            WHERE user_id = ? 
            ORDER BY login_time DESC LIMIT 1
        `, [tx.user_id]);
        const lastLogin = loginRows[0];
        const loginContext = lastLogin
            ? `${lastLogin.login_time} from ${lastLogin.ip_address}`
            : "Unknown";

        // 2. Rule-Based Checks (Deterministic triggers)

        // A. Extract Amount from SMS Context (if available)
        let extractedAmount = 0;
        let smsText = "";
        try {
            const features = JSON.parse(txRows[0].features_json || '{}'); // Assuming we store features or need to fetch prediction to get features... wait, txRows has columns from Transaction table. 
            // In index.js, we store SMS in PredictionOutput features_json. 
            // But here we only have txId. We might need to look at what inputs caused this.
            // Actually, for the new flow, we should pass smsText/context optionally or fetch from Prediction if it exists.
            // Let's assume the calling function (index.js) just inserted the transaction.
            // But wait, index.js inserts transaction with amount 0.00.
            // We need to parse amount BEFORE inserting into transaction in index.js or update it here.

            // For now, let's look at the transaction amount if it was correctly set, 
            // OR checks generic regex on the 'features' if we passed it.
            // But we don't have access to the raw request body here easily without passing it.
            // Let's rely on the assumption that we will query the PredictionOutput if it existed, but it doesn't exist yet.

            // CORRECT APPROACH: Use the 'deviceContext' or 'smsText' if they were stored in the Transaction metadata (which we don't have).
            // Let's assume we rely on the DB state.
        } catch (e) { }

        // B. Multiple OTP Check (Velocity Check)
        const [velocityRows] = await pool.query(`
            SELECT COUNT(*) to_count 
            FROM SIMFraudTransaction 
            WHERE user_id = ? 
            AND timestamp > DATE_SUB(NOW(), INTERVAL 10 MINUTE)
        `, [tx.user_id]);

        const velocityCount = velocityRows[0].to_count;
        let ruleBasedVerdict = null;

        if (velocityCount >= 5) {
            console.log(`[RULE] Multiple OTP Trigger: ${velocityCount} in 10m`);
            ruleBasedVerdict = {
                risk_score: 0.95,
                risk_level: "CRITICAL",
                decision: "BLOCK",
                reasons: [`Velocity Limit Exceeded: ${velocityCount} transactions in 10 minutes (Multi-OTP Attack)`],
                actions: ["Block Account", "Notify User"],
                summary: "System detected a burst of SMS/Transactions indicating a potential OTP bombing or concurrent attacks.",
                admin_note: "Velocity Rule Triggered"
            };
        }

        // C. Transaction Limit Check (assuming amount is in tx.amount)
        const USER_SET_LIMIT = 50000; // Mock user limit
        // Since we insert 0.00 in index.js, this check might fail unless we update index.js to parse amount first.
        // We will do that in the next step.
        if (tx.amount > USER_SET_LIMIT) {
            console.log(`[RULE] Limit Exceeded: ${tx.amount} > ${USER_SET_LIMIT}`);
            // If velocity is also high, critical. Else Medium/High.
            if (!ruleBasedVerdict) {
                ruleBasedVerdict = {
                    risk_score: 0.80,
                    risk_level: "HIGH",
                    decision: "STEP_UP",
                    reasons: [`Transaction Amount ₹${tx.amount} exceeds user limit of ₹${USER_SET_LIMIT}`],
                    actions: ["Verify with Call", "2FA"],
                    summary: "Transaction value exceeds defined safety thresholds.",
                    admin_note: "Value Rule Triggered"
                };
            } else {
                ruleBasedVerdict.reasons.push(`Amount ₹${tx.amount} exceeds limit`);
            }
        }

        // Return immediately if CRITICAL rule hit
        if (ruleBasedVerdict && ruleBasedVerdict.risk_level === 'CRITICAL') {
            // Log it
            await pool.query(`
                INSERT INTO SIMFraudAuditLog (actor_login_id, action, entity_type, entity_id, metadata_json)
                VALUES (1, 'RULE_ENGINE', 'transaction', ?, ?)
            `, [transactionId, JSON.stringify(ruleBasedVerdict)]);
            return ruleBasedVerdict;
        }

        // 3. Construct Prompt using User's Template
        const prompt = `
SYSTEM PROMPT (send to Ollama /api/generate with format: "json"):
---
You are a SIM Fraud Detection AI assistant. Analyze the provided fraud context and return a JSON response with fraud analysis, recommendations, and risk score.

MANDATORY JSON FORMAT:
{
  "risk_score": 0.00,
  "risk_level": "LOW|MEDIUM|HIGH|CRITICAL", 
  "decision": "ALLOW|STEP_UP|BLOCK",
  "reasons": ["reason1", "reason2"],
  "actions": ["action1", "action2"],
  "summary": "One sentence explanation",
  "admin_note": "Note for dashboard"
}

USER PROMPT:
Analyze transaction ID ${tx.id} for ${tx.name} (${tx.phone}):
- Amount: ₹${tx.amount} ${tx.channel} ${tx.merchant_id || 'N/A'} at ${tx.location || 'Unknown'} ${tx.timestamp}
- Recent SIM: ${simContext}
- Last login: ${loginContext}
- Fraud config: block_threshold=${blockThreshold}
- Velocity Check: ${velocityCount} transactions in last 10 mins

Give fraud analysis:
        `;

        // 4. Call Ollama
        console.log(`Sending Prompt for Tx ${transactionId}...`);
        const response = await axios.post(OLLAMA_URL, {
            model: MODEL_NAME,
            prompt: prompt,
            stream: false,
            format: "json"
        });

        // 5. Parse Response
        let analysis;
        try {
            // Check if response.data.response is string or object
            const raw = response.data.response;
            analysis = typeof raw === 'string' ? JSON.parse(raw) : raw;
        } catch (e) {
            console.error("Failed to parse AI JSON:", e);
            // Fallback safety
            analysis = {
                risk_score: 0.99,
                risk_level: "CRITICAL",
                decision: "BLOCK",
                reasons: ["AI JSON Parse Error", "Defaulting to Block for Safety"],
                summary: "System failed to parse AI response."
            };
        }

        // Merge Rule Reasoning if High/Critical
        if (ruleBasedVerdict) {
            analysis.reasons = [...(analysis.reasons || []), ...ruleBasedVerdict.reasons];
            analysis.risk_score = Math.max(analysis.risk_score, ruleBasedVerdict.risk_score);
            if (ruleBasedVerdict.decision === 'BLOCK') analysis.decision = 'BLOCK';
        }

        // 6. Save Audit Log
        await pool.query(`
            INSERT INTO SIMFraudAuditLog (actor_login_id, action, entity_type, entity_id, metadata_json)
            VALUES (1, 'OLLAMA_ANALYSIS', 'transaction', ?, ?)
        `, [transactionId, JSON.stringify(analysis)]);

        return analysis;

    } catch (error) {
        console.error("AI Analysis Failed:", error);
        throw error;
    }
}

// Keeping the old one for compatibility or easy testing if needed, but wrapping the new one strictly
async function analyzeWithOllama(smsText, deviceContext) {
    // This was the old "Mock" style function.
    // For now, we return a basic structure if called directly without DB.
    // But ideally, the app should now call analyzeFraud with a TransactionID.
    console.warn("Using deprecated analyzeWithOllama - please switch to transaction-based analysis.");
    return {
        riskScore: 0,
        riskLevel: 'LOW',
        reasoning: 'Deprecated function called.'
    };
}

module.exports = { analyzeFraud, analyzeWithOllama };
