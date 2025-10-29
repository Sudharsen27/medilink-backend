// routes/health.js
const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.get('/', async (req, res) => {
  const checkTime = new Date().toISOString();
  
  try {
    // Check database connection
    await pool.query('SELECT 1');
    
    res.json({
      status: 'OK',
      timestamp: checkTime,
      uptime: process.uptime(),
      database: 'Connected',
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'Service Unavailable',
      timestamp: checkTime,
      database: 'Disconnected',
      error: error.message
    });
  }
});

module.exports = router;