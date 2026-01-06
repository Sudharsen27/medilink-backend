


// const { Pool } = require('pg');
// require('dotenv').config();

// const pool = new Pool({
//   user: process.env.DB_USER || 'postgres',
//   host: process.env.DB_HOST || 'localhost',
//   database: process.env.DB_NAME || 'medilink',
//   password: process.env.DB_PASSWORD || 'password',
//   port: process.env.DB_PORT || 5432,
// });

// // Test database connection
// pool.on('connect', () => {
//   console.log('✅ PostgreSQL connected successfully');
// });

// pool.on('error', (err) => {
//   console.error('❌ PostgreSQL connection error:', err);
// });

// module.exports = {
//   query: (text, params) => pool.query(text, params),
//   pool
// };

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'medilink',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
  max: 10,                     // max connections
  idleTimeoutMillis: 30000,    // close idle clients
  connectionTimeoutMillis: 5000
});

// Log connection (fires once per client)
pool.on('connect', () => {
  console.log('✅ PostgreSQL connected successfully');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL pool error:', err);
  process.exit(1);
});

module.exports = pool;
