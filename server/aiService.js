const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434/api/generate';
const MODEL_NAME = 'mistral'; // or 'llama3', 'gemma:2b' - change as needed

/**
 * Analyzes SMS content using local Ollama instance.
 * @param {string} smsText 
 * @param {object} deviceContext 
 * @returns {Promise<object>} Analysis result
 */
async function analyzeWithOllama(smsText, deviceContext) {
    const prompt = `
    You are a cybersecurity expert analyzing SMS for fraud.
    
    SMS Content: "${smsText}"
    Context:
    - IMSI Match: ${deviceContext.imsiMatch}
    - Time since SIM Swap: ${deviceContext.simSwapHours} hours
    - Identity Verified: ${deviceContext.isAadhaarVerified}
    
    Task: Analyze the SMS and context. Return a JSON object ONLY.
    Format:
    {
        "riskScore": (number 0-1),
        "riskLevel": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
        "reasoning": "string explanation",
        "category": "Phishing" | "OTP" | "Promo" | "Safe"
    }
    
    CRITICAL RULES:
    1. If simSwapHours < 24, risk is HIGH.
    2. If contains links and verified=false, risk is MEDIUM/HIGH.
    3. JSON ONLY. No markdown.
    `;

    try {
        const response = await fetch(OLLAMA_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: MODEL_NAME,
                prompt: prompt,
                stream: false,
                format: "json" // Valid for newer Ollama versions
            })
        });

        if (!response.ok) {
            throw new Error(`Ollama Error: ${response.statusText}`);
        }

        const data = await response.json();
        const analysis = JSON.parse(data.response);

        return analysis;

    } catch (error) {
        console.error("AI Analysis Failed:", error.message);
        // Fallback or re-throw
        return {
            riskScore: 0.5,
            riskLevel: "MEDIUM",
            reasoning: "AI Service Unavailable - Manual Review Required",
            category: "Unknown"
        };
    }
}

module.exports = { analyzeWithOllama };
