require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function migrate() {
  const client = new Client({
    connectionString: process.env.DB_URL || process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/nexus_crm',
    ssl: process.env.NODE_ENV === 'production' || process.env.DB_URL?.includes('neon') ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    
    const sqlPath = path.join(__dirname, 'migrations', '001_initial_schema.sql');
    const sql     = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('🔄 Running PostgreSQL migrations...');
    await client.query(sql);
    console.log('✅ Migrations complete.');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
