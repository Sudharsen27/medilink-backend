

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// Example route – Get prescriptions
router.get('/', protect, async (req, res) => {
  try {
    // TODO: Replace with actual DB logic
    const prescriptions = [];

    res.json({
      success: true,
      data: prescriptions
    });
  } catch (err) {
    console.error('❌ Error fetching prescriptions:', err);
    res.status(500).json({ message: 'Server error while fetching prescriptions' });
  }
});

module.exports = router;
