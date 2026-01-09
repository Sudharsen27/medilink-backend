// // controllers/appointmentController.js
// const { sendWhatsAppMessage } = require("../utils/whatsapp");

// // Example after saving appointment
// const createAppointment = async (req, res) => {
//   try {
//     const appointment = await Appointment.create(req.body);

//     // Send WhatsApp reminder
//     const msg = `Hello ${appointment.patientName}, your appointment with Dr. ${appointment.doctorName} is booked for ${appointment.date} at ${appointment.time}.`;
//     await sendWhatsAppMessage(appointment.patientPhone, msg);

//     res.status(201).json(appointment);
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// };

// // controllers/appointmentController.js
// const pool = require("../config/db");
// const nodemailer = require("nodemailer");
// const { sendWhatsAppMessage } = require("../utils/whatsapp");

// // =======================
// // Setup Nodemailer Transporter
// // =======================
// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

// // =======================
// // Create Appointment (User)
// // =======================
// exports.createAppointment = async (req, res) => {
//   const { date, time, doctorName, patientName, patientPhone } = req.body;

//   if (!date || !time || !doctorName || !patientName || !patientPhone) {
//     return res.status(400).json({ error: "All fields are required" });
//   }

//   try {
//     const userResult = await pool.query(
//       "SELECT name, email FROM users WHERE id = $1",
//       [req.user.id]
//     );

//     if (userResult.rows.length === 0) {
//       return res.status(404).json({ error: "User not found" });
//     }

//     const { name, email } = userResult.rows[0];

//     // Save appointment
//     const result = await pool.query(
//       `INSERT INTO appointments 
//         (name, email, doctor_name, patient_name, patient_phone, date, time, status, user_id) 
//        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
//       [name, email, doctorName, patientName, patientPhone, date, time, "pending", req.user.id]
//     );

//     const appointment = result.rows[0];

//     // 📧 Email Confirmation
//     await transporter.sendMail({
//       from: process.env.EMAIL_USER,
//       to: email,
//       subject: "✅ Appointment Confirmation",
//       text: `Hello ${name},\n\nYour appointment with Dr. ${doctorName} has been booked.\n📅 Date: ${date}\n⏰ Time: ${time}\n\nWe'll remind you before the appointment.`,
//     });

//     // 📧 Notify Admin
//     await transporter.sendMail({
//       from: process.env.EMAIL_USER,
//       to: process.env.CLIENT_EMAIL,
//       subject: "📢 New Appointment Booked",
//       text: `New appointment booked:\n👤 ${patientName}\n📞 ${patientPhone}\n👨‍⚕️ Dr. ${doctorName}\n📅 ${date}\n⏰ ${time}\nBooked by: ${name} (${email})`,
//     });

//     // 💬 WhatsApp reminder (optional)
//     const msg = `Hello ${patientName}, your appointment with Dr. ${doctorName} is booked for ${date} at ${time}.`;
//     await sendWhatsAppMessage(patientPhone, msg);

//     res.json(appointment);
//   } catch (err) {
//     console.error("Error creating appointment:", err);
//     res.status(500).json({ error: "Database error while creating appointment" });
//   }
// };

// // =======================
// // Get User Appointments
// // =======================
// exports.getUserAppointments = async (req, res) => {
//   try {
//     const result = await pool.query(
//       "SELECT * FROM appointments WHERE user_id = $1 ORDER BY id DESC",
//       [req.user.id]
//     );
//     res.json(result.rows);
//   } catch (err) {
//     console.error("Error fetching user appointments:", err);
//     res.status(500).json({ error: "Database error while fetching appointments" });
//   }
// };

// // =======================
// // Get All Appointments (Admin)
// // =======================
// exports.getAllAppointments = async (req, res) => {
//   try {
//     const result = await pool.query("SELECT * FROM appointments ORDER BY id DESC");
//     res.json(result.rows);
//   } catch (err) {
//     console.error("Error fetching all appointments:", err);
//     res.status(500).json({ error: "Database error while fetching all appointments" });
//   }
// };

// // =======================
// // Update Appointment (User)
// // =======================
// exports.updateAppointment = async (req, res) => {
//   const { date, time } = req.body;
//   try {
//     const result = await pool.query(
//       `UPDATE appointments 
//        SET date = $1, time = $2
//        WHERE id = $3 AND user_id = $4
//        RETURNING *`,
//       [date, time, req.params.id, req.user.id]
//     );

//     if (result.rows.length === 0) {
//       return res.status(404).json({ error: "Appointment not found or not yours" });
//     }

//     res.json(result.rows[0]);
//   } catch (err) {
//     console.error("Error updating appointment:", err);
//     res.status(500).json({ error: "Database error while updating appointment" });
//   }
// };

// // =======================
// // Delete Appointment (User)
// // =======================
// exports.deleteAppointment = async (req, res) => {
//   try {
//     const result = await pool.query(
//       "DELETE FROM appointments WHERE id = $1 AND user_id = $2 RETURNING *",
//       [req.params.id, req.user.id]
//     );

//     if (result.rows.length === 0) {
//       return res.status(404).json({ error: "Appointment not found or not yours" });
//     }

//     res.json({ success: true, deleted: result.rows[0] });
//   } catch (err) {
//     console.error("Error deleting appointment:", err);
//     res.status(500).json({ error: "Database error while deleting appointment" });
//   }
// };

// // =======================
// // Update Status (Admin)
// // =======================
// exports.updateStatus = async (req, res) => {
//   const { status } = req.body;
//   const validStatuses = ["pending", "confirmed", "cancelled"];

//   if (!validStatuses.includes(status)) {
//     return res.status(400).json({ error: "Invalid status" });
//   }

//   try {
//     const result = await pool.query(
//       "UPDATE appointments SET status = $1 WHERE id = $2 RETURNING *",
//       [status, req.params.id]
//     );

//     if (result.rows.length === 0) {
//       return res.status(404).json({ error: "Appointment not found" });
//     }

//     const appointment = result.rows[0];

//     // Fetch user's info
//     const userResult = await pool.query(
//       "SELECT name, email FROM users WHERE id = $1",
//       [appointment.user_id]
//     );

//     if (userResult.rows.length > 0) {
//       const { name, email } = userResult.rows[0];
//       const formattedDate = new Date(appointment.date).toLocaleDateString("en-IN", {
//         weekday: "short",
//         year: "numeric",
//         month: "short",
//         day: "numeric",
//       });

//       // Email update
//       await transporter.sendMail({
//         from: process.env.EMAIL_USER,
//         to: email,
//         subject: `📢 Appointment "${status}"`,
//         text: `Hello ${name},\n\nYour appointment with Dr. ${appointment.doctor_name} on ${formattedDate} at ${appointment.time} is now "${status}".\n\nThank you.`,
//       });

//       // WhatsApp update
//       const msg = `Hello ${name}, your appointment with Dr. ${appointment.doctor_name} on ${formattedDate} is now ${status}.`;
//       await sendWhatsAppMessage(appointment.patient_phone, msg);
//     }

//     res.json(appointment);
//   } catch (err) {
//     console.error("Error updating appointment status:", err);
//     res.status(500).json({ error: "Database error while updating status" });
//   }
// };

// // controllers/appointmentController.js
// const pool = require("../config/db");
// const nodemailer = require("nodemailer");
// const { sendWhatsAppMessage } = require("../utils/whatsapp");

// // 🔔 ADD THIS IMPORT (VERY IMPORTANT)
// const {
//   createNotification,
// } = require("../models/notifications");

// // =======================
// // Setup Nodemailer Transporter
// // =======================
// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

// // =======================
// // Create Appointment (User)
// // =======================
// exports.createAppointment = async (req, res) => {
//   const { date, time, doctorName, patientName, patientPhone } = req.body;

//   if (!date || !time || !doctorName || !patientName || !patientPhone) {
//     return res.status(400).json({ error: "All fields are required" });
//   }

//   try {
//     const userResult = await pool.query(
//       "SELECT name, email FROM users WHERE id = $1",
//       [req.user.id]
//     );

//     if (userResult.rows.length === 0) {
//       return res.status(404).json({ error: "User not found" });
//     }

//     const { name, email } = userResult.rows[0];

//     // Save appointment
//     const result = await pool.query(
//       `INSERT INTO appointments 
//         (name, email, doctor_name, patient_name, patient_phone, date, time, status, user_id) 
//        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
//       [
//         name,
//         email,
//         doctorName,
//         patientName,
//         patientPhone,
//         date,
//         time,
//         "pending",
//         req.user.id,
//       ]
//     );

//     const appointment = result.rows[0];

//     // 🔔 CREATE NOTIFICATION (THIS WAS MISSING)
//     await createNotification({
//       user_id: appointment.user_id,
//       type: "appointment",
//       title: "Appointment Booked",
//       message: `Your appointment with Dr. ${appointment.doctor_name} is booked for ${date} at ${time}`,
//       related_entity_type: "appointment",
//       related_entity_id: appointment.id,
//     });

//     // 📧 Email Confirmation
//     await transporter.sendMail({
//       from: process.env.EMAIL_USER,
//       to: email,
//       subject: "✅ Appointment Confirmation",
//       text: `Hello ${name},\n\nYour appointment with Dr. ${doctorName} has been booked.\n📅 Date: ${date}\n⏰ Time: ${time}\n\nWe'll remind you before the appointment.`,
//     });

//     // 📧 Notify Admin
//     await transporter.sendMail({
//       from: process.env.EMAIL_USER,
//       to: process.env.CLIENT_EMAIL,
//       subject: "📢 New Appointment Booked",
//       text: `New appointment booked:\n👤 ${patientName}\n📞 ${patientPhone}\n👨‍⚕️ Dr. ${doctorName}\n📅 ${date}\n⏰ ${time}\nBooked by: ${name} (${email})`,
//     });

//     // 💬 WhatsApp message
//     const msg = `Hello ${patientName}, your appointment with Dr. ${doctorName} is booked for ${date} at ${time}.`;
//     await sendWhatsAppMessage(patientPhone, msg);

//     res.json(appointment);
//   } catch (err) {
//     console.error("Error creating appointment:", err);
//     res.status(500).json({ error: "Database error while creating appointment" });
//   }
// };

// // =======================
// // Get User Appointments
// // =======================
// exports.getUserAppointments = async (req, res) => {
//   try {
//     const result = await pool.query(
//       "SELECT * FROM appointments WHERE user_id = $1 ORDER BY id DESC",
//       [req.user.id]
//     );
//     res.json(result.rows);
//   } catch (err) {
//     console.error("Error fetching user appointments:", err);
//     res.status(500).json({ error: "Database error while fetching appointments" });
//   }
// };

// // =======================
// // Get All Appointments (Admin)
// // =======================
// exports.getAllAppointments = async (req, res) => {
//   try {
//     const result = await pool.query("SELECT * FROM appointments ORDER BY id DESC");
//     res.json(result.rows);
//   } catch (err) {
//     console.error("Error fetching all appointments:", err);
//     res.status(500).json({ error: "Database error while fetching appointments" });
//   }
// };

// // =======================
// // Update Appointment Status (Admin)
// // =======================
// exports.updateStatus = async (req, res) => {
//   const { status } = req.body;
//   const validStatuses = ["pending", "confirmed", "cancelled"];

//   if (!validStatuses.includes(status)) {
//     return res.status(400).json({ error: "Invalid status" });
//   }

//   try {
//     const result = await pool.query(
//       "UPDATE appointments SET status = $1 WHERE id = $2 RETURNING *",
//       [status, req.params.id]
//     );

//     if (result.rows.length === 0) {
//       return res.status(404).json({ error: "Appointment not found" });
//     }

//     const appointment = result.rows[0];

//     // 🔔 CREATE STATUS UPDATE NOTIFICATION
//     await createNotification({
//       user_id: appointment.user_id,
//       type: "appointment",
//       title: "Appointment Status Updated",
//       message: `Your appointment with Dr. ${appointment.doctor_name} is now "${status}"`,
//       related_entity_type: "appointment",
//       related_entity_id: appointment.id,
//     });

//     res.json(appointment);
//   } catch (err) {
//     console.error("Error updating appointment status:", err);
//     res.status(500).json({ error: "Database error while updating status" });
//   }
// };


// controllers/appointmentController.js

const pool = require("../config/db");
const nodemailer = require("nodemailer");
const { sendWhatsAppMessage } = require("../utils/whatsapp");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");

// 🔔 Notifications
const { createNotification } = require("../models/notifications");

/* =======================
   📧 Nodemailer Setup
======================= */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/* =======================
   ➕ Create Appointment (User)
======================= */
exports.createAppointment = catchAsync(async (req, res) => {
  const { date, time, doctorName, patientName, patientPhone } = req.body;

  if (!date || !time || !doctorName || !patientName || !patientPhone) {
    throw new AppError("All fields are required", 400, "APPT_400");
  }

  // Get logged-in user
  const userResult = await pool.query(
    "SELECT name, email FROM users WHERE id = $1",
    [req.user.id]
  );

  if (!userResult.rows.length) {
    throw new AppError("User not found", 404, "USER_404");
  }

  const { name, email } = userResult.rows[0];

  // Save appointment
  const result = await pool.query(
    `INSERT INTO appointments
      (name, email, doctor_name, patient_name, patient_phone, date, time, status, user_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING *`,
    [
      name,
      email,
      doctorName,
      patientName,
      patientPhone,
      date,
      time,
      "pending",
      req.user.id,
    ]
  );

  const appointment = result.rows[0];

  // 🔔 Notification
  await createNotification({
    user_id: appointment.user_id,
    type: "appointment",
    title: "Appointment Booked",
    message: `Your appointment with Dr. ${appointment.doctor_name} is booked for ${date} at ${time}`,
    related_entity_type: "appointment",
    related_entity_id: appointment.id,
  });

  // 📧 Email to user
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "✅ Appointment Confirmation",
    text: `Hello ${name},

Your appointment with Dr. ${doctorName} has been booked.

📅 Date: ${date}
⏰ Time: ${time}

We'll remind you before the appointment.`,
  });

  // 📧 Email to admin
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: process.env.CLIENT_EMAIL,
    subject: "📢 New Appointment Booked",
    text: `New appointment booked:

👤 Patient: ${patientName}
📞 Phone: ${patientPhone}
👨‍⚕️ Doctor: Dr. ${doctorName}
📅 Date: ${date}
⏰ Time: ${time}

Booked by: ${name} (${email})`,
  });

  // 💬 WhatsApp
  await sendWhatsAppMessage(
    patientPhone,
    `Hello ${patientName}, your appointment with Dr. ${doctorName} is booked for ${date} at ${time}.`
  );

  res.status(201).json({
    success: true,
    data: appointment,
  });
});

/* =======================
   📄 Get User Appointments
======================= */
exports.getUserAppointments = catchAsync(async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM appointments WHERE user_id = $1 ORDER BY id DESC",
    [req.user.id]
  );

  res.json({
    success: true,
    data: result.rows,
  });
});

/* =======================
   📋 Get All Appointments (Admin)
======================= */
exports.getAllAppointments = catchAsync(async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM appointments ORDER BY id DESC"
  );

  res.json({
    success: true,
    data: result.rows,
  });
});

/* =======================
   🔄 Update Appointment Status (Admin)
======================= */
exports.updateAppointmentStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ["pending", "confirmed", "cancelled"];
  if (!validStatuses.includes(status)) {
    throw new AppError("Invalid appointment status", 400, "APPT_400");
  }

  const result = await pool.query(
    "UPDATE appointments SET status = $1 WHERE id = $2 RETURNING *",
    [status, id]
  );

  if (!result.rows.length) {
    throw new AppError("Appointment not found", 404, "APPT_404");
  }

  const appointment = result.rows[0];

  // 🔔 Notification
  await createNotification({
    user_id: appointment.user_id,
    type: "appointment",
    title: "Appointment Status Updated",
    message: `Your appointment with Dr. ${appointment.doctor_name} is now "${status}"`,
    related_entity_type: "appointment",
    related_entity_id: appointment.id,
  });

  res.json({
    success: true,
    message: "Appointment status updated",
    data: appointment,
  });
});
