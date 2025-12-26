

// routes/users.js
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const multer = require('multer');
const path = require('path');

// ================================
// 📂 File upload configuration
// ================================
const storage = multer.diskStorage({
  destination: './uploads/', // Folder to store uploaded images
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
  },
});

const upload = multer({ storage });

// ================================
// ✅ Get user by ID
// ================================
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'SELECT id, name, email, phone, photo FROM users WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('❌ Error fetching user:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// ================================
// ✅ Update user by ID (with photo upload)
// ================================
router.put('/:id', upload.single('photo'), async (req, res) => {
  const { id } = req.params;
  const { name, email, phone } = req.body;
  const photo = req.file ? req.file.filename : null;

  try {
    const result = await pool.query(
      `UPDATE users 
       SET name = COALESCE($1, name), 
           email = COALESCE($2, email), 
           phone = COALESCE($3, phone), 
           photo = COALESCE($4, photo)
       WHERE id = $5 
       RETURNING id, name, email, phone, photo`,
      [name, email, phone, photo, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('❌ Error updating user:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
