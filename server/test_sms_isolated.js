require('dotenv').config();
const { sendSimulatedSMS, sendOTP } = require('./smsService');

async function test() {
    console.log("--- Testing Fast2SMS Service (Isolated) ---\n");

    // Use a real Indian phone number for live testing
    const phone = "9876543210"; // Replace with your real number to test

    // Test 1: Quick SMS (free-text message)
    console.log("=== Test 1: Quick SMS ===");
    try {
        const result = await sendSimulatedSMS(phone, "SIMTinel Alert: Test message from your fraud detection system.");
        if (result && (result.request_id || result.status)) {
            console.log("✅ Quick SMS Test Passed!", result);
        } else {
            console.log("❌ Quick SMS Test Failed (No response)");
        }
    } catch (err) {
        console.error("❌ Quick SMS Error:", err.message);
    }

    console.log("\n");

    // Test 2: OTP Route
    console.log("=== Test 2: OTP SMS ===");
    try {
        const otpResult = await sendOTP(phone, "123456");
        if (otpResult && (otpResult.request_id || otpResult.status)) {
            console.log("✅ OTP SMS Test Passed!", otpResult);
        } else {
            console.log("❌ OTP SMS Test Failed (No response)");
        }
    } catch (err) {
        console.error("❌ OTP SMS Error:", err.message);
    }

    console.log("\n--- All Tests Complete ---");
}

test();
