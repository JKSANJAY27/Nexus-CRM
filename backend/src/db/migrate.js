const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

async function migrate() {
  let db;
  try {
    db = await open({
      filename: path.join(__dirname, '../../nexus_crm.sqlite'),
      driver: sqlite3.Database
    });
    
    // Enable foreign keys
    await db.exec('PRAGMA foreign_keys = ON;');
    
    const sqlPath = path.join(__dirname, 'migrations', '001_initial_schema.sql');
    const sql     = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('🔄 Running SQLite migrations...');
    await db.exec(sql);
    console.log('✅ Migrations complete.');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    if (db) await db.close();
  }
}

migrate();
