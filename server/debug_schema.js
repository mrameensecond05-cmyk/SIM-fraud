const mysql = require('mysql2/promise');
require('dotenv').config();

async function describeTable() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'simfraud_db'
        });

        console.log("--- SIMFraudPredictionOutput Schema ---");
        const [rows] = await connection.execute('DESCRIBE SIMFraudPredictionOutput');
        console.table(rows);

    } catch (err) {
        console.error(err);
    } finally {
        if (connection) await connection.end();
    }
}

describeTable();
