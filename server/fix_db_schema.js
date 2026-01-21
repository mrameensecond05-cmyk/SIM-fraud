
const mysql = require('mysql2/promise');
require('dotenv').config();

const DB_CONFIG = {
    host: process.env.DB_HOST || '192.168.1.13',
    user: process.env.DB_USER || 'simtool',
    password: process.env.DB_PASSWORD || 'simtool',
    database: process.env.DB_NAME || 'simfraud_db',
    multipleStatements: true // Required for running multiple queries
};

async function fixSchema() {
    console.log(`Connecting to DB at ${DB_CONFIG.host}...`);
    const conn = await mysql.createConnection(DB_CONFIG);

    try {
        console.log("Disabling Foreign Key Checks...");
        await conn.query("SET FOREIGN_KEY_CHECKS = 0");

        console.log("Fixing Transactions Table...");
        await conn.query("ALTER TABLE SIMFraudTransaction MODIFY id BIGINT AUTO_INCREMENT");

        console.log("Fixing Prediction Table...");
        await conn.query("ALTER TABLE SIMFraudPredictionOutput MODIFY id BIGINT AUTO_INCREMENT");

        console.log("Fixing Alert Table...");
        await conn.query("ALTER TABLE SIMFraudAlert MODIFY id INT AUTO_INCREMENT");

        console.log("Re-enabling Foreign Key Checks...");
        await conn.query("SET FOREIGN_KEY_CHECKS = 1");

        console.log("\n✅ SUCCESS: Database Schema Fixed! AUTO_INCREMENT added.");

    } catch (err) {
        console.error("❌ ERROR Fixing Schema:", err.message);
    } finally {
        await conn.end();
    }
}

fixSchema();
