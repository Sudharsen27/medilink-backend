// // routes/doctors.js
// const express = require('express');
// const router = express.Router();
// const pool = require('../config/db'); // make sure path is correct

// // Get all doctors
// router.get('/', async (req, res) => {
//   try {
//     const query = `
//       SELECT d.id, u.name, u.email, d.specialization, d.experience, d.rating, d.bio, d.clinic_address
//       FROM doctors d
//       JOIN users u ON d.user_id = u.id
//     `;
//     const { rows } = await pool.query(query);
//     res.json(rows);
//   } catch (err) {
//     console.error('Error in GET /api/doctors:', err);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // Get doctor by ID
// router.get('/:id', async (req, res) => {
//   try {
//     const doctorId = parseInt(req.params.id); // ensure it's a number
//     if (isNaN(doctorId)) return res.status(400).json({ message: 'Invalid doctor ID' });

//     const query = `
//       SELECT d.id, u.name, u.email, d.specialization, d.experience, d.rating, d.bio, d.clinic_address
//       FROM doctors d
//       JOIN users u ON d.user_id = u.id
//       WHERE d.id = $1
//     `;
//     const { rows } = await pool.query(query, [doctorId]);

//     if (rows.length === 0) return res.status(404).json({ message: 'Doctor not found' });

//     res.json(rows[0]);
//   } catch (err) {
//     console.error('Error in GET /api/doctors/:id:', err); // full error log
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// module.exports = router;

// // routes/doctors.js
// const express = require('express');
// const router = express.Router();
// const auth = require('../middleware/auth'); // Auth middleware (optional)
// const { getAllDoctors, getDoctorById } = require('../models/doctors');

// /**
//  * @route   GET /api/doctors
//  * @desc    Fetch all doctors (includes favorite status if user is logged in)
//  * @access  Public (favorites shown only if authenticated)
//  */
// router.get('/', async (req, res) => {
//   try {
//     // Check if user is authenticated
//     const userId = req.user ? req.user.id : null;

//     // Fetch doctors (favorites included if user logged in)
//     const doctors = await getAllDoctors(userId);

//     res.status(200).json(doctors);
//   } catch (err) {
//     console.error('❌ Error in GET /api/doctors:', err.message);
//     res.status(500).json({ message: 'Server error while fetching doctors' });
//   }
// });

// /**
//  * @route   GET /api/doctors/:id
//  * @desc    Fetch a single doctor by ID (includes favorite status if user is logged in)
//  * @access  Public (favorites shown only if authenticated)
//  */
// router.get('/:id', async (req, res) => {
//   try {
//     const doctorId = parseInt(req.params.id);
//     if (isNaN(doctorId)) {
//       return res.status(400).json({ message: 'Invalid doctor ID' });
//     }

//     // Check if user is authenticated
//     const userId = req.user ? req.user.id : null;

//     // Fetch doctor by ID
//     const doctor = await getDoctorById(doctorId, userId);

//     if (!doctor) {
//       return res.status(404).json({ message: 'Doctor not found' });
//     }

//     res.status(200).json(doctor);
//   } catch (err) {
//     console.error('❌ Error in GET /api/doctors/:id:', err.message);
//     res.status(500).json({ message: 'Server error while fetching doctor details' });
//   }
// });

// module.exports = router;


// // routes/doctors.js
// const express = require("express");
// const router = express.Router();
// const auth = require("../middleware/auth");
// const pool = require("../config/db");

// /**
//  * @route   GET /api/doctors
//  * @desc    Fetch all doctors (favorites included if logged in)
//  * @access  Public
//  */
// router.get("/", auth.optional, async (req, res) => {
//   try {
//     const userId = req.user?.id || null;

//     let query = `
//       SELECT
//         d.id,
//         d.specialization,
//         d.experience,
//         d.rating,
//         d.bio,
//         d.clinic_address,
//         d.image,
//         CASE
//           WHEN $1::int IS NOT NULL THEN
//             EXISTS (
//               SELECT 1 FROM favorites f
//               WHERE f.user_id = $1 AND f.doctor_id = d.id
//             )
//           ELSE false
//         END AS is_favorite
//       FROM doctors d
//       ORDER BY d.id ASC
//     `;

//     const { rows } = await pool.query(query, [userId]);
//     res.status(200).json(rows);
//   } catch (err) {
//     console.error("❌ Error fetching doctors:", err);
//     res.status(500).json({ message: "Failed to fetch doctors" });
//   }
// });

// /**
//  * @route   GET /api/doctors/:id
//  * @desc    Fetch doctor by ID
//  * @access  Public
//  */
// router.get("/:id", auth.optional, async (req, res) => {
//   try {
//     const doctorId = Number(req.params.id);
//     if (isNaN(doctorId)) {
//       return res.status(400).json({ message: "Invalid doctor ID" });
//     }

//     const userId = req.user?.id || null;

//     const query = `
//       SELECT
//         d.id,
//         d.specialization,
//         d.experience,
//         d.rating,
//         d.bio,
//         d.clinic_address,
//         d.image,
//         CASE
//           WHEN $2::int IS NOT NULL THEN
//             EXISTS (
//               SELECT 1 FROM favorites f
//               WHERE f.user_id = $2 AND f.doctor_id = d.id
//             )
//           ELSE false
//         END AS is_favorite
//       FROM doctors d
//       WHERE d.id = $1
//     `;

//     const { rows } = await pool.query(query, [doctorId, userId]);

//     if (!rows.length) {
//       return res.status(404).json({ message: "Doctor not found" });
//     }

//     res.status(200).json(rows[0]);
//   } catch (err) {
//     console.error("❌ Error fetching doctor:", err);
//     res.status(500).json({ message: "Failed to fetch doctor" });
//   }
// });

// module.exports = router;


// routes/doctors.js
const express = require("express");
const router = express.Router();
const { optional } = require("../middleware/auth");
const pool = require("../config/db");

/**
 * @route   GET /api/doctors
 * @desc    Fetch all doctors (favorites included if logged in)
 * @access  Public
 */
router.get("/", optional, async (req, res) => {
  try {
    const userId = req.user?.id || null;

    const query = `
      SELECT
        d.id,
        d.specialization,
        d.experience,
        d.rating,
        d.bio,
        d.clinic_address,
        CASE
          WHEN $1::int IS NOT NULL THEN
            EXISTS (
              SELECT 1
              FROM favorites f
              WHERE f.user_id = $1
                AND f.doctor_id = d.id
            )
          ELSE false
        END AS is_favorite
      FROM doctors d
      ORDER BY d.id ASC
    `;

    const { rows } = await pool.query(query, [userId]);

    // ✅ ALWAYS return array
    res.status(200).json(rows);
  } catch (err) {
    console.error("❌ Error fetching doctors:", err.message);
    res.status(500).json([]); // 🔒 prevent frontend crash
  }
});

/**
 * @route   GET /api/doctors/:id
 * @desc    Fetch doctor by ID
 * @access  Public
 */
router.get("/:id", optional, async (req, res) => {
  try {
    const doctorId = Number(req.params.id);
    if (isNaN(doctorId)) {
      return res.status(400).json({ message: "Invalid doctor ID" });
    }

    const userId = req.user?.id || null;

    const query = `
      SELECT
        d.id,
        d.specialization,
        d.experience,
        d.rating,
        d.bio,
        d.clinic_address,
        CASE
          WHEN $2::int IS NOT NULL THEN
            EXISTS (
              SELECT 1
              FROM favorites f
              WHERE f.user_id = $2
                AND f.doctor_id = d.id
            )
          ELSE false
        END AS is_favorite
      FROM doctors d
      WHERE d.id = $1
    `;

    const { rows } = await pool.query(query, [doctorId, userId]);

    if (!rows.length) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    res.status(200).json(rows[0]);
  } catch (err) {
    console.error("❌ Error fetching doctor:", err.message);
    res.status(500).json({ message: "Failed to fetch doctor" });
  }
});

module.exports = router;
