const express = require("express");
const { body, param } = require("express-validator");
const pool = require("../config/db");
const { protect } = require("../middleware/auth");
const asyncHandler = require("../middleware/asyncHandler");
const handleValidationErrors = require("../middleware/validation");

const router = express.Router();

router.use(protect);

const appointmentAccessClause = `
  a.id = $1 AND (
    a.user_id = $2
    OR a.patient_id = $2
    OR EXISTS (
      SELECT 1 FROM doctors d
      WHERE d.id = a.doctor_id AND d.user_id = $2
    )
  )
`;

const fetchAppointmentForUser = async (appointmentId, userId) => {
  const { rows } = await pool.query(
    `
    SELECT
      a.*,
      COALESCE(a.doctor_name, d.name, 'Doctor') AS doctor_name,
      COALESCE(d.specialization, 'General Practice') AS doctor_specialization,
      COALESCE(a.appointment_date, a.date) AS appointment_date,
      COALESCE(a.appointment_time, a.time) AS appointment_time
    FROM appointments a
    LEFT JOIN doctors d ON a.doctor_id = d.id
    WHERE ${appointmentAccessClause}
    `,
    [appointmentId, userId]
  );
  return rows[0] || null;
};

router.get(
  "/:appointmentId/appointment",
  param("appointmentId").isInt(),
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const appointment = await fetchAppointmentForUser(
      req.params.appointmentId,
      req.user.id
    );

    if (!appointment) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    res.json({ success: true, data: appointment });
  })
);

router.post(
  "/:appointmentId/start",
  param("appointmentId").isInt(),
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const appointmentId = Number(req.params.appointmentId);
    const appointment = await fetchAppointmentForUser(
      appointmentId,
      req.user.id
    );

    if (!appointment) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    await pool.query(
      `UPDATE appointments SET status = 'in-progress', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [appointmentId]
    );

    const active = await pool.query(
      `SELECT * FROM telemedicine_consultations WHERE appointment_id = $1 AND status = 'active' ORDER BY id DESC LIMIT 1`,
      [appointmentId]
    );

    let consultation = active.rows[0];
    if (!consultation) {
      const { rows } = await pool.query(
        `
        INSERT INTO telemedicine_consultations
          (appointment_id, started_at, status, room_id)
        VALUES ($1, CURRENT_TIMESTAMP, 'active', $2)
        RETURNING *
        `,
        [appointmentId, `room_${appointmentId}_${Date.now()}`]
      );
      consultation = rows[0];
    }

    res.json({
      success: true,
      consultation,
      appointment,
      room_id: consultation?.room_id,
    });
  })
);

router.post(
  "/:appointmentId/end",
  param("appointmentId").isInt(),
  body("duration").optional().isInt(),
  body("notes").optional().isString(),
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const appointmentId = Number(req.params.appointmentId);
    const appointment = await fetchAppointmentForUser(
      appointmentId,
      req.user.id
    );

    if (!appointment) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    const { duration, notes } = req.body;

    await pool.query(
      `
      UPDATE telemedicine_consultations
      SET ended_at = CURRENT_TIMESTAMP, status = 'completed', duration = $1, notes = $2
      WHERE appointment_id = $3 AND status = 'active'
      `,
      [duration || null, notes || null, appointmentId]
    );

    await pool.query(
      `UPDATE appointments SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [appointmentId]
    );

    res.json({ success: true, message: "Consultation ended successfully" });
  })
);

router.get(
  "/:appointmentId",
  param("appointmentId").isInt(),
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const appointmentId = Number(req.params.appointmentId);
    const appointment = await fetchAppointmentForUser(
      appointmentId,
      req.user.id
    );

    if (!appointment) {
      return res.status(404).json({ success: false, message: "Consultation not found" });
    }

    const { rows } = await pool.query(
      `SELECT * FROM telemedicine_consultations WHERE appointment_id = $1 ORDER BY id DESC LIMIT 1`,
      [appointmentId]
    );

    res.json({
      success: true,
      data: {
        ...appointment,
        consultation: rows[0] || null,
      },
    });
  })
);

router.post(
  "/:appointmentId/chat",
  param("appointmentId").isInt(),
  body("message").isString().trim().notEmpty(),
  body("sender_type").isIn(["doctor", "patient"]),
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const appointmentId = Number(req.params.appointmentId);
    const appointment = await fetchAppointmentForUser(
      appointmentId,
      req.user.id
    );

    if (!appointment) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    const { message, sender_type } = req.body;

    const { rows } = await pool.query(
      `
      INSERT INTO consultation_chats
        (appointment_id, sender_type, sender_id, message, sent_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      RETURNING *
      `,
      [appointmentId, sender_type, req.user.id, message]
    );

    res.status(201).json({ success: true, data: rows[0] });
  })
);

router.get(
  "/:appointmentId/chat",
  param("appointmentId").isInt(),
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const appointmentId = Number(req.params.appointmentId);
    const appointment = await fetchAppointmentForUser(
      appointmentId,
      req.user.id
    );

    if (!appointment) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    const { rows } = await pool.query(
      `
      SELECT cc.*, u.name AS sender_name
      FROM consultation_chats cc
      LEFT JOIN users u ON cc.sender_id = u.id
      WHERE cc.appointment_id = $1
      ORDER BY cc.sent_at ASC
      `,
      [appointmentId]
    );

    res.json({ success: true, data: rows });
  })
);

module.exports = router;
