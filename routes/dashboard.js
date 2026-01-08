

// // routes/dashboard.js
// const express = require('express');
// const router = express.Router();
// const db = require('../config/db');
// const { protect } = require('../middleware/auth');

// // ================================
// // 📊 Get Dashboard Statistics
// // ================================
// router.get('/', protect, async (req, res) => {
//   try {
//     const userId = req.user.id;

//     // ------------------------------------
//     // 📌 Appointment Stats
//     // ------------------------------------
//     const statsQuery = `
//       SELECT 
//         COUNT(*) AS total_appointments,
//         COUNT(*) FILTER (WHERE status = 'scheduled' AND date >= CURRENT_DATE) AS upcoming_appointments,
//         COUNT(*) FILTER (WHERE status = 'completed') AS completed_appointments
//       FROM appointments
//       WHERE user_id = $1
//     `;

//     const statsResult = await db.query(statsQuery, [userId]);

//     // ------------------------------------
//     // 📌 Recent Appointments (Last 5)
//     // ------------------------------------
//     const appointmentsQuery = `
//       SELECT a.*, d.name AS doctor_name, s.name AS service_name
//       FROM appointments a
//       LEFT JOIN doctors d ON a.doctor_id = d.id
//       LEFT JOIN services s ON a.service_id = s.id
//       WHERE a.user_id = $1
//       ORDER BY a.date DESC, a.time DESC
//       LIMIT 5
//     `;

//     const appointmentsResult = await db.query(appointmentsQuery, [userId]);

//     // ------------------------------------
//     // 📌 Final Response
//     // ------------------------------------
//     res.json({
//       stats: {
//         totalAppointments: Number(statsResult.rows[0].total_appointments),
//         upcomingAppointments: Number(statsResult.rows[0].upcoming_appointments),
//         completedAppointments: Number(statsResult.rows[0].completed_appointments)
//       },
//       recentAppointments: appointmentsResult.rows.map(row => ({
//         id: row.id,
//         service: row.service_name,
//         doctor: row.doctor_name,
//         date: row.date,
//         time: row.time,
//         status: row.status
//       }))
//     });
//   } catch (error) {
//     console.error('Dashboard error:', error);
//     res.status(500).json({ error: 'Server error' });
//   }
// });

// module.exports = router;


// // routes/dashboard.js
// const express = require('express');
// const router = express.Router();
// const db = require('../config/db');
// const { protect } = require('../middleware/auth');

// // ================================
// // 📊 Get Dashboard Statistics (USER)
// // ================================
// router.get('/', protect, async (req, res) => {
//   try {
//     const userId = req.user.id;

//     // ------------------------------------
//     // 📌 Appointment Stats (FIXED)
//     // ------------------------------------
//     const statsQuery = `
//       SELECT 
//         COUNT(*) AS total_appointments,

//         COUNT(*) FILTER (
//           WHERE status IN ('pending', 'scheduled', 'reschedule_requested')
//           AND date >= CURRENT_DATE
//         ) AS pending_appointments,

//         COUNT(*) FILTER (WHERE status = 'confirmed') AS confirmed_appointments,
//         COUNT(*) FILTER (WHERE status = 'completed') AS completed_appointments,
//         COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled_appointments

//       FROM appointments
//       WHERE user_id = $1
//     `;

//     const statsResult = await db.query(statsQuery, [userId]);
//     const stats = statsResult.rows[0];

//     // ------------------------------------
//     // 📌 Recent Appointments (Last 5)
//     // ------------------------------------
//     const appointmentsQuery = `
//       SELECT 
//         a.id,
//         a.date,
//         a.time,
//         a.status,
//         d.name AS doctor_name,
//         s.name AS service_name
//       FROM appointments a
//       LEFT JOIN doctors d ON a.doctor_id = d.id
//       LEFT JOIN services s ON a.service_id = s.id
//       WHERE a.user_id = $1
//       ORDER BY a.date DESC, a.time DESC
//       LIMIT 5
//     `;

//     const appointmentsResult = await db.query(appointmentsQuery, [userId]);

//     // ------------------------------------
//     // 📌 Final Response
//     // ------------------------------------
//     res.json({
//       stats: {
//         totalAppointments: Number(stats.total_appointments),
//         pendingAppointments: Number(stats.pending_appointments),
//         confirmedAppointments: Number(stats.confirmed_appointments),
//         completedAppointments: Number(stats.completed_appointments),
//         cancelledAppointments: Number(stats.cancelled_appointments),
//       },
//       recentAppointments: appointmentsResult.rows.map(row => ({
//         id: row.id,
//         service: row.service_name,
//         doctor: row.doctor_name,
//         date: row.date,
//         time: row.time,
//         status: row.status,
//       })),
//     });
//   } catch (error) {
//     console.error('Dashboard error:', error);
//     res.status(500).json({ error: 'Server error' });
//   }
// });

// module.exports = router;


// // routes/dashboard.js
// const express = require("express");
// const router = express.Router();
// const db = require("../config/db");
// const { protect } = require("../middleware/auth");

// // ================================
// // 📊 DASHBOARD STATS (USER)
// // ================================
// router.get("/", protect, async (req, res) => {
//   try {
//     const userId = req.user.id;

//     // ================================
//     // 📌 Appointment Statistics
//     // ================================
//     const statsQuery = `
//       SELECT
//         COUNT(*) AS total_appointments,

//         COUNT(*) FILTER (
//           WHERE status IN ('scheduled', 'pending', 'reschedule_requested')
//         ) AS pending_appointments,

//         COUNT(*) FILTER (WHERE status = 'confirmed') AS confirmed_appointments,
//         COUNT(*) FILTER (WHERE status = 'completed') AS completed_appointments,
//         COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled_appointments

//       FROM appointments
//       WHERE user_id = $1
//     `;

//     const statsResult = await db.query(statsQuery, [userId]);
//     const stats = statsResult.rows[0];

//     // ================================
//     // 📌 Recent Appointments
//     // ================================
//     const appointmentsQuery = `
//       SELECT
//         id,
//         doctor_name,
//         date,
//         time,
//         status
//       FROM appointments
//       WHERE user_id = $1
//       ORDER BY date DESC, time DESC
//       LIMIT 5
//     `;

//     const appointmentsResult = await db.query(appointmentsQuery, [userId]);

//     // ================================
//     // 📌 Response
//     // ================================
//     res.json({
//       stats: {
//         totalAppointments: Number(stats.total_appointments),
//         pending: Number(stats.pending_appointments),
//         confirmed: Number(stats.confirmed_appointments),
//         completed: Number(stats.completed_appointments),
//         cancelled: Number(stats.cancelled_appointments),
//       },
//       recentAppointments: appointmentsResult.rows,
//     });
//   } catch (error) {
//     console.error("Dashboard error:", error);
//     res.status(500).json({ error: "Server error" });
//   }
// });

// module.exports = router;


// routes/dashboard.js
const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { protect } = require("../middleware/auth");

// ================================
// 📊 DASHBOARD STATS (USER)
// ================================
router.get("/", protect, async (req, res) => {
  try {
    const userId = req.user.id;

    // ================================
    // 📌 Appointment Statistics
    // ================================
    const statsQuery = `
      SELECT
        COUNT(*) AS total_appointments,

        COUNT(*) FILTER (
          WHERE status IN ('scheduled', 'pending', 'reschedule_requested')
        ) AS pending_appointments,

        COUNT(*) FILTER (WHERE status = 'confirmed') AS confirmed_appointments,
        COUNT(*) FILTER (WHERE status = 'completed') AS completed_appointments,
        COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled_appointments
      FROM appointments
      WHERE user_id = $1
    `;

    const statsResult = await db.query(statsQuery, [userId]);
    const stats = statsResult.rows[0];

    // ================================
    // 📌 Recent Appointments (Last 5)
    // ================================
    const appointmentsQuery = `
      SELECT
        id,
        doctor_name,
        date,
        time,
        status
      FROM appointments
      WHERE user_id = $1
      ORDER BY date DESC, time DESC
      LIMIT 5
    `;

    const appointmentsResult = await db.query(appointmentsQuery, [userId]);

    // ================================
    // 📌 Final Response
    // ================================
    res.json({
      stats: {
        totalAppointments: Number(stats.total_appointments),
        pending: Number(stats.pending_appointments),
        confirmed: Number(stats.confirmed_appointments),
        completed: Number(stats.completed_appointments),
        cancelled: Number(stats.cancelled_appointments),
      },
      recentAppointments: appointmentsResult.rows,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
