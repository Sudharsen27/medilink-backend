

// const express = require("express");
// const router = express.Router();
// const pool = require("../config/db");
// const { protect } = require("../middleware/auth");
// const verifyAdmin = require("../middleware/admin");
// const nodemailer = require("nodemailer");

// // ===================================
// // 📧 Email Transporter
// // ===================================
// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

// // ===================================
// // 🩵 Create Appointment (Logged-in User)
// // ===================================
// router.post("/", protect, async (req, res) => {
//   const { date, time, doctorName, patientName, patientPhone } = req.body;

//   if (!date || !time || !doctorName || !patientName || !patientPhone) {
//     return res.status(400).json({ error: "All fields are required" });
//   }

//   try {
//     const userId = req.user.id;

//     const userResult = await pool.query(
//       "SELECT name, email FROM users WHERE id = $1",
//       [userId]
//     );

//     if (userResult.rows.length === 0) {
//       return res.status(404).json({ error: "User not found" });
//     }

//     const { name, email } = userResult.rows[0];

//     // Insert appointment
//     const result = await pool.query(
//       `INSERT INTO appointments 
//         (name, email, doctor_name, patient_name, patient_phone, date, time, status, user_id)
//        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
//        RETURNING *`,
//       [name, email, doctorName, patientName, patientPhone, date, time, "pending", userId]
//     );

//     const appointment = result.rows[0];

//     // 🔔 Create Notification
//     await pool.query(
//       `INSERT INTO notifications (user_id, type, title, message, priority, related_entity_type, related_entity_id)
//        VALUES ($1,'appointment','Appointment Booked',
//        'Your appointment has been scheduled successfully','medium','appointment',$2)`,
//       [userId, appointment.id]
//     );

//     // ✉️ Confirmation Email
//     await transporter.sendMail({
//       from: process.env.EMAIL_USER,
//       to: email,
//       subject: "✅ Appointment Confirmation",
//       text: `Hello ${name},
// Your appointment with Dr. ${doctorName} has been booked.

// 📅 Date: ${date}
// ⏰ Time: ${time}

// Thank you for using Medilink!`,
//     });

//     // Notify Admin
//     if (process.env.CLIENT_EMAIL) {
//       await transporter.sendMail({
//         from: process.env.EMAIL_USER,
//         to: process.env.CLIENT_EMAIL,
//         subject: "📢 New Appointment Booked",
//         text: `
// A new appointment has been booked:

// 👤 Patient: ${patientName}
// 📞 Phone: ${patientPhone}
// 👨‍⚕️ Doctor: ${doctorName}
// 📅 Date: ${date}
// ⏰ Time: ${time}
// Booked by: ${name} (${email})
//         `,
//       });
//     }

//     res.status(201).json(appointment);
//   } catch (err) {
//     console.error("❌ Error creating appointment:", err);
//     res.status(500).json({ error: "Error creating appointment" });
//   }
// });

// // ===================================
// // 📋 Get User’s Appointments
// // ===================================
// router.get("/", protect, async (req, res) => {
//   try {
//     const result = await pool.query(
//       "SELECT * FROM appointments WHERE user_id = $1 ORDER BY id DESC",
//       [req.user.id]
//     );

//     res.json(result.rows);
//   } catch (err) {
//     console.error("❌ Error fetching appointments:", err);
//     res.status(500).json({ error: "Error fetching appointments" });
//   }
// });

// // ===================================
// // 🛡️ Admin: Get All Appointments
// // ===================================
// router.get("/all", protect, verifyAdmin, async (req, res) => {
//   try {
//     const result = await pool.query("SELECT * FROM appointments ORDER BY id DESC");
//     res.json(result.rows);
//   } catch (err) {
//     console.error("❌ Error fetching all appointments:", err);
//     res.status(500).json({ error: "Error fetching all appointments" });
//   }
// });

// // ===================================
// // ✏️ Update Appointment (User Only)
// // ===================================
// router.put("/:id", protect, async (req, res) => {
//   const { date, time } = req.body;

//   try {
//     const result = await pool.query(
//       `UPDATE appointments SET date=$1, time=$2
//        WHERE id=$3 AND user_id=$4
//        RETURNING *`,
//       [date, time, req.params.id, req.user.id]
//     );

//     if (result.rows.length === 0) {
//       return res.status(404).json({ error: "Appointment not found or not yours" });
//     }

//     const appointment = result.rows[0];

//     // 🔔 Notification
//     await pool.query(
//       `INSERT INTO notifications (user_id,type,title,message,priority,related_entity_type,related_entity_id)
//        VALUES ($1,'appointment','Appointment Updated',
//        'Your appointment date/time was updated','medium','appointment',$2)`,
//       [req.user.id, appointment.id]
//     );

//     res.json(appointment);
//   } catch (err) {
//     console.error("❌ Error updating appointment:", err);
//     res.status(500).json({ error: "Error updating appointment" });
//   }
// });

// // ===================================
// // ❌ Delete Appointment
// // ===================================
// router.delete("/:id", protect, async (req, res) => {
//   try {
//     const result = await pool.query(
//       "DELETE FROM appointments WHERE id = $1 AND user_id = $2 RETURNING *",
//       [req.params.id, req.user.id]
//     );

//     if (result.rows.length === 0) {
//       return res.status(404).json({ error: "Appointment not found or not yours" });
//     }

//     const deleted = result.rows[0];

//     // 🔔 Notification
//     await pool.query(
//       `INSERT INTO notifications (user_id,type,title,message,priority,related_entity_type,related_entity_id)
//        VALUES ($1,'appointment','Appointment Deleted',
//        'Your appointment has been cancelled','medium','appointment',$2)`,
//       [req.user.id, deleted.id]
//     );

//     res.json({ success: true, deleted });
//   } catch (err) {
//     console.error("❌ Error deleting appointment:", err);
//     res.status(500).json({ error: "Error deleting appointment" });
//   }
// });

// // ===================================
// // 🧭 Update Appointment Status
// // ===================================
// router.patch("/:id/status", protect, async (req, res) => {
//   const { status } = req.body;
//   const validStatuses = ["pending", "scheduled", "confirmed", "completed", "cancelled"];

//   if (!status || !validStatuses.includes(status)) {
//     return res.status(400).json({ error: "Invalid status" });
//   }

//   try {
//     let result;

//     if (req.user.role === "admin") {
//       result = await pool.query(
//         "UPDATE appointments SET status=$1 WHERE id=$2 RETURNING *",
//         [status, req.params.id]
//       );
//     } else {
//       result = await pool.query(
//         "UPDATE appointments SET status=$1 WHERE id=$2 AND user_id=$3 RETURNING *",
//         [status, req.params.id, req.user.id]
//       );
//     }

//     if (result.rows.length === 0) {
//       return res.status(403).json({ error: "Not authorized or appointment not found" });
//     }

//     const appointment = result.rows[0];

//     // 🔔 Notification
//     await pool.query(
//       `INSERT INTO notifications (user_id,type,title,message,priority,related_entity_type,related_entity_id)
//        VALUES ($1,'appointment','Appointment Status Updated',
//        'Your appointment status is now: ${status}','medium','appointment',$2)`,
//       [appointment.user_id, appointment.id]
//     );

//     res.json(appointment);
//   } catch (err) {
//     console.error("❌ Error updating status:", err);
//     res.status(500).json({ error: "Error updating appointment status" });
//   }
// });

// module.exports = router;

// const express = require("express");
// const router = express.Router();
// const pool = require("../config/db");
// const { protect } = require("../middleware/auth");
// const verifyAdmin = require("../middleware/admin");
// const nodemailer = require("nodemailer");

// // ===================================
// // 📧 Email Transporter
// // ===================================
// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

// // ===================================
// // 🩵 Create Appointment (Logged-in User)
// // ===================================
// router.post("/", protect, async (req, res) => {
//   const { date, time, doctorName, patientName, patientPhone } = req.body;

//   if (!date || !time || !doctorName || !patientName || !patientPhone) {
//     return res.status(400).json({ error: "All fields are required" });
//   }

//   try {
//     const userId = req.user.id;

//     const userResult = await pool.query(
//       "SELECT name, email FROM users WHERE id = $1",
//       [userId]
//     );

//     if (userResult.rows.length === 0) {
//       return res.status(404).json({ error: "User not found" });
//     }

//     const { name, email } = userResult.rows[0];

//     const result = await pool.query(
//       `INSERT INTO appointments 
//        (name, email, doctor_name, patient_name, patient_phone, date, time, status, user_id)
//        VALUES ($1,$2,$3,$4,$5,$6,$7,'pending',$8)
//        RETURNING *`,
//       [name, email, doctorName, patientName, patientPhone, date, time, userId]
//     );

//     const appointment = result.rows[0];

//     // 🔔 Notification
//     await pool.query(
//       `INSERT INTO notifications 
//        (user_id,type,title,message,priority,related_entity_type,related_entity_id)
//        VALUES ($1,'appointment','Appointment Booked',
//        'Your appointment has been booked successfully','medium','appointment',$2)`,
//       [userId, appointment.id]
//     );

//     // ✉️ Email to User
//     await transporter.sendMail({
//       from: process.env.EMAIL_USER,
//       to: email,
//       subject: "✅ Appointment Confirmation",
//       text: `Hello ${name},

// Your appointment with Dr. ${doctorName} has been booked.

// 📅 Date: ${date}
// ⏰ Time: ${time}

// Thank you for using Medilink!`,
//     });

//     // ✉️ Email to Admin
//     if (process.env.CLIENT_EMAIL) {
//       await transporter.sendMail({
//         from: process.env.EMAIL_USER,
//         to: process.env.CLIENT_EMAIL,
//         subject: "📢 New Appointment Booked",
//         text: `
// Patient: ${patientName}
// Phone: ${patientPhone}
// Doctor: ${doctorName}
// Date: ${date}
// Time: ${time}
// Booked by: ${name} (${email})
//         `,
//       });
//     }

//     res.status(201).json(appointment);
//   } catch (err) {
//     console.error("❌ Create appointment error:", err);
//     res.status(500).json({ error: "Error creating appointment" });
//   }
// });

// // ===================================
// // 📋 Get User Appointments
// // ===================================
// router.get("/", protect, async (req, res) => {
//   try {
//     const result = await pool.query(
//       "SELECT * FROM appointments WHERE user_id=$1 ORDER BY id DESC",
//       [req.user.id]
//     );
//     res.json(result.rows);
//   } catch (err) {
//     res.status(500).json({ error: "Error fetching appointments" });
//   }
// });

// // ===================================
// // 🛡️ Admin: Get All Appointments
// // ===================================
// router.get("/all", protect, verifyAdmin, async (req, res) => {
//   try {
//     const result = await pool.query(
//       "SELECT * FROM appointments ORDER BY id DESC"
//     );
//     res.json(result.rows);
//   } catch (err) {
//     res.status(500).json({ error: "Error fetching appointments" });
//   }
// });

// // ===================================
// // ✏️ Update Appointment (User)
// // ===================================
// router.put("/:id", protect, async (req, res) => {
//   const { date, time } = req.body;

//   try {
//     const result = await pool.query(
//       `UPDATE appointments 
//        SET date=$1, time=$2 
//        WHERE id=$3 AND user_id=$4
//        RETURNING *`,
//       [date, time, req.params.id, req.user.id]
//     );

//     if (!result.rows.length) {
//       return res.status(404).json({ error: "Appointment not found or unauthorized" });
//     }

//     res.json(result.rows[0]);
//   } catch (err) {
//     res.status(500).json({ error: "Error updating appointment" });
//   }
// });

// // ===================================
// // ❌ Delete Appointment (User)
// // ===================================
// router.delete("/:id", protect, async (req, res) => {
//   try {
//     const result = await pool.query(
//       "DELETE FROM appointments WHERE id=$1 AND user_id=$2 RETURNING *",
//       [req.params.id, req.user.id]
//     );

//     if (!result.rows.length) {
//       return res.status(404).json({ error: "Appointment not found or unauthorized" });
//     }

//     res.json({ success: true });
//   } catch (err) {
//     res.status(500).json({ error: "Error deleting appointment" });
//   }
// });

// // ===================================
// // 🧭 Update Appointment Status (ADMIN ONLY)
// // ===================================
// router.patch("/:id/status", protect, verifyAdmin, async (req, res) => {
//   const { status } = req.body;
//   const allowedStatuses = ["confirmed", "cancelled", "completed"];

//   if (!allowedStatuses.includes(status)) {
//     return res.status(400).json({ error: "Invalid status" });
//   }

//   try {
//     const result = await pool.query(
//       "UPDATE appointments SET status=$1 WHERE id=$2 RETURNING *",
//       [status, req.params.id]
//     );

//     if (!result.rows.length) {
//       return res.status(404).json({ error: "Appointment not found" });
//     }

//     const appointment = result.rows[0];

//     // 🔔 Notify User
//     await pool.query(
//       `INSERT INTO notifications
//        (user_id,type,title,message,priority,related_entity_type,related_entity_id)
//        VALUES ($1,'appointment','Status Updated',
//        'Your appointment is now ${status}','medium','appointment',$2)`,
//       [appointment.user_id, appointment.id]
//     );

//     res.json({
//       success: true,
//       message: "Appointment status updated",
//       appointment,
//     });
//   } catch (err) {
//     console.error("❌ Status update error:", err);
//     res.status(500).json({ error: "Server error" });
//   }
// });

// module.exports = router;


// const express = require("express");
// const router = express.Router();
// const pool = require("../config/db");
// const { protect } = require("../middleware/auth");
// const verifyAdmin = require("../middleware/admin");
// const nodemailer = require("nodemailer");

// // ===================================
// // 📧 Email Transporter
// // ===================================
// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

// // ===================================
// // 🩵 Create Appointment (Logged-in User)
// // ===================================
// router.post("/", protect, async (req, res) => {
//   const { date, time, doctorName, patientName, patientPhone } = req.body;

//   if (!date || !time || !doctorName || !patientName || !patientPhone) {
//     return res.status(400).json({ error: "All fields are required" });
//   }

//   try {
//     const userId = req.user.id;

//     const userResult = await pool.query(
//       "SELECT name, email FROM users WHERE id = $1",
//       [userId]
//     );

//     if (!userResult.rows.length) {
//       return res.status(404).json({ error: "User not found" });
//     }

//     const { name, email } = userResult.rows[0];

//     const result = await pool.query(
//       `INSERT INTO appointments
//        (name, email, doctor_name, patient_name, patient_phone, date, time, status, user_id)
//        VALUES ($1,$2,$3,$4,$5,$6,$7,'pending',$8)
//        RETURNING *`,
//       [name, email, doctorName, patientName, patientPhone, date, time, userId]
//     );

//     const appointment = result.rows[0];

//     // 🔔 Notification
//     await pool.query(
//       `INSERT INTO notifications
//        (user_id,type,title,message,priority,related_entity_type,related_entity_id)
//        VALUES ($1,'appointment','Appointment Booked',
//        'Your appointment has been booked successfully','medium','appointment',$2)`,
//       [userId, appointment.id]
//     );

//     // ✉️ Email to User
//     await transporter.sendMail({
//       from: process.env.EMAIL_USER,
//       to: email,
//       subject: "✅ Appointment Confirmation",
//       text: `Hello ${name},

// Your appointment with Dr. ${doctorName} has been booked.

// 📅 Date: ${date}
// ⏰ Time: ${time}

// Thank you for using Medilink!`,
//     });

//     // ✉️ Email to Admin
//     if (process.env.CLIENT_EMAIL) {
//       await transporter.sendMail({
//         from: process.env.EMAIL_USER,
//         to: process.env.CLIENT_EMAIL,
//         subject: "📢 New Appointment Booked",
//         text: `
// Patient: ${patientName}
// Phone: ${patientPhone}
// Doctor: ${doctorName}
// Date: ${date}
// Time: ${time}
// Booked by: ${name} (${email})
//         `,
//       });
//     }

//     res.status(201).json(appointment);
//   } catch (err) {
//     console.error("❌ Create appointment error:", err);
//     res.status(500).json({ error: "Error creating appointment" });
//   }
// });

// // ===================================
// // 📋 Get User Appointments
// // ===================================
// router.get("/", protect, async (req, res) => {
//   try {
//     const result = await pool.query(
//       "SELECT * FROM appointments WHERE user_id=$1 ORDER BY id DESC",
//       [req.user.id]
//     );
//     res.json(result.rows);
//   } catch (err) {
//     res.status(500).json({ error: "Error fetching appointments" });
//   }
// });

// // ===================================
// // 🛡️ Admin: Get All Appointments
// // ===================================
// router.get("/all", protect, verifyAdmin, async (req, res) => {
//   try {
//     const result = await pool.query(
//       "SELECT * FROM appointments ORDER BY id DESC"
//     );
//     res.json(result.rows);
//   } catch (err) {
//     res.status(500).json({ error: "Error fetching appointments" });
//   }
// });

// // ===================================
// // ✏️ Update Appointment (User)
// // ===================================
// router.put("/:id", protect, async (req, res) => {
//   const { date, time } = req.body;

//   try {
//     const result = await pool.query(
//       `UPDATE appointments
//        SET date=$1, time=$2
//        WHERE id=$3 AND user_id=$4
//        RETURNING *`,
//       [date, time, req.params.id, req.user.id]
//     );

//     if (!result.rows.length) {
//       return res
//         .status(404)
//         .json({ error: "Appointment not found or unauthorized" });
//     }

//     res.json(result.rows[0]);
//   } catch (err) {
//     res.status(500).json({ error: "Error updating appointment" });
//   }
// });

// // ===================================
// // ❌ Delete Appointment (USER or ADMIN)
// // ===================================
// router.delete("/:id", protect, async (req, res) => {
//   try {
//     let result;

//     if (req.user.role === "admin") {
//       // ✅ Admin can delete ANY appointment
//       result = await pool.query(
//         "DELETE FROM appointments WHERE id=$1 RETURNING *",
//         [req.params.id]
//       );
//     } else {
//       // ✅ User can delete ONLY their appointment
//       result = await pool.query(
//         "DELETE FROM appointments WHERE id=$1 AND user_id=$2 RETURNING *",
//         [req.params.id, req.user.id]
//       );
//     }

//     if (!result.rows.length) {
//       return res
//         .status(404)
//         .json({ error: "Appointment not found or unauthorized" });
//     }

//     res.json({ success: true });
//   } catch (err) {
//     console.error("❌ Delete error:", err);
//     res.status(500).json({ error: "Error deleting appointment" });
//   }
// });

// // ===================================
// // 🧭 Update Appointment Status (ADMIN ONLY)
// // ===================================
// router.patch("/:id/status", protect, verifyAdmin, async (req, res) => {
//   const { status } = req.body;
//   const allowedStatuses = ["confirmed", "cancelled", "completed"];

//   if (!allowedStatuses.includes(status)) {
//     return res.status(400).json({ error: "Invalid status" });
//   }

//   try {
//     const result = await pool.query(
//       "UPDATE appointments SET status=$1 WHERE id=$2 RETURNING *",
//       [status, req.params.id]
//     );

//     if (!result.rows.length) {
//       return res.status(404).json({ error: "Appointment not found" });
//     }

//     const appointment = result.rows[0];

//     // 🔔 Notify User
//     await pool.query(
//       `INSERT INTO notifications
//        (user_id,type,title,message,priority,related_entity_type,related_entity_id)
//        VALUES ($1,'appointment','Status Updated',
//        'Your appointment is now ${status}','medium','appointment',$2)`,
//       [appointment.user_id, appointment.id]
//     );

//     res.json({
//       success: true,
//       message: "Appointment status updated",
//       appointment,
//     });
//   } catch (err) {
//     console.error("❌ Status update error:", err);
//     res.status(500).json({ error: "Server error" });
//   }
// });

// module.exports = router;


// const express = require("express");
// const router = express.Router();
// const pool = require("../config/db");
// const { protect } = require("../middleware/auth");
// const verifyAdmin = require("../middleware/admin");
// const nodemailer = require("nodemailer");
// const { appointmentStatusTemplate } = require("../utils/emailTemplates");



// // ===================================
// // 📧 Email Transporter
// // ===================================
// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

// // ===================================
// // 🩵 Create Appointment (Logged-in User)
// // ===================================
// router.post("/", protect, async (req, res) => {
//   const { date, time, doctorName, patientName, patientPhone } = req.body;

//   if (!date || !time || !doctorName || !patientName || !patientPhone) {
//     return res.status(400).json({ error: "All fields are required" });
//   }

//   try {
//     const userId = req.user.id;

//     const userResult = await pool.query(
//       "SELECT name, email FROM users WHERE id=$1",
//       [userId]
//     );

//     if (!userResult.rows.length) {
//       return res.status(404).json({ error: "User not found" });
//     }

//     const { name, email } = userResult.rows[0];

//     const result = await pool.query(
//       `INSERT INTO appointments
//        (name, email, doctor_name, patient_name, patient_phone, date, time, status, user_id)
//        VALUES ($1,$2,$3,$4,$5,$6,$7,'pending',$8)
//        RETURNING *`,
//       [name, email, doctorName, patientName, patientPhone, date, time, userId]
//     );

//     const appointment = result.rows[0];

//     // 🔔 Notification
//     await pool.query(
//       `INSERT INTO notifications
//        (user_id,type,title,message,priority,related_entity_type,related_entity_id)
//        VALUES ($1,'appointment','Appointment Booked',
//        'Your appointment has been booked successfully','medium','appointment',$2)`,
//       [userId, appointment.id]
//     );

//     // ✉️ Email to User
//     await transporter.sendMail({
//       from: process.env.EMAIL_USER,
//       to: email,
//       subject: "✅ Appointment Booked",
//       text: `Hello ${name},

// Your appointment with Dr. ${doctorName} has been booked.

// 📅 Date: ${date}
// ⏰ Time: ${time}

// Thank you for using Medilink!`,
//     });

//     res.status(201).json(appointment);
//   } catch (err) {
//     console.error("❌ Create appointment error:", err);
//     res.status(500).json({ error: "Error creating appointment" });
//   }
// });

// // ===================================
// // 📋 Get User Appointments
// // ===================================
// router.get("/", protect, async (req, res) => {
//   try {
//     const result = await pool.query(
//       "SELECT * FROM appointments WHERE user_id=$1 ORDER BY id DESC",
//       [req.user.id]
//     );
//     res.json(result.rows);
//   } catch (err) {
//     res.status(500).json({ error: "Error fetching appointments" });
//   }
// });

// // ===================================
// // 🛡️ Admin: Get All Appointments
// // ===================================
// router.get("/all", protect, verifyAdmin, async (req, res) => {
//   try {
//     const result = await pool.query(
//       "SELECT * FROM appointments ORDER BY id DESC"
//     );
//     res.json(result.rows);
//   } catch (err) {
//     res.status(500).json({ error: "Error fetching appointments" });
//   }
// });

// // ===================================
// // ✏️ Update Appointment (User)
// // ===================================
// router.put("/:id", protect, async (req, res) => {
//   const { date, time } = req.body;

//   try {
//     const result = await pool.query(
//       `UPDATE appointments
//        SET date=$1, time=$2
//        WHERE id=$3 AND user_id=$4
//        RETURNING *`,
//       [date, time, req.params.id, req.user.id]
//     );

//     if (!result.rows.length) {
//       return res
//         .status(404)
//         .json({ error: "Appointment not found or unauthorized" });
//     }

//     res.json(result.rows[0]);
//   } catch (err) {
//     res.status(500).json({ error: "Error updating appointment" });
//   }
// });

// // ===================================
// // ❌ Delete Appointment (USER or ADMIN)
// // ===================================
// router.delete("/:id", protect, async (req, res) => {
//   try {
//     let result;

//     if (req.user.role === "admin") {
//       result = await pool.query(
//         "DELETE FROM appointments WHERE id=$1 RETURNING *",
//         [req.params.id]
//       );
//     } else {
//       result = await pool.query(
//         "DELETE FROM appointments WHERE id=$1 AND user_id=$2 RETURNING *",
//         [req.params.id, req.user.id]
//       );
//     }

//     if (!result.rows.length) {
//       return res
//         .status(404)
//         .json({ error: "Appointment not found or unauthorized" });
//     }

//     res.json({ success: true });
//   } catch (err) {
//     console.error("❌ Delete error:", err);
//     res.status(500).json({ error: "Error deleting appointment" });
//   }
// });

// // ===================================
// // 🧭 Update Appointment Status (ADMIN ONLY + EMAIL)
// // ===================================
// router.patch("/:id/status", protect, verifyAdmin, async (req, res) => {
//   const { status } = req.body;
//   const allowedStatuses = ["confirmed", "cancelled", "completed"];

//   if (!allowedStatuses.includes(status)) {
//     return res.status(400).json({ error: "Invalid status" });
//   }

//   try {
//     // 1️⃣ Update status
//     const result = await pool.query(
//       "UPDATE appointments SET status=$1 WHERE id=$2 RETURNING *",
//       [status, req.params.id]
//     );

//     if (!result.rows.length) {
//       return res.status(404).json({ error: "Appointment not found" });
//     }

//     const appointment = result.rows[0];

//     // 2️⃣ Get user details
//     const userResult = await pool.query(
//       "SELECT name, email FROM users WHERE id=$1",
//       [appointment.user_id]
//     );

//     if (!userResult.rows.length) {
//       return res.status(404).json({ error: "User not found" });
//     }

//     const { name, email } = userResult.rows[0];

//     // 3️⃣ Email content
//     let subject = "";
//     let message = "";

//     if (status === "confirmed") {
//       subject = "✅ Appointment Confirmed";
//       message = `Hello ${name},

// Your appointment has been CONFIRMED.

// 👨‍⚕️ Doctor: ${appointment.doctor_name}
// 📅 Date: ${appointment.date}
// ⏰ Time: ${appointment.time}

// Thank you for using Medilink.`;
//     }

//     if (status === "cancelled") {
//       subject = "❌ Appointment Cancelled";
//       message = `Hello ${name},

// Your appointment has been CANCELLED.

// 👨‍⚕️ Doctor: ${appointment.doctor_name}
// 📅 Date: ${appointment.date}
// ⏰ Time: ${appointment.time}

// You may rebook anytime from the app.`;
//     }

//     if (status === "completed") {
//       subject = "🎉 Appointment Completed";
//       message = `Hello ${name},

// Your appointment has been marked as COMPLETED.

// Thank you for choosing Medilink.`;
//     }

//     // 4️⃣ Send email
//     await transporter.sendMail({
//   from: `"Medilink" <${process.env.EMAIL_USER}>`,
//   to: email,
//   subject,
//   html: appointmentStatusTemplate({
//     name,
//     status,
//     doctor: appointment.doctor_name,
//     date: appointment.date,
//     time: appointment.time,
//   }),
// });


//     // 5️⃣ Notification
//     await pool.query(
//       `INSERT INTO notifications
//        (user_id,type,title,message,priority,related_entity_type,related_entity_id)
//        VALUES ($1,'appointment','Status Updated',
//        'Your appointment is now ${status}','medium','appointment',$2)`,
//       [appointment.user_id, appointment.id]
//     );

//     res.json({
//       success: true,
//       message: `Appointment ${status} and email sent`,
//       appointment,
//     });
//   } catch (err) {
//     console.error("❌ Status update error:", err);
//     res.status(500).json({ error: "Server error" });
//   }
// });

// module.exports = router;


// const express = require("express");
// const router = express.Router();
// const pool = require("../config/db");
// const { protect } = require("../middleware/auth");
// const verifyAdmin = require("../middleware/admin");
// const nodemailer = require("nodemailer");

// const {
//   appointmentStatusTemplate,
//   appointmentRescheduleTemplate,
// } = require("../utils/emailTemplates");

// // ===================================
// // 📧 Email Transporter
// // ===================================
// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

// // ===================================
// // 🩵 Create Appointment (Logged-in User)
// // ===================================
// router.post("/", protect, async (req, res) => {
//   const { date, time, doctorName, patientName, patientPhone } = req.body;

//   if (!date || !time || !doctorName || !patientName || !patientPhone) {
//     return res.status(400).json({ error: "All fields are required" });
//   }

//   try {
//     const userId = req.user.id;

//     const userResult = await pool.query(
//       "SELECT name, email FROM users WHERE id=$1",
//       [userId]
//     );

//     if (!userResult.rows.length) {
//       return res.status(404).json({ error: "User not found" });
//     }

//     const { name, email } = userResult.rows[0];

//     const result = await pool.query(
//       `INSERT INTO appointments
//        (name, email, doctor_name, patient_name, patient_phone, date, time, status, user_id)
//        VALUES ($1,$2,$3,$4,$5,$6,$7,'pending',$8)
//        RETURNING *`,
//       [name, email, doctorName, patientName, patientPhone, date, time, userId]
//     );

//     const appointment = result.rows[0];

//     await pool.query(
//       `INSERT INTO notifications
//        (user_id,type,title,message,priority,related_entity_type,related_entity_id)
//        VALUES ($1,'appointment','Appointment Booked',
//        'Your appointment has been booked successfully','medium','appointment',$2)`,
//       [userId, appointment.id]
//     );

//     await transporter.sendMail({
//       from: `"Medilink" <${process.env.EMAIL_USER}>`,
//       to: email,
//       subject: "✅ Appointment Booked",
//       text: `Hello ${name},

// Your appointment with Dr. ${doctorName} has been booked.

// 📅 Date: ${date}
// ⏰ Time: ${time}

// Thank you for using Medilink!`,
//     });

//     res.status(201).json(appointment);
//   } catch (err) {
//     console.error("❌ Create appointment error:", err);
//     res.status(500).json({ error: "Error creating appointment" });
//   }
// });

// // ===================================
// // 📋 Get User Appointments
// // ===================================
// router.get("/", protect, async (req, res) => {
//   try {
//     const result = await pool.query(
//       "SELECT * FROM appointments WHERE user_id=$1 ORDER BY id DESC",
//       [req.user.id]
//     );
//     res.json(result.rows);
//   } catch (err) {
//     res.status(500).json({ error: "Error fetching appointments" });
//   }
// });

// // ===================================
// // 🛡️ Admin: Get All Appointments
// // ===================================
// router.get("/all", protect, verifyAdmin, async (req, res) => {
//   try {
//     const result = await pool.query(
//       "SELECT * FROM appointments ORDER BY id DESC"
//     );
//     res.json(result.rows);
//   } catch (err) {
//     res.status(500).json({ error: "Error fetching appointments" });
//   }
// });

// // ===================================
// // 🔁 Reschedule Appointment (USER or ADMIN)
// // ===================================
// router.put("/:id", protect, async (req, res) => {
//   const { date, time } = req.body;

//   if (!date || !time) {
//     return res.status(400).json({ error: "Date and time are required" });
//   }

//   try {
//     let existing;

//     // ✅ ADMIN can reschedule ANY appointment
//     if (req.user.role === "admin") {
//       existing = await pool.query(
//         "SELECT * FROM appointments WHERE id=$1",
//         [req.params.id]
//       );
//     } 
//     // ✅ USER can reschedule ONLY their appointment
//     else {
//       existing = await pool.query(
//         "SELECT * FROM appointments WHERE id=$1 AND user_id=$2",
//         [req.params.id, req.user.id]
//       );
//     }

//     if (!existing.rows.length) {
//       return res
//         .status(404)
//         .json({ error: "Appointment not found or unauthorized" });
//     }

//     const oldAppointment = existing.rows[0];

//     const updated = await pool.query(
//       `UPDATE appointments
//        SET date=$1, time=$2
//        WHERE id=$3
//        RETURNING *`,
//       [date, time, req.params.id]
//     );

//     const updatedAppointment = updated.rows[0];

//     // 🔍 get appointment user details (IMPORTANT for admin)
//     const userResult = await pool.query(
//       "SELECT name, email FROM users WHERE id=$1",
//       [updatedAppointment.user_id]
//     );

//     const { name, email } = userResult.rows[0];

//     // 📧 Send reschedule email
//     await transporter.sendMail({
//       from: `"Medilink" <${process.env.EMAIL_USER}>`,
//       to: email,
//       subject: "🔁 Appointment Rescheduled",
//       html: appointmentRescheduleTemplate({
//         name,
//         doctor: updatedAppointment.doctor_name,
//         oldDate: oldAppointment.date,
//         oldTime: oldAppointment.time,
//         newDate: updatedAppointment.date,
//         newTime: updatedAppointment.time,
//       }),
//     });

//     // 🔔 Notification
//     await pool.query(
//       `INSERT INTO notifications
//        (user_id,type,title,message,priority,related_entity_type,related_entity_id)
//        VALUES ($1,'appointment','Appointment Rescheduled',
//        'Your appointment has been rescheduled','medium','appointment',$2)`,
//       [updatedAppointment.user_id, updatedAppointment.id]
//     );

//     res.json(updatedAppointment);
//   } catch (err) {
//     console.error("❌ Reschedule error:", err);
//     res.status(500).json({ error: "Error rescheduling appointment" });
//   }
// });

// // ===================================
// // ❌ Delete Appointment (USER or ADMIN)
// // ===================================
// router.delete("/:id", protect, async (req, res) => {
//   try {
//     let result;

//     if (req.user.role === "admin") {
//       result = await pool.query(
//         "DELETE FROM appointments WHERE id=$1 RETURNING *",
//         [req.params.id]
//       );
//     } else {
//       result = await pool.query(
//         "DELETE FROM appointments WHERE id=$1 AND user_id=$2 RETURNING *",
//         [req.params.id, req.user.id]
//       );
//     }

//     if (!result.rows.length) {
//       return res
//         .status(404)
//         .json({ error: "Appointment not found or unauthorized" });
//     }

//     res.json({ success: true });
//   } catch (err) {
//     console.error("❌ Delete error:", err);
//     res.status(500).json({ error: "Error deleting appointment" });
//   }
// });

// // ===================================
// // 🧭 Update Appointment Status (ADMIN + HTML EMAIL)
// // ===================================
// router.patch("/:id/status", protect, verifyAdmin, async (req, res) => {
//   const { status } = req.body;
//   const allowedStatuses = ["confirmed", "cancelled", "completed"];

//   if (!allowedStatuses.includes(status)) {
//     return res.status(400).json({ error: "Invalid status" });
//   }

//   try {
//     const result = await pool.query(
//       "UPDATE appointments SET status=$1 WHERE id=$2 RETURNING *",
//       [status, req.params.id]
//     );

//     if (!result.rows.length) {
//       return res.status(404).json({ error: "Appointment not found" });
//     }

//     const appointment = result.rows[0];

//     const userResult = await pool.query(
//       "SELECT name, email FROM users WHERE id=$1",
//       [appointment.user_id]
//     );

//     const { name, email } = userResult.rows[0];

//     await transporter.sendMail({
//       from: `"Medilink" <${process.env.EMAIL_USER}>`,
//       to: email,
//       subject: `Appointment ${status}`,
//       html: appointmentStatusTemplate({
//         name,
//         status,
//         doctor: appointment.doctor_name,
//         date: appointment.date,
//         time: appointment.time,
//       }),
//     });

//     await pool.query(
//       `INSERT INTO notifications
//        (user_id,type,title,message,priority,related_entity_type,related_entity_id)
//        VALUES ($1,'appointment','Status Updated',
//        'Your appointment is now ${status}','medium','appointment',$2)`,
//       [appointment.user_id, appointment.id]
//     );

//     res.json({
//       success: true,
//       message: `Appointment ${status} and email sent`,
//       appointment,
//     });
//   } catch (err) {
//     console.error("❌ Status update error:", err);
//     res.status(500).json({ error: "Server error" });
//   }
// });

// module.exports = router;


const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { protect } = require("../middleware/auth");
const verifyAdmin = require("../middleware/admin");
const nodemailer = require("nodemailer");

const {
  appointmentStatusTemplate,
  appointmentRescheduleTemplate, // used later (step 2)
} = require("../utils/emailTemplates");

// ===================================
// 📧 Email Transporter
// ===================================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ===================================
// 🩵 Create Appointment (Logged-in User)
// ===================================
router.post("/", protect, async (req, res) => {
  const { date, time, doctorName, patientName, patientPhone } = req.body;

  if (!date || !time || !doctorName || !patientName || !patientPhone) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const userId = req.user.id;

    const userResult = await pool.query(
      "SELECT name, email FROM users WHERE id=$1",
      [userId]
    );

    if (!userResult.rows.length) {
      return res.status(404).json({ error: "User not found" });
    }

    const { name, email } = userResult.rows[0];

    const result = await pool.query(
      `INSERT INTO appointments
       (name, email, doctor_name, patient_name, patient_phone, date, time, status, user_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'scheduled',$8)
       RETURNING *`,
      [name, email, doctorName, patientName, patientPhone, date, time, userId]
    );

    const appointment = result.rows[0];

    await transporter.sendMail({
      from: `"Medilink" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "✅ Appointment Booked",
      text: `Hello ${name},

Your appointment with Dr. ${doctorName} has been booked.

📅 Date: ${date}
⏰ Time: ${time}`,
    });

    res.status(201).json(appointment);
  } catch (err) {
    console.error("Create appointment error:", err);
    res.status(500).json({ error: "Error creating appointment" });
  }
});

// ===================================
// 📋 Get User Appointments
// ===================================
router.get("/", protect, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM appointments WHERE user_id=$1 ORDER BY id DESC",
      [req.user.id]
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: "Error fetching appointments" });
  }
});

// ===================================
// 🛡️ Admin: Get All Appointments
// ===================================
router.get("/all", protect, verifyAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM appointments ORDER BY id DESC"
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: "Error fetching appointments" });
  }
});

// ===================================
// 🔁 USER Reschedule Request (ADMIN APPROVAL REQUIRED)
// ===================================
router.put("/:id", protect, async (req, res) => {
  const { date, time } = req.body;

  if (!date || !time) {
    return res.status(400).json({ error: "Date and time are required" });
  }

  try {
    // 👤 User can request reschedule only for their appointment
    const existing = await pool.query(
      "SELECT * FROM appointments WHERE id=$1 AND user_id=$2",
      [req.params.id, req.user.id]
    );

    if (!existing.rows.length) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    const updated = await pool.query(
      `UPDATE appointments
       SET date=$1,
           time=$2,
           status='reschedule_requested',
           updated_at=CURRENT_TIMESTAMP
       WHERE id=$3
       RETURNING *`,
      [date, time, req.params.id]
    );

    const appointment = updated.rows[0];

    // 📧 Notify ADMIN ONLY
    const adminEmail = process.env.CLIENT_EMAIL;

    if (adminEmail) {
      await transporter.sendMail({
        from: `"Medilink" <${process.env.EMAIL_USER}>`,
        to: adminEmail,
        subject: "🕒 Reschedule Request Pending Approval",
        html: `
          <h3>Reschedule Request</h3>
          <p>A user has requested to reschedule an appointment.</p>
          <ul>
            <li><b>Patient:</b> ${appointment.name}</li>
            <li><b>Doctor:</b> ${appointment.doctor_name}</li>
            <li><b>Requested Date:</b> ${new Date(appointment.date).toLocaleDateString()}</li>
            <li><b>Requested Time:</b> ${appointment.time}</li>
          </ul>
          <p>Please review and approve this request from the admin dashboard.</p>
        `,
      });
    }

    res.json({
      success: true,
      message: "Reschedule request sent for admin approval",
      appointment,
    });
  } catch (err) {
    console.error("Reschedule request error:", err);
    res.status(500).json({ error: "Error requesting reschedule" });
  }
});

// ===================================
// ❌ Delete Appointment (USER or ADMIN)
// ===================================
router.delete("/:id", protect, async (req, res) => {
  try {
    let result;

    if (req.user.role === "admin") {
      result = await pool.query(
        "DELETE FROM appointments WHERE id=$1 RETURNING *",
        [req.params.id]
      );
    } else {
      result = await pool.query(
        "DELETE FROM appointments WHERE id=$1 AND user_id=$2 RETURNING *",
        [req.params.id, req.user.id]
      );
    }

    if (!result.rows.length) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: "Error deleting appointment" });
  }
});

// ===================================
// 🧭 Update Appointment Status (ADMIN)
// ===================================
router.patch("/:id/status", protect, verifyAdmin, async (req, res) => {
  const { status } = req.body;
  const allowedStatuses = ["confirmed", "cancelled", "completed"];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  try {
    const result = await pool.query(
      "UPDATE appointments SET status=$1 WHERE id=$2 RETURNING *",
      [status, req.params.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    const appointment = result.rows[0];

    const userResult = await pool.query(
      "SELECT name, email FROM users WHERE id=$1",
      [appointment.user_id]
    );

    const { name, email } = userResult.rows[0];

    await transporter.sendMail({
      from: `"Medilink" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Appointment ${status}`,
      html: appointmentStatusTemplate({
        name,
        status,
        doctor: appointment.doctor_name,
        date: appointment.date,
        time: appointment.time,
      }),
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Status update error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
