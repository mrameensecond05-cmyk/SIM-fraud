const mysql = require('mysql2/promise');

const configs = [
    { host: '127.0.0.1', port: 3306 },
    { host: '127.0.0.1', port: 3307 },
    { host: 'localhost', port: 3306 },
    { host: 'localhost', port: 3307 },
    { host: '192.168.1.13', port: 3306 },
    { host: '192.168.1.8', port: 3306 } // The other IP we found earlier
];

async function checkConnection(config) {
    console.log(`Trying ${config.host}:${config.port}...`);
    try {
        const conn = await mysql.createConnection({
            host: config.host,
            port: config.port,
            user: 'root', // Trying root first
            password: 'rootpassword', // From docker-compose
            connectTimeout: 2000
        });
        console.log(`✅ SUCCESS: Connected to ${config.host}:${config.port} as root`);
        await conn.end();
        return true;
    } catch (err) {
        console.log(`❌ FAILED ${config.host}:${config.port}: ${err.message}`);
        return false;
    }
}

async function scan() {
    console.log("--- DB Connection Scan ---");
    for (const config of configs) {
        await checkConnection(config);
    }

    // Also try with 'simtool' user just in case
    console.log("\n--- Retrying with 'simtool' user ---");
    try {
        const conn = await mysql.createConnection({
            host: '127.0.0.1',
            port: 3307,
            user: 'simtool',
            password: 'simtool',
            database: 'simfraud_db',
            connectTimeout: 2000
        });
        console.log(`✅ SUCCESS: Connected to 127.0.0.1:3307 as simtool`);
        await conn.end();
    } catch (err) {
        console.log(`❌ FAILED simtool@127.0.0.1:3307: ${err.message}`);
    }
}

scan();
