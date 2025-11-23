// const express = require('express');
// const router = express.Router();
// const auth = require('../middleware/auth');

// // Example route
// router.get('/', auth, async (req, res) => {
//   try {
//     // Fetch prescriptions from DB
//     const prescriptions = []; // Replace with DB logic
//     res.json(prescriptions);
//   } catch (err) {
//     console.error('Error fetching prescriptions:', err);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// module.exports = router;

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
