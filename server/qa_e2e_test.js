const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
const TEST_USER = {
    name: 'QA Test User',
    email: `qa_${Date.now()}@test.com`,
    password: 'password123',
    phone: `+9199${Math.floor(10000000 + Math.random() * 90000000)}`
};

async function runTest() {
    console.log("--- Starting End-to-End API Test ---");

    try {
        // 1. Register User
        console.log(`\n1. Registering User (${TEST_USER.email})...`);
        const regRes = await axios.post(`${BASE_URL}/register`, TEST_USER);
        console.log("✅ Registration Status:", regRes.status, regRes.data);

        // 2. Login to get ID (or we can just use phone for simulation)
        console.log(`\n2. Logging in...`);
        const loginRes = await axios.post(`${BASE_URL}/login`, {
            email: TEST_USER.email,
            password: TEST_USER.password
        });
        const userId = loginRes.data.user.id;
        console.log("✅ Login Success! User ID:", userId);

        // 3. Trigger Simulation
        console.log(`\n3. Triggering Fraud Simulation for User ID ${userId}...`);
        const simRes = await axios.post(`${BASE_URL}/simulate/alert`, {
            userId: userId,
            phone: TEST_USER.phone
        });
        console.log("✅ Simulation Response:", JSON.stringify(simRes.data, null, 2));

        if (simRes.data.success) {
            console.log("\n🎉 FULL FLOW VERIFIED SUCCESSFULLY!");
        } else {
            console.log("\n⚠️ Simulation reported failure.");
        }

    } catch (err) {
        console.error("\n❌ TEST FAILED:", err.response ? err.response.data : err.message);
    }
}

runTest();
