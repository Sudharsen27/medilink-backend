// // db.js
// const { Pool } = require('pg');
// require('dotenv').config();

// const pool = new Pool({
//   user: process.env.DB_USER,
//   host: 'localhost',
//   database: process.env.DB_NAME,
//   password: process.env.DB_PASSWORD,
//   port: 5432,
// });

// module.exports = pool;

// config/db.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

// Test connection when starting the server
pool.connect()
  .then(() => console.log('✅ PostgreSQL connected'))
  .catch(err => {
    console.error('❌ PostgreSQL connection error:', err.message);
    process.exit(1); // stop the app if DB is unreachable
  });

module.exports = pool;
