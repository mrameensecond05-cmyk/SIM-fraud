const axios = require('axios');
const pool = require('./db');

const BASE_URL = 'http://localhost:5005/api';

async function testSimSwap() {
    console.log("=== SIM SWAP TEST ===");
    try {
        // 1. Create a User
        const email = `simtest_${Date.now()}@example.com`;
        const phone = `+91${Math.floor(1000000000 + Math.random() * 9000000000)}`;
        await axios.post(`${BASE_URL}/register`, {
            name: 'Sim Tester',
            email: email,
            password: 'password123',
            phone: phone
        });

        // Login to get ID
        const loginRes = await axios.post(`${BASE_URL}/login`, {
            email: email,
            password: 'password123'
        });
        const userId = loginRes.data.user.id;
        console.log(`User Created: ID ${userId}`);

        // 2. Register Device 1 (First Time)
        const res1 = await axios.post(`${BASE_URL}/user/device`, {
            userId: userId,
            imei: 'IMEI-111111111111111',
            location: 'Mumbai'
        });
        console.log("1. Initial Registration:", res1.data.status === 'new_sim' ? 'PASS' : 'FAIL', res1.data.status);

        // 3. Register Same Device (No Change)
        const res2 = await axios.post(`${BASE_URL}/user/device`, {
            userId: userId,
            imei: 'IMEI-111111111111111',
            location: 'Mumbai'
        });
        console.log("2. Same Device Check:", res2.data.status === 'unchanged' ? 'PASS' : 'FAIL', res2.data.status);

        // 4. Register NEW Device (Swap)
        const res3 = await axios.post(`${BASE_URL}/user/device`, {
            userId: userId,
            imei: 'IMEI-222222222222222', // DIFFERENT
            location: 'Pune'
        });
        console.log("3. SIM SWAP Detection:", res3.data.status === 'imei_change' ? 'PASS' : 'FAIL', res3.data.status);

    } catch (err) {
        console.error("TEST FAILED:", err.response ? err.response.data : err.message);
    } finally {
        // Clean up?
        process.exit();
    }
}

testSimSwap();
