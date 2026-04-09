require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

async function migrate() {
  let client;
  try {
    client = await pool.connect();
    
    const sqlPath = path.join(__dirname, 'migrations', '001_initial_schema.sql');
    const sql     = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('🔄 Running PostgreSQL migrations...');
    await client.query(sql);
    console.log('✅ Migrations complete.');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    if (client) client.release();
    process.exit(0);
  }
}

migrate();
