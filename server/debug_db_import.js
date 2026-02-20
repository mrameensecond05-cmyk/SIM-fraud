const pool = require('./db');
const bcrypt = require('bcryptjs');

async function debugPool() {
    console.log("Testing DB Pool Import...");
    try {
        const [users] = await pool.query(`
            SELECT l.id as login_id, l.password_hash, l.role_id, r.role_name, p.name, p.id as profile_id
            FROM SIMFraudLogin l
            JOIN SIMFraudRole r ON l.role_id = r.id
            LEFT JOIN SIMFraudUserProfile p ON l.id = p.login_id
            WHERE l.email = ?
        `, ['admin@simtinel.com']);

        console.log("Query Result:", users);
        if (users.length > 0) {
            console.log("User found!");
        } else {
            console.log("User NOT found.");
        }
    } catch (err) {
        console.error("Pool Query Error:", err);
    } finally {
        // pool.end() might not be exposed or needed if we just exit, 
        // but let's try to close if the pool object supports it.
        if (pool && pool.end) await pool.end();
    }
}

debugPool();
