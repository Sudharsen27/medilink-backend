// routes/doctors.js
const express = require('express');
const router = express.Router();
const { getAllDoctors } = require('../models/doctors');

/**
 * @route   GET /api/doctors
 * @desc    Get all doctors with user details
 * @access  Public (adjust if you add auth later)
 */
router.get('/', async (req, res) => {
  try {
    const doctors = await getAllDoctors();
    res.status(200).json(doctors);
  } catch (err) {
    console.error('Error in GET /api/doctors:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
