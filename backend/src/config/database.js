const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DB_URL || process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/nexus_crm',
  ssl: process.env.NODE_ENV === 'production' || process.env.DB_URL?.includes('neon') ? { rejectUnauthorized: false } : false
});

module.exports = pool;
