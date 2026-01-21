
const mysql = require('mysql2/promise');
require('dotenv').config();

const DB_CONFIG = {
    host: process.env.DB_HOST || '192.168.1.13',
    user: process.env.DB_USER || 'simtool',
    password: process.env.DB_PASSWORD || 'simtool',
    database: process.env.DB_NAME || 'simfraud_db'
};

async function inspect() {
    console.log("Connecting to DB at", DB_CONFIG.host);
    const conn = await mysql.createConnection(DB_CONFIG);

    try {
        console.log("\n--- Describe SIMFraudTransaction ---");
        const [columns] = await conn.query("DESCRIBE SIMFraudTransaction");
        columns.forEach(c => console.log(`${c.Field} (${c.Type})`));

        console.log("\n--- List Users (SIMFraudLogin) ---");
        const [users] = await conn.query("SELECT id, email, role_id FROM SIMFraudLogin");
        console.log(users);

    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await conn.end();
    }
}

inspect();
