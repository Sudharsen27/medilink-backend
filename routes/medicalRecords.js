const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const medicalRecords = []; // Replace with DB logic
    res.json(medicalRecords);
  } catch (err) {
    console.error('Error fetching medical records:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
