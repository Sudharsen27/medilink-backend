// routes/appointments.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const verifyAdmin = require('../middleware/admin');
const verifyToken = require('../middleware/auth'); // for normal user auth

// ✅ Create appointment (any logged-in user)
router.post('/', verifyToken, async (req, res) => {
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

// ✅ Get appointments of logged-in user
router.get('/', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM appointments WHERE email = $1 ORDER BY id ASC',
      [req.user.email]  // coming from verifyToken middleware
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Admin: view all appointments
router.get('/all', verifyAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM appointments ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const appointments = await Appointment.find(); // or from MySQL
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
