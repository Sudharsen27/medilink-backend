// const express = require("express");
// const router = express.Router();
// const pool = require("../config/db");
// const verifyAdmin = require("../middleware/admin");
// const verifyToken = require("../middleware/auth");
// const nodemailer = require("nodemailer");

// // =======================
// // Setup email transporter
// // =======================
// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.EMAIL_USER, // your Gmail
//     pass: process.env.EMAIL_PASS, // your Gmail App Password
//   },
// });

// // =======================
// // Create appointment (logged-in user)
// // =======================
// router.post("/", verifyToken, async (req, res) => {
//   const { date, time, doctorName, patientName, patientPhone } = req.body;
//   if (!date || !time || !doctorName || !patientName || !patientPhone) {
//     return res.status(400).json({ error: "All fields are required" });
//   }

//   try {
//     // Fetch logged-in user's info
//     const userResult = await pool.query(
//       "SELECT name, email FROM users WHERE id = $1",
//       [req.user.id]
//     );

//     if (userResult.rows.length === 0) {
//       return res.status(404).json({ error: "User not found" });
//     }

//     const { name, email } = userResult.rows[0];

//     // Insert appointment into DB
//     const result = await pool.query(
//       `INSERT INTO appointments 
//         (name, email, doctor_name, patient_name, patient_phone, date, time, status, user_id) 
//        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
//       [name, email, doctorName, patientName, patientPhone, date, time, "pending", req.user.id]
//     );

//     const appointment = result.rows[0];

//     // Send confirmation email to user
//     await transporter.sendMail({
//       from: process.env.EMAIL_USER,
//       to: email,
//       subject: "✅ Appointment Confirmation",
//       text: `Hello ${name},\n\nYour appointment with Dr. ${doctorName} has been booked.\n📅 Date: ${date}\n⏰ Time: ${time}\n\nWe will remind you before the appointment.`,
//     });

//     // Send notification email to admin/client
//     await transporter.sendMail({
//       from: process.env.EMAIL_USER,
//       to: process.env.CLIENT_EMAIL,
//       subject: "📢 New Appointment Booked",
//       text: `A new appointment has been booked:\n👤 Patient: ${patientName}\n📞 Phone: ${patientPhone}\n👨‍⚕️ Doctor: ${doctorName}\n📅 Date: ${date}\n⏰ Time: ${time}\nBooked by user: ${name} (${email})`,
//     });

//     res.json(appointment);
//   } catch (err) {
//     console.error("Error creating appointment:", err);
//     res.status(500).json({ error: "Database error while creating appointment" });
//   }
// });

// // =======================
// // Get appointments of logged-in user
// // =======================
// router.get("/", verifyToken, async (req, res) => {
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
// });

// // =======================
// // Admin: get all appointments
// // =======================
// router.get("/all", verifyToken, verifyAdmin, async (req, res) => {
//   try {
//     const result = await pool.query("SELECT * FROM appointments ORDER BY id DESC");
//     res.json(result.rows);
//   } catch (err) {
//     console.error("Error fetching all appointments:", err);
//     res.status(500).json({ error: "Database error while fetching all appointments" });
//   }
// });

// // =======================
// // Update appointment (user can edit their own)
// // =======================
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

//     res.json(result.rows[0]);
//   } catch (err) {
//     console.error("Error updating appointment:", err);
//     res.status(500).json({ error: "Database error while updating appointment" });
//   }
// });

// // =======================
// // Delete appointment (user can delete their own)
// // =======================
// router.delete("/:id", verifyToken, async (req, res) => {
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
// });

// // =======================
// // Update appointment status (admin only + send email with formatted date)
// // =======================
// router.patch("/:id/status", verifyToken, verifyAdmin, async (req, res) => {
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

//     // Fetch user's info for email notification
//     const userResult = await pool.query(
//       "SELECT name, email FROM users WHERE id = $1",
//       [appointment.user_id]
//     );

//     if (userResult.rows.length > 0) {
//       const { name, email } = userResult.rows[0];

//       // Format date nicely for email
//       const formattedDate = new Date(appointment.date).toLocaleDateString("en-IN", {
//         weekday: "short",
//         year: "numeric",
//         month: "short",
//         day: "numeric",
//       });

//       // Send email about status change
//       await transporter.sendMail({
//         from: process.env.EMAIL_USER,
//         to: email,
//         subject: `📢 Your appointment status is now "${status}"`,
//         text: `Hello ${name},\n\nYour appointment with Dr. ${appointment.doctor_name} on ${formattedDate} at ${appointment.time} is now "${status}".\n\nThank you.`,
//       });
//     }

//     res.json(appointment);
//   } catch (err) {
//     console.error("Error updating appointment status:", err);
//     res.status(500).json({ error: "Database error while updating status" });
//   }
// });

// module.exports = router;

// // routes/appointments.js
// const express = require("express");
// const router = express.Router();
// const pool = require("../config/db");
// const verifyToken = require("../middleware/auth");
// const verifyAdmin = require("../middleware/admin");
// const nodemailer = require("nodemailer");
// // const { sendWhatsAppMessage } = require("../utils/whatsapp"); // Optional integration

// // ===================================
// // 📧 Setup Email Transporter
// // ===================================
// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.EMAIL_USER, // Gmail address
//     pass: process.env.EMAIL_PASS, // Gmail App Password
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
//     // Fetch the logged-in user's info
//     const userResult = await pool.query(
//       "SELECT name, email FROM users WHERE id = $1",
//       [req.user.id]
//     );

//     if (userResult.rows.length === 0) {
//       return res.status(404).json({ error: "User not found" });
//     }

//     const { name, email } = userResult.rows[0];

//     // Insert new appointment
//     const result = await pool.query(
//       `INSERT INTO appointments 
//         (name, email, doctor_name, patient_name, patient_phone, date, time, status, user_id)
//        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
//        RETURNING *`,
//       [name, email, doctorName, patientName, patientPhone, date, time, "pending", req.user.id]
//     );

//     const appointment = result.rows[0];

//     // ==============================
//     // ✉️ Send Confirmation Emails
//     // ==============================

//     // To user
//     await transporter.sendMail({
//       from: process.env.EMAIL_USER,
//       to: email,
//       subject: "✅ Appointment Confirmation",
//       text: `Hello ${name},
      
// Your appointment with Dr. ${doctorName} has been successfully booked.

// 📅 Date: ${date}
// ⏰ Time: ${time}

// We’ll remind you before your appointment.
      
// Thank you for using Medilink!`,
//     });

//     // To Admin/Client
//     await transporter.sendMail({
//       from: process.env.EMAIL_USER,
//       to: process.env.CLIENT_EMAIL,
//       subject: "📢 New Appointment Booked",
//       text: `📋 A new appointment has been booked:

// 👤 Patient: ${patientName}
// 📞 Phone: ${patientPhone}
// 👨‍⚕️ Doctor: ${doctorName}
// 📅 Date: ${date}
// ⏰ Time: ${time}
// Booked by: ${name} (${email})
// `,
//     });

//     // 💬 Optional WhatsApp reminder (uncomment if you have utils/whatsapp.js)
//     // const msg = `Hello ${patientName}, your appointment with Dr. ${doctorName} is booked for ${date} at ${time}.`;
//     // await sendWhatsAppMessage(patientPhone, msg);

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
// // ✏️ Update Appointment (User)
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

//     res.json(result.rows[0]);
//   } catch (err) {
//     console.error("❌ Error updating appointment:", err);
//     res.status(500).json({ error: "Database error while updating appointment" });
//   }
// });

// // ===================================
// // ❌ Delete Appointment (User)
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

//     res.json({ success: true, deleted: result.rows[0] });
//   } catch (err) {
//     console.error("❌ Error deleting appointment:", err);
//     res.status(500).json({ error: "Database error while deleting appointment" });
//   }
// });

// // ===================================
// // 🧭 Admin: Update Appointment Status
// // (Includes Email Notifications)
// // ===================================
// router.patch("/:id/status", verifyToken, verifyAdmin, async (req, res) => {
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

//     // Fetch user info for email
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

//       // Send status update email
//       await transporter.sendMail({
//         from: process.env.EMAIL_USER,
//         to: email,
//         subject: `📢 Appointment Status: ${status.toUpperCase()}`,
//         text: `Hello ${name},
        
// Your appointment with Dr. ${appointment.doctor_name} is now marked as "${status}".
// 📅 Date: ${formattedDate}
// ⏰ Time: ${appointment.time}

// Thank you for using Medilink!`,
//       });

//       // 💬 Optional WhatsApp notification
//       // const msg = `Hello ${name}, your appointment with Dr. ${appointment.doctor_name} on ${formattedDate} at ${appointment.time} is now ${status}.`;
//       // await sendWhatsAppMessage(appointment.patient_phone, msg);
//     }

//     res.json(appointment);
//   } catch (err) {
//     console.error("❌ Error updating appointment status:", err);
//     res.status(500).json({ error: "Database error while updating status" });
//   }
// });

// module.exports = router;

// routes/appointments.js
const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const verifyToken = require("../middleware/auth");
const verifyAdmin = require("../middleware/admin");
const nodemailer = require("nodemailer");
// const { sendWhatsAppMessage } = require("../utils/whatsapp"); // Optional integration

// ===================================
// 📧 Setup Email Transporter
// ===================================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // Gmail address
    pass: process.env.EMAIL_PASS, // Gmail App Password
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
    // Fetch the logged-in user's info
    const userResult = await pool.query(
      "SELECT name, email FROM users WHERE id = $1",
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const { name, email } = userResult.rows[0];

    // Insert new appointment
    const result = await pool.query(
      `INSERT INTO appointments 
        (name, email, doctor_name, patient_name, patient_phone, date, time, status, user_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [name, email, doctorName, patientName, patientPhone, date, time, "pending", req.user.id]
    );

    const appointment = result.rows[0];

    // ==============================
    // ✉️ Send Confirmation Emails
    // ==============================

    // To user
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "✅ Appointment Confirmation",
      text: `Hello ${name},
      
Your appointment with Dr. ${doctorName} has been successfully booked.

📅 Date: ${date}
⏰ Time: ${time}

We’ll remind you before your appointment.
      
Thank you for using Medilink!`,
    });

    // To Admin/Client
    if (process.env.CLIENT_EMAIL) {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: process.env.CLIENT_EMAIL,
        subject: "📢 New Appointment Booked",
        text: `📋 A new appointment has been booked:

👤 Patient: ${patientName}
📞 Phone: ${patientPhone}
👨‍⚕️ Doctor: ${doctorName}
📅 Date: ${date}
⏰ Time: ${time}
Booked by: ${name} (${email})
`,
      });
    }

    // Optional WhatsApp (uncomment if implemented)
    // const msg = `Hello ${patientName}, your appointment with Dr. ${doctorName} is booked for ${date} at ${time}.`;
    // await sendWhatsAppMessage(patientPhone, msg);

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
    console.error("❌ Error fetching user appointments:", err);
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
// ✏️ Update Appointment (User edits own appointment date/time)
// ===================================
router.put("/:id", verifyToken, async (req, res) => {
  const { date, time } = req.body;

  try {
    const result = await pool.query(
      `UPDATE appointments 
       SET date = $1, time = $2 
       WHERE id = $3 AND user_id = $4 
       RETURNING *`,
      [date, time, req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Appointment not found or not yours" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error updating appointment:", err);
    res.status(500).json({ error: "Database error while updating appointment" });
  }
});

// ===================================
// ❌ Delete Appointment (User can delete their own)
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

    res.json({ success: true, deleted: result.rows[0] });
  } catch (err) {
    console.error("❌ Error deleting appointment:", err);
    res.status(500).json({ error: "Database error while deleting appointment" });
  }
});

// ===================================
// 🧭 Update Appointment Status
// - Admins can update any appointment
// - Regular users can update only their own appointment
// - Valid statuses defined below
// - Sends email notification on status change
// ===================================
router.patch("/:id/status", verifyToken, async (req, res) => {
  const { status } = req.body;
  const validStatuses = ["pending", "scheduled", "confirmed", "completed", "cancelled"];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid or missing status" });
  }

  try {
    let result;

    // Admins may update any appointment
    if (req.user && req.user.role === "admin") {
      result = await pool.query(
        "UPDATE appointments SET status = $1 WHERE id = $2 RETURNING *",
        [status, req.params.id]
      );
    } else {
      // Regular user: only update if they own the appointment
      result = await pool.query(
        "UPDATE appointments SET status = $1 WHERE id = $2 AND user_id = $3 RETURNING *",
        [status, req.params.id, req.user.id]
      );
    }

    if (!result || result.rows.length === 0) {
      // If admin tried but no row, or user tried but not owner or not found
      return res.status(403).json({ error: "Not authorized or appointment not found" });
    }

    const appointment = result.rows[0];

    // Fetch user info for email notification
    const userResult = await pool.query(
      "SELECT name, email FROM users WHERE id = $1",
      [appointment.user_id]
    );

    if (userResult.rows.length > 0) {
      const { name, email } = userResult.rows[0];
      const formattedDate = appointment.date
        ? new Date(appointment.date).toLocaleDateString("en-IN", {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        : "";

      // Send notification email (best-effort)
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject: `📢 Appointment Status: ${status.toUpperCase()}`,
          text: `Hello ${name},
        
Your appointment with Dr. ${appointment.doctor_name} is now marked as "${status}".
${formattedDate ? `📅 Date: ${formattedDate}` : ""}
${appointment.time ? `⏰ Time: ${appointment.time}` : ""}

Thank you for using Medilink!`,
        });
      } catch (mailErr) {
        console.error("⚠️ Failed to send status email:", mailErr);
        // don't fail the whole request if email fails
      }

      // Optional WhatsApp (uncomment if implemented)
      // try {
      //   const msg = `Hello ${name}, your appointment with Dr. ${appointment.doctor_name} on ${formattedDate} at ${appointment.time} is now ${status}.`;
      //   await sendWhatsAppMessage(appointment.patient_phone, msg);
      // } catch (waErr) {
      //   console.error("⚠️ Failed to send WhatsApp message:", waErr);
      // }
    }

    res.json(appointment);
  } catch (err) {
    console.error("❌ Error updating appointment status:", err);
    res.status(500).json({ error: "Database error while updating status" });
  }
});

module.exports = router;
