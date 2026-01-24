const mysql = require('mysql2/promise');

async function debugRemoteDockerDB() {
    try {
        console.log('Connecting to Remote Docker DB (192.168.1.13:3307)...');
        const pool = mysql.createPool({
            host: '192.168.1.13',
            port: 3307,
            user: 'root',
            password: 'rootpassword', // From docker-compose.yml
            database: 'simfraud_db'
        });

        const [rows] = await pool.query("SELECT id, email, role_id, password_hash FROM SIMFraudLogin WHERE email = 'admin@simtinel.com'");
        console.log('Admin Query Result:', rows);

        if (rows.length > 0) {
            console.log('Admin exists. Password Hash:', rows[0].password_hash);
            // Verify if role is correct
            const [roles] = await pool.query("SELECT * FROM SIMFraudRole WHERE id = ?", [rows[0].role_id]);
            console.log('Role Info:', roles);
        } else {
            console.log('Admin DOES NOT EXIST in Docker DB.');
        }

        process.exit(0);
    } catch (err) {
        console.error('Debug Error:', err);
        process.exit(1);
    }
}

debugRemoteDockerDB();
