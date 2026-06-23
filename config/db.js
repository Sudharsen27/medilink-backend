


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

const useSsl =
  process.env.DB_SSL === 'true' ||
  (process.env.DB_HOST && process.env.DB_HOST.includes('supabase')) ||
  (process.env.DB_HOST && process.env.DB_HOST.includes('render.com')) ||
  (process.env.DATABASE_URL &&
    (process.env.DATABASE_URL.includes('render.com') ||
      process.env.DATABASE_URL.includes('supabase')));

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {}),
    })
  : new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'medilink',
      password: process.env.DB_PASSWORD || 'password',
      port: Number(process.env.DB_PORT) || 5432,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {}),
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
