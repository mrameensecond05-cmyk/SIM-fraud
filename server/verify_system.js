
const axios = require('axios');
const mysql = require('mysql2/promise');
require('dotenv').config();

// Targeting server IP from .env
const SERVER_IP = process.env.DB_HOST || '192.168.1.13';
const BASE_URL = `http://${SERVER_IP}:5000/api`;

const DB_CONFIG = {
    host: SERVER_IP,
    port: 3307, // Docker Mapped Port
    user: process.env.DB_USER || 'root', // Docker uses root/rootpassword by default
    password: process.env.DB_PASSWORD || 'rootpassword', // Updating to match docker-compose defaults
    database: process.env.DB_NAME || 'simfraud_db'
};

async function testLogin(email, password, description) {
    try {
        console.log(`\n--- Testing Login: ${description} ---`);
        const res = await axios.post(`${BASE_URL}/login`, { email, password }, { validateStatus: () => true });
        console.log(`Status: ${res.status}`);

        if (res.status === 200 && res.data.success) {
            console.log("Login Successful: User authenticated");
            if (description.includes("Unregistered")) {
                console.log("⚠️ CRITICAL FAILURE: Unregistered user was able to login!");
            }
        } else {
            console.log(`Login Response: ${res.status}`);
            if (description.includes("Unregistered") && res.status === 401) {
                console.log("SUCCESS: Unregistered user blocked.");
            }
        }
    } catch (err) {
        console.error("Login Test Error:", err.message);
    }
}

async function testRegistration() {
    console.log(`\n--- Testing Registration ---`);
    const uniqueTime = Date.now();
    const testUser = {
        name: "Test User",
        email: `test_${uniqueTime}@example.com`,
        phone: "1234567890",
        password: "password123"
    };

    try {
        const res = await axios.post(`${BASE_URL}/register`, testUser, { validateStatus: () => true });
        console.log(`Status: ${res.status}`);
        if (res.status === 201) {
            console.log("Registration: SUCCESS - User Created");
        } else {
            console.log("Registration: FAILED");
            console.log("Error Response:", JSON.stringify(res.data));
        }
    } catch (err) {
        console.error("Registration Request Error:", err.message);
    }
}

async function testProtectedEndpoint(endpoint, description) {
    try {
        console.log(`\n--- Testing Protected Endpoint: ${description} (${endpoint}) ---`);
        const res = await axios.get(`${BASE_URL}${endpoint}`, { validateStatus: () => true });
        console.log(`Status: ${res.status}`);
        if (res.status === 200) {
            console.log("⚠️ WARNING: Endpoint is accessible without authentication!");
        } else {
            console.log("Endpoint protected (or other error):", res.status);
        }
    } catch (err) {
        console.error("Endpoint Test Error:", err.message);
    }
}

async function testDatabaseConnection() {
    console.log(`\n--- Testing Database Connection (${DB_CONFIG.host}) ---`);
    try {
        const conn = await mysql.createConnection(DB_CONFIG);
        console.log("Database Connection: SUCCESS");
        await conn.end();
    } catch (err) {
        console.error("Database Connection: FAILED", err.message);
    }
}

async function testOllamaViaAPI() {
    console.log(`\n--- Testing Ollama via Backend API ---`);
    try {
        const res = await axios.post(`${BASE_URL}/analyze`, {
            smsText: "Urgent! Your SIM will be blocked. Click here.",
            deviceContext: { imsiMatch: true, simSwapHours: 48, isAadhaarVerified: true },
            userId: 1
        }, { validateStatus: () => true });

        console.log(`Status: ${res.status}`);
        if (res.status === 200 && res.data.success) {
            console.log("Backend <-> Ollama Connection: SUCCESS");
            console.log("Analysis Result:", res.data.analysis);
        } else {
            console.log("Backend <-> Ollama Connection: FAILED");
            console.log("Response:", JSON.stringify(res.data));
        }
    } catch (err) {
        console.error("Ollama API Error:", err.message);
    }
}

async function runTests() {
    console.log(`Targeting Server at: ${BASE_URL}`);
    await testDatabaseConnection();
    await testRegistration(); // New Test
    await testLogin('unregistered@example.com', 'wrongpass', 'Unregistered User');
    await testLogin('admin@simtinel.com', 'admin123', 'Registered Admin');
    await testProtectedEndpoint('/stats', '/api/stats (No token)');
    await testOllamaViaAPI();
}

runTests();
