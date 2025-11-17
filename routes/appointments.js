

// const express = require("express");
// const router = express.Router();
// const pool = require("../config/db");
// const verifyToken = require("../middleware/auth");
// const verifyAdmin = require("../middleware/admin");
// const nodemailer = require("nodemailer");

// // ===================================
// // 📧 Setup Email Transporter
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
// router.post("/", verifyToken, async (req, res) => {
//   const { date, time, doctorName, patientName, patientPhone } = req.body;

//   if (!date || !time || !doctorName || !patientName || !patientPhone) {
//     return res.status(400).json({ error: "All fields are required" });
//   }

//   try {
//     // Fetch logged-in user
//     const userResult = await pool.query(
//       "SELECT name, email FROM users WHERE id = $1",
//       [req.user.id]
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
//       [name, email, doctorName, patientName, patientPhone, date, time, "pending", req.user.id]
//     );

//     const appointment = result.rows[0];
//     const appointmentId = appointment.id;
//     const userId = req.user.id;

//     // =======================================
//     // 🔔 Insert Notification (Create)
//     // =======================================
//     await pool.query(
//       `INSERT INTO notifications (user_id, type, title, message, priority, related_entity_type, related_entity_id)
//        VALUES ($1, 'appointment', 'New Appointment Booked', 
//        'Your appointment has been successfully scheduled.', 'medium', 'appointment', $2)`,
//       [userId, appointmentId]
//     );

//     // ==============================
//     // ✉️ Send Confirmation Email
//     // ==============================
//     await transporter.sendMail({
//       from: process.env.EMAIL_USER,
//       to: email,
//       subject: "✅ Appointment Confirmation",
//       text: `Hello ${name},
      
// Your appointment with Dr. ${doctorName} has been successfully booked.

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
//         text: `📋 A new appointment has been booked:

// 👤 Patient: ${patientName}
// 📞 Phone: ${patientPhone}
// 👨‍⚕️ Doctor: ${doctorName}
// 📅 Date: ${date}
// ⏰ Time: ${time}
// Booked by: ${name} (${email})
// `,
//       });
//     }

//     res.status(201).json(appointment);
//   } catch (err) {
//     console.error("❌ Error creating appointment:", err);
//     res.status(500).json({ error: "Database error while creating appointment" });
//   }
// });

// // ===================================
// // 📋 Get Logged-in User’s Appointments
// // ===================================
// router.get("/", verifyToken, async (req, res) => {
//   try {
//     const result = await pool.query(
//       "SELECT * FROM appointments WHERE user_id = $1 ORDER BY id DESC",
//       [req.user.id]
//     );
//     res.json(result.rows);
//   } catch (err) {
//     console.error("❌ Error fetching user appointments:", err);
//     res.status(500).json({ error: "Database error while fetching appointments" });
//   }
// });

// // ===================================
// // 🛡️ Admin: Get All Appointments
// // ===================================
// router.get("/all", verifyToken, verifyAdmin, async (req, res) => {
//   try {
//     const result = await pool.query("SELECT * FROM appointments ORDER BY id DESC");
//     res.json(result.rows);
//   } catch (err) {
//     console.error("❌ Error fetching all appointments:", err);
//     res.status(500).json({ error: "Database error while fetching all appointments" });
//   }
// });

// // ===================================
// // ✏️ Update Appointment (User edits date/time)
// // ===================================
// router.put("/:id", verifyToken, async (req, res) => {
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

//     const appointment = result.rows[0];
//     const userId = req.user.id;

//     // 🔔 Notification
//     await pool.query(
//       `INSERT INTO notifications (user_id, type, title, message, priority, related_entity_type, related_entity_id)
//        VALUES ($1, 'appointment', 'Appointment Updated', 
//        'Your appointment date/time has been updated.', 'medium', 'appointment', $2)`,
//       [userId, appointment.id]
//     );

//     res.json(appointment);
//   } catch (err) {
//     console.error("❌ Error updating appointment:", err);
//     res.status(500).json({ error: "Database error while updating appointment" });
//   }
// });

// // ===================================
// // ❌ Delete Appointment
// // ===================================
// router.delete("/:id", verifyToken, async (req, res) => {
//   try {
//     const result = await pool.query(
//       "DELETE FROM appointments WHERE id = $1 AND user_id = $2 RETURNING *",
//       [req.params.id, req.user.id]
//     );

//     if (result.rows.length === 0) {
//       return res.status(404).json({ error: "Appointment not found or not yours" });
//     }

//     const deletedAppointment = result.rows[0];

//     // 🔔 Notification
//     await pool.query(
//       `INSERT INTO notifications (user_id, type, title, message, priority, related_entity_type, related_entity_id)
//        VALUES ($1, 'appointment', 'Appointment Deleted', 
//        'Your appointment has been cancelled.', 'medium', 'appointment', $2)`,
//       [req.user.id, deletedAppointment.id]
//     );

//     res.json({ success: true, deleted: deletedAppointment });
//   } catch (err) {
//     console.error("❌ Error deleting appointment:", err);
//     res.status(500).json({ error: "Database error while deleting appointment" });
//   }
// });

// // ===================================
// // 🧭 Update Appointment Status
// // ===================================
// router.patch("/:id/status", verifyToken, async (req, res) => {
//   const { status } = req.body;
//   const validStatuses = ["pending", "scheduled", "confirmed", "completed", "cancelled"];

//   if (!status || !validStatuses.includes(status)) {
//     return res.status(400).json({ error: "Invalid or missing status" });
//   }

//   try {
//     let result;

//     if (req.user.role === "admin") {
//       result = await pool.query(
//         "UPDATE appointments SET status = $1 WHERE id = $2 RETURNING *",
//         [status, req.params.id]
//       );
//     } else {
//       result = await pool.query(
//         "UPDATE appointments SET status = $1 WHERE id = $2 AND user_id = $3 RETURNING *",
//         [status, req.params.id, req.user.id]
//       );
//     }

//     if (!result || result.rows.length === 0) {
//       return res.status(403).json({ error: "Not authorized or appointment not found" });
//     }

//     const appointment = result.rows[0];
//     const userId = appointment.user_id;

//     // 🔔 Notification
//     await pool.query(
//       `INSERT INTO notifications (user_id, type, title, message, priority, related_entity_type, related_entity_id)
//        VALUES ($1, 'appointment', 'Appointment Status Updated', 
//        'Your appointment status is now: ${status}', 'medium', 'appointment', $2)`,
//       [userId, appointment.id]
//     );

//     // Email user
//     const userResult = await pool.query(
//       "SELECT name, email FROM users WHERE id = $1",
//       [appointment.user_id]
//     );

//     if (userResult.rows.length > 0) {
//       const { name, email } = userResult.rows[0];

//       await transporter.sendMail({
//         from: process.env.EMAIL_USER,
//         to: email,
//         subject: `📢 Appointment Status: ${status.toUpperCase()}`,
//         text: `Hello ${name},

// Your appointment with Dr. ${appointment.doctor_name} is now marked as "${status}".
// `,
//       });
//     }

//     res.json(appointment);
//   } catch (err) {
//     console.error("❌ Error updating appointment status:", err);
//     res.status(500).json({ error: "Database error while updating status" });
//   }
// });

// module.exports = router;

const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const verifyToken = require("../middleware/auth");
const verifyAdmin = require("../middleware/admin");
const nodemailer = require("nodemailer");

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
router.post("/", verifyToken, async (req, res) => {
  const { date, time, doctorName, patientName, patientPhone } = req.body;

  if (!date || !time || !doctorName || !patientName || !patientPhone) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const userId = req.user.id;

    // Fetch logged-in user
    const userResult = await pool.query(
      "SELECT name, email FROM users WHERE id = $1",
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const { name, email } = userResult.rows[0];

    // Insert appointment
    const result = await pool.query(
      `INSERT INTO appointments 
        (name, email, doctor_name, patient_name, patient_phone, date, time, status, user_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [name, email, doctorName, patientName, patientPhone, date, time, "pending", userId]
    );

    const appointment = result.rows[0];

    // ===============================
    // 🔔 Create Notification
    // ===============================
    await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, priority, related_entity_type, related_entity_id)
       VALUES ($1,'appointment','Appointment Booked',
       'Your appointment has been scheduled successfully','medium','appointment',$2)`,
      [userId, appointment.id]
    );

    // ===============================
    // ✉️ Confirmation Email
    // ===============================
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "✅ Appointment Confirmation",
      text: `Hello ${name},
Your appointment with Dr. ${doctorName} has been successfully booked.

📅 Date: ${date}
⏰ Time: ${time}

Thank you for using Medilink!`,
    });

    // Email Admin
    if (process.env.CLIENT_EMAIL) {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: process.env.CLIENT_EMAIL,
        subject: "📢 New Appointment Booked",
        text: `
A new appointment has been booked:

👤 Patient: ${patientName}
📞 Phone: ${patientPhone}
👨‍⚕️ Doctor: ${doctorName}
📅 Date: ${date}
⏰ Time: ${time}
Booked by: ${name} (${email})
`,
      });
    }

    res.status(201).json(appointment);
  } catch (err) {
    console.error("❌ Error creating appointment:", err);
    res.status(500).json({ error: "Database error while creating appointment" });
  }
});

// ===================================
// 📋 Get Logged-in User’s Appointments
// ===================================
router.get("/", verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM appointments WHERE user_id = $1 ORDER BY id DESC",
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching appointments:", err);
    res.status(500).json({ error: "Database error while fetching appointments" });
  }
});

// ===================================
// 🛡️ Admin: Get All Appointments
// ===================================
router.get("/all", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM appointments ORDER BY id DESC");
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching all appointments:", err);
    res.status(500).json({ error: "Database error while fetching all appointments" });
  }
});

// ===================================
// ✏️ Update Appointment (User Only)
// ===================================
router.put("/:id", verifyToken, async (req, res) => {
  const { date, time } = req.body;

  try {
    const result = await pool.query(
      `UPDATE appointments SET date=$1, time=$2
       WHERE id=$3 AND user_id=$4
       RETURNING *`,
      [date, time, req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Appointment not found or not yours" });
    }

    const appointment = result.rows[0];

    // 🔔 Notification
    await pool.query(
      `INSERT INTO notifications (user_id,type,title,message,priority,related_entity_type,related_entity_id)
       VALUES ($1,'appointment','Appointment Updated',
       'Your appointment date/time was updated','medium','appointment',$2)`,
      [req.user.id, appointment.id]
    );

    res.json(appointment);
  } catch (err) {
    console.error("❌ Error updating appointment:", err);
    res.status(500).json({ error: "Database error while updating appointment" });
  }
});

// ===================================
// ❌ Delete Appointment
// ===================================
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM appointments WHERE id = $1 AND user_id = $2 RETURNING *",
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Appointment not found or not yours" });
    }

    const deleted = result.rows[0];

    // 🔔 Notification
    await pool.query(
      `INSERT INTO notifications (user_id,type,title,message,priority,related_entity_type,related_entity_id)
       VALUES ($1,'appointment','Appointment Deleted',
       'Your appointment has been cancelled','medium','appointment',$2)`,
      [req.user.id, deleted.id]
    );

    res.json({ success: true, deleted });
  } catch (err) {
    console.error("❌ Error deleting appointment:", err);
    res.status(500).json({ error: "Database error while deleting appointment" });
  }
});

// ===================================
// 🧭 Update Appointment Status
// ===================================
router.patch("/:id/status", verifyToken, async (req, res) => {
  const { status } = req.body;
  const validStatuses = ["pending", "scheduled", "confirmed", "completed", "cancelled"];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid or missing status" });
  }

  try {
    let result;

    // Admin can update anyone’s appointment
    if (req.user.role === "admin") {
      result = await pool.query(
        "UPDATE appointments SET status=$1 WHERE id=$2 RETURNING *",
        [status, req.params.id]
      );
    } else {
      result = await pool.query(
        "UPDATE appointments SET status=$1 WHERE id=$2 AND user_id=$3 RETURNING *",
        [status, req.params.id, req.user.id]
      );
    }

    if (result.rows.length === 0) {
      return res.status(403).json({ error: "Not authorized or appointment not found" });
    }

    const appointment = result.rows[0];
    const userId = appointment.user_id;

    // 🔔 Notification
    await pool.query(
      `INSERT INTO notifications (user_id,type,title,message,priority,related_entity_type,related_entity_id)
       VALUES ($1,'appointment','Appointment Status Updated',
       'Your appointment status is now: ${status}','medium','appointment',$2)`,
      [userId, appointment.id]
    );

    // Email the user
    const userResult = await pool.query(
      "SELECT name, email FROM users WHERE id = $1",
      [userId]
    );

    if (userResult.rows.length) {
      const { name, email } = userResult.rows[0];

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: `📢 Appointment Status: ${status.toUpperCase()}`,
        text: `Hello ${name},
Your appointment with Dr. ${appointment.doctor_name} is now "${status}".`,
      });
    }

    res.json(appointment);
  } catch (err) {
    console.error("❌ Error updating status:", err);
    res.status(500).json({ error: "Database error while updating appointment status" });
  }
});

module.exports = router;
