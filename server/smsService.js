const twilio = require('twilio');
require('dotenv').config();

// Load Credentials from Env or Fallback to User Provided
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const senderNumber = process.env.TWILIO_PHONE_NUMBER || '+15005550006'; // Magic Number

let client;

try {
    if (accountSid && authToken) {
        client = twilio(accountSid, authToken);
        console.log("Twilio Client Initialized in Simulation Mode");
    } else {
        console.warn("Twilio Credentials missing in .env. SMS simulation will log to console only.");
    }
} catch (error) {
    console.error("Twilio Initialization Error:", error.message);
}

/**
 * Sends a simulated SMS using Twilio Test Credentials.
 * @param {string} to Phone number to send to
 * @param {string} body Message body
 */
async function sendSimulatedSMS(to, body) {
    if (!to) {
        console.error("sendSimulatedSMS: No recipient phone number provided.");
        return;
    }

    // Console Log Simulation (Always do this for visibility)
    console.log(`\n[SMS SIMULATION] To: ${to} | Body: "${body}"`);

    if (!client) {
        console.log("[SMS SIMULATION] Mock Success (No Twilio Client)\n");
        return { sid: 'SM_MOCK_' + Date.now(), status: 'queued' };
    }

    try {
        const message = await client.messages.create({
            body: body,
            from: senderNumber,
            to: to
        });
        console.log(`[SMS SIMULATION] Twilio Response SID: ${message.sid}\n`);
        return message;
    } catch (error) {
        console.error(`[SMS SIMULATION] Twilio Error: ${error.message}`);
        // Verification: If error is strictly related to "Test Credentials" limitations (like unverified numbers),
        // we might still want to treat it as "simulated success" in the UI if we were strictly mocking.
        // But since we are using specific Test Credentials, we expect success.
        return null;
    }
}

module.exports = { sendSimulatedSMS };
