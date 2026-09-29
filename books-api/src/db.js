// db.js - one shared connection pool to PostgreSQL.
// Values come from environment variables (never hard-coded passwords).
// Defaults (localhost:5433) match the local dev database from Phase 2.
const { Pool, types } = require('pg');

// Return DATE columns as plain 'YYYY-MM-DD' text (avoids timezone shifts).
types.setTypeParser(1082, (value) => value);

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5433),
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
});

// If the database restarts, log the problem instead of crashing the API.
pool.on('error', (err) => {
  console.error('Database connection error:', err.message);
});

module.exports = pool;
