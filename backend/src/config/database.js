const { Pool } = require('pg');

const constructedUrl = process.env.DB_HOST 
  ? `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME}`
  : 'postgres://postgres:postgres@localhost:5432/nexus_crm';

const connectionString = process.env.DB_URL || process.env.DATABASE_URL || constructedUrl;

const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === 'production' || connectionString.includes('rds.amazonaws.com') || process.env.DB_SSL === 'true'
    ? { rejectUnauthorized: false } 
    : false
});

module.exports = pool;
