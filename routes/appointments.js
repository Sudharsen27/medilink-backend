// routes/appointments.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

// Create appointment
router.post('/', async (req, res) => {
  const { name, email, date } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO appointments (name, email, date) VALUES ($1, $2, $3) RETURNING *',
      [name, email, date]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all appointments
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM appointments');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
