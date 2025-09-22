// routes/dashboard.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

// Get dashboard statistics
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get appointment statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_appointments,
        COUNT(*) FILTER (WHERE status = 'scheduled' AND date >= CURRENT_DATE) as upcoming_appointments,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_appointments
      FROM appointments 
      WHERE user_id = $1
    `;
    
    const statsResult = await db.query(statsQuery, [userId]);
    
    // Get recent appointments
    const appointmentsQuery = `
      SELECT a.*, d.name as doctor_name, s.name as service_name
      FROM appointments a
      LEFT JOIN doctors d ON a.doctor_id = d.id
      LEFT JOIN services s ON a.service_id = s.id
      WHERE a.user_id = $1
      ORDER BY a.date DESC, a.time DESC
      LIMIT 5
    `;
    
    const appointmentsResult = await db.query(appointmentsQuery, [userId]);
    
    res.json({
      stats: {
        totalAppointments: parseInt(statsResult.rows[0].total_appointments),
        upcomingAppointments: parseInt(statsResult.rows[0].upcoming_appointments),
        completedAppointments: parseInt(statsResult.rows[0].completed_appointments)
      },
      recentAppointments: appointmentsResult.rows.map(row => ({
        id: row.id,
        service: row.service_name,
        doctor: row.doctor_name,
        date: row.date,
        time: row.time,
        status: row.status
      }))
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;