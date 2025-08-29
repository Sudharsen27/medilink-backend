const express = require('express');
const router = express.Router();
const pool = require('../db');
const verifyAdmin = require('../middleware/admin');
const verifyToken = require('../middleware/auth');

// Create appointment (logged-in user)
router.post('/', verifyToken, async (req, res) => {
  const { date } = req.body;
  if (!date) return res.status(400).json({ error: "Date is required" });

  try {
    // fetch user's name + email from users table
    const userResult = await pool.query(
      'SELECT name, email FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const { name, email } = userResult.rows[0];

    const result = await pool.query(
      'INSERT INTO appointments (name, email, date, user_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, email, date, req.user.id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error creating appointment:', err);
    res.status(500).json({ error: "Database error while creating appointment" });
  }
});

// Get appointments of logged-in user
router.get('/', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM appointments WHERE user_id = $1 ORDER BY id ASC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching user appointments:', err);
    res.status(500).json({ error: "Database error while fetching appointments" });
  }
});

// Admin: view all appointments
router.get('/all', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM appointments ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching all appointments:', err);
    res.status(500).json({ error: "Database error while fetching all appointments" });
  }
});

module.exports = router;
