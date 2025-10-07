const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { pool } = require('../config/database');

// Start telemedicine consultation
router.post('/:appointmentId/start', auth, async (req, res) => {
  try {
    const { appointmentId } = req.params;
    
    // Verify appointment belongs to user or doctor
    const appointmentQuery = await pool.query(
      `SELECT a.*, d.name as doctor_name, d.specialization, u.name as patient_name 
       FROM appointments a 
       JOIN doctors d ON a.doctor_id = d.id 
       JOIN users u ON a.patient_id = u.id 
       WHERE a.id = $1 AND (a.patient_id = $2 OR a.doctor_id = $3)`,
      [appointmentId, req.user.id, req.user.id]
    );

    if (appointmentQuery.rows.length === 0) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const appointment = appointmentQuery.rows[0];

    // Check if consultation can be started
    const now = new Date();
    const appointmentDateTime = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`);
    const fifteenMinutesBefore = new Date(appointmentDateTime.getTime() - 15 * 60000);
    const oneHourAfter = new Date(appointmentDateTime.getTime() + 60 * 60000);

    if (now < fifteenMinutesBefore || now > oneHourAfter) {
      return res.status(400).json({ 
        message: 'Consultation can only be started 15 minutes before and up to 1 hour after scheduled time' 
      });
    }

    // Update appointment status
    await pool.query(
      'UPDATE appointments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['in-progress', appointmentId]
    );

    // Create consultation record
    const consultationResult = await pool.query(
      `INSERT INTO telemedicine_consultations 
       (appointment_id, started_at, status, room_id) 
       VALUES ($1, CURRENT_TIMESTAMP, 'active', $2) 
       RETURNING *`,
      [appointmentId, `room_${appointmentId}_${Date.now()}`]
    );

    res.json({
      consultation: consultationResult.rows[0],
      appointment: appointment
    });

  } catch (error) {
    console.error('Error starting consultation:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// End telemedicine consultation
router.post('/:appointmentId/end', auth, async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { duration, notes } = req.body;

    // Update consultation record
    await pool.query(
      `UPDATE telemedicine_consultations 
       SET ended_at = CURRENT_TIMESTAMP, status = 'completed', duration = $1, notes = $2 
       WHERE appointment_id = $3 AND status = 'active'`,
      [duration, notes, appointmentId]
    );

    // Update appointment status
    await pool.query(
      'UPDATE appointments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['completed', appointmentId]
    );

    res.json({ message: 'Consultation ended successfully' });

  } catch (error) {
    console.error('Error ending consultation:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get consultation details
router.get('/:appointmentId', auth, async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const consultationQuery = await pool.query(
      `SELECT tc.*, a.*, d.name as doctor_name, d.specialization, u.name as patient_name 
       FROM telemedicine_consultations tc
       JOIN appointments a ON tc.appointment_id = a.id
       JOIN doctors d ON a.doctor_id = d.id
       JOIN users u ON a.patient_id = u.id
       WHERE tc.appointment_id = $1 AND (a.patient_id = $2 OR a.doctor_id = $3)`,
      [appointmentId, req.user.id, req.user.id]
    );

    if (consultationQuery.rows.length === 0) {
      return res.status(404).json({ message: 'Consultation not found' });
    }

    res.json(consultationQuery.rows[0]);

  } catch (error) {
    console.error('Error fetching consultation:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Save chat message
router.post('/:appointmentId/chat', auth, async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { message, sender_type } = req.body;

    await pool.query(
      `INSERT INTO consultation_chats 
       (appointment_id, sender_type, sender_id, message, sent_at) 
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
      [appointmentId, sender_type, req.user.id, message]
    );

    res.json({ message: 'Chat message saved' });

  } catch (error) {
    console.error('Error saving chat message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get chat history
router.get('/:appointmentId/chat', auth, async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const chatQuery = await pool.query(
      `SELECT cc.*, 
              CASE 
                WHEN cc.sender_type = 'doctor' THEN d.name
                ELSE u.name
              END as sender_name
       FROM consultation_chats cc
       LEFT JOIN doctors d ON cc.sender_id = d.id AND cc.sender_type = 'doctor'
       LEFT JOIN users u ON cc.sender_id = u.id AND cc.sender_type = 'patient'
       WHERE cc.appointment_id = $1 
       ORDER BY cc.sent_at ASC`,
      [appointmentId]
    );

    res.json(chatQuery.rows);

  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;