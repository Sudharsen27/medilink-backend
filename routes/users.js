// routes/users.js
const express = require('express');
const router = express.Router();
const pool = require('../db'); // Make sure db.js is set up for PostgreSQL

// ✅ Get user by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'SELECT id, name, email, phone FROM users WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Update user by ID
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, phone } = req.body;

  try {
    const result = await pool.query(
      `UPDATE users 
       SET name = COALESCE($1, name), 
           email = COALESCE($2, email), 
           phone = COALESCE($3, phone) 
       WHERE id = $4 
       RETURNING id, name, email, phone`,
      [name, email, phone, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
