const axios = require('axios');

const BASE_URL = 'http://192.168.0.125'; // Target Remote
// const BASE_URL = 'http://localhost:5000'; 

async function runQASuite() {
    console.log(`Starting QA Suite against: ${BASE_URL}`);
    const results = {
        registration: false,
        login: false,
        adminLogin: false,
        analysis: false,
        stats: false,
        alerts: false
    };

    let testUser = {
        name: 'QA Bot',
        email: `qa_bot_${Date.now()}@test.com`,
        password: 'password123',
        phone: '999' + Math.floor(1000000 + Math.random() * 9000000)
    };
    let userId = null;

    // 1. Registration
    try {
        console.log('\n--- Testing Registration ---');
        const res = await axios.post(`${BASE_URL}/api/register`, testUser);
        if (res.status === 201 && res.data.success) {
            console.log('✅ Registration Passed');
            results.registration = true;
        } else {
            console.error('❌ Registration Failed:', res.data);
        }
    } catch (err) {
        console.error('❌ Registration Error:', err.message);
        if (err.response) console.error('Data:', err.response.data);
    }

    // 2. Login
    try {
        console.log('\n--- Testing Login ---');
        const res = await axios.post(`${BASE_URL}/api/login`, {
            email: testUser.email,
            password: testUser.password
        });
        if (res.status === 200 && res.data.success) {
            console.log('✅ Login Passed');
            results.login = true;
            userId = res.data.user.id;
        } else {
            console.error('❌ Login Failed:', res.data);
        }
    } catch (err) {
        console.error('❌ Login Error:', err.message);
    }

    // 3. Admin Login
    try {
        console.log('\n--- Testing Admin Login ---');
        const res = await axios.post(`${BASE_URL}/api/login`, {
            email: 'admin@simtinel.com',
            password: 'admin123'
        });
        if (res.status === 200 && res.data.user.role === 'ADMIN') {
            console.log('✅ Admin Login Passed');
            results.adminLogin = true;
        } else {
            console.error('❌ Admin Login Failed (Role mismatch or invalid credentials)');
        }
    } catch (err) {
        console.error('❌ Admin Login Error:', err.message);
    }

    // 4. Fraud AI Analysis Flow
    try {
        console.log('\n--- Testing AI Analysis (Phishing Simulation) ---');
        // We'll use a mocked "userId" if login failed, just to test endpoint logic
        const targetUserId = userId || 1;

        const smsPayload = {
            smsText: "Urgent: Your HDFC account will be blocked. Click http://sus-link.com to KYC.",
            deviceContext: { permission: "granted" },
            userId: targetUserId
        };

        const res = await axios.post(`${BASE_URL}/api/analyze`, smsPayload);

        if (res.status === 200 && res.data.success) {
            console.log('✅ Analysis Endpoint Passed');
            console.log('   Risk Score:', res.data.analysis.risk_score);
            console.log('   Decision:', res.data.analysis.decision);
            results.analysis = true;
        }
    } catch (err) {
        console.error('❌ Analysis Error:', err.message);
    }

    // 5. Stats API
    try {
        console.log('\n--- Testing Stats API ---');
        const res = await axios.get(`${BASE_URL}/api/stats`);
        if (res.status === 200 && res.data.totalUsers !== undefined) {
            console.log('✅ Stats Endpoint Passed');
            results.stats = true;
        }
    } catch (err) {
        console.error('❌ Stats Error:', err.message);
    }

    // 6. Alerts API
    try {
        console.log('\n--- Testing Alerts API ---');
        const res = await axios.get(`${BASE_URL}/api/alerts`);
        if (res.status === 200 && Array.isArray(res.data)) {
            console.log('✅ Alerts Endpoint Passed');
            results.alerts = true;
        } else {
            console.error('❌ Alerts Failed:', res.data);
        }
    } catch (err) {
        console.error('❌ Alerts Error:', err.message);
    }

    // Summary
    console.log('\n=== QA Summary ===');
    console.table(results);

    // Pass/Fail exit code
    const allPassed = Object.values(results).every(v => v === true);
    if (!allPassed) {
        console.error('\n⚠️ SUB-OPTIMAL: Some tests failed.');
        process.exit(1);
    } else {
        console.log('\n🎉 SUCCESS: All automated checks passed.');
    }
}

runQASuite();
