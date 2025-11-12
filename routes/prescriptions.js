const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Example route
router.get('/', auth, async (req, res) => {
  try {
    // Fetch prescriptions from DB
    const prescriptions = []; // Replace with DB logic
    res.json(prescriptions);
  } catch (err) {
    console.error('Error fetching prescriptions:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
