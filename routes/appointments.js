const express = require('express');
const router = express.Router();
const pool = require('../db');
const verifyAdmin = require('../middleware/admin');
const verifyToken = require('../middleware/auth');

// Create appointment (any logged-in user)
router.post('/', verifyToken, async (req, res) => {
  const { name, email, date } = req.body;
  if (!name || !email || !date)
    return res.status(400).json({ error: "All fields are required" });

  try {
    const result = await pool.query(
      'INSERT INTO appointments (name, email, date) VALUES ($1, $2, $3) RETURNING *',
      [name, email, date]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// Get appointments of logged-in user
router.get('/', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM appointments WHERE email = $1 ORDER BY id ASC',
      [req.user.email]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// Admin: view all appointments
router.get('/all', verifyAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM appointments ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

module.exports = router;
