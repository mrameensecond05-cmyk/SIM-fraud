require('dotenv').config();
const { sendSimulatedSMS } = require('./smsService');

async function test() {
    console.log("--- Testing SMS Service (Isolated) ---");
    const phone = "+919876543210";
    console.log(`Sending to ${phone}...`);

    try {
        const result = await sendSimulatedSMS(phone, "Test Message from Isolated Script");
        if (result && (result.sid || result.status === 'queued')) {
            console.log("✅ SMS Sent Successfully!");
            console.log("SID:", result.sid);
        } else {
            console.log("❌ SMS Failed (No SID returned)");
        }
    } catch (err) {
        console.error("❌ SMS Error:", err);
    }
}

test();
