const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434/api/generate';
const MODEL_NAME = 'mistral'; // or 'llama3', 'gemma:2b' - change as needed

/**
 * Analyzes SMS content using local Ollama instance.
 * @param {string} smsText 
 * @param {object} deviceContext 
 * @returns {Promise<object>} Analysis result
 */
const axios = require('axios');
const pool = require('./db');

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434/api/generate';
const MODEL_NAME = 'mistral'; // Using 'mistral' or 'llama3.2' as available

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

        // 2. Construct Prompt using User's Template
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

Give fraud analysis:
        `;

        // 3. Call Ollama
        console.log(`Sending Prompt for Tx ${transactionId}...`);
        const response = await axios.post(OLLAMA_URL, {
            model: MODEL_NAME,
            prompt: prompt,
            stream: false,
            format: "json"
        });

        // 4. Parse Response
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

        // 5. Save Audit Log
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
