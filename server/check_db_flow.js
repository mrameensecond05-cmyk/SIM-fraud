const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkDataFlow() {
    console.log("1. MAPPING CONFIG CHECK...");
    console.log(`   Host: ${process.env.DB_HOST}`);
    console.log(`   User: ${process.env.DB_USER}`);
    console.log(`   DB:   ${process.env.DB_NAME}`);

    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'simfraud_db'
        });
        console.log("2. CONNECTION SUCCESSFUL! ✅\n");

        // TEST 1: READ USERS
        console.log("3. TESTING READ (Fetch Users)...");
        const [users] = await connection.execute('SELECT * FROM SIMFraudUserProfile LIMIT 5');
        console.log(`   ✅ Success! Found ${users.length} users.`);
        if (users.length > 0) console.log("   Sample User:", users[0].name);

        // TEST 2: READ ROLES (Join Check)
        console.log("\n4. TESTING JOINS (Fetch User Roles)...");
        const [roles] = await connection.execute(`
            SELECT p.name, r.role_name 
            FROM SIMFraudUserProfile p
            JOIN SIMFraudLogin l ON p.login_id = l.id
            JOIN SIMFraudRole r ON l.role_id = r.id
            LIMIT 1
        `);
        console.log(`   ✅ Success! Join worked.`);
        if (roles.length > 0) console.log(`   User '${roles[0].name}' has role '${roles[0].role_name}'`);

        // TEST 3: WRITE (If you want to verify PUSH)
        // Uncomment to test INSERT
        /*
        console.log("\n5. TESTING WRITE (Insert Test User)...");
        // Note: Needs valid keys. logic might be complex due to Foreign Keys (Role -> Login -> Profile)
        // Skipping for safety unless requested.
        */

        console.log("\n============================================");
        console.log("   DATA FLOW VERIFICATION PASSED! 🚀");
        console.log("============================================");

    } catch (error) {
        console.error("\n❌ DATA FLOW FAILED!");
        console.error("Full Error:", error);
        console.error("Error Message:", error.message);
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error("-> Check your DB_PASSWORD in .env file.");
        }
        if (error.code === 'ER_BAD_DB_ERROR') {
            console.error("-> Check if 'simfraud_db' exists.");
        }
    } finally {
        if (connection) await connection.end();
    }
}

checkDataFlow();
