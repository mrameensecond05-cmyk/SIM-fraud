const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function debugLogin() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'simtool',
        password: process.env.DB_PASSWORD || 'simtool',
        database: process.env.DB_NAME || 'simfraud_db'
    });

    console.log("Testing Login Logic...");
    const email = 'admin@simtinel.com';
    const password = 'admin123';

    try {
        const [users] = await pool.query(`
            SELECT l.id as login_id, l.password_hash, l.role_id, r.role_name, p.name, p.id as profile_id
            FROM SIMFraudLogin l
            JOIN SIMFraudRole r ON l.role_id = r.id
            LEFT JOIN SIMFraudUserProfile p ON l.id = p.login_id
            WHERE l.email = ?
        `, [email]);

        console.log("Query Result:", users);

        if (users.length === 0) {
            console.log("User not found.");
            return;
        }

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        console.log("Password Match:", isMatch);

    } catch (err) {
        console.error("Login Debug Error:", err);
    } finally {
        await pool.end();
    }
}

debugLogin();
