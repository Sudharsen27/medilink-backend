// const express = require("express");
// const router = express.Router();
// const pool = require("../db");
// const verifyAdmin = require("../middleware/admin");
// const verifyToken = require("../middleware/auth");

// // =======================
// // Create appointment (logged-in user)
// // =======================
// router.post("/", verifyToken, async (req, res) => {
//   const { date } = req.body;
//   if (!date) return res.status(400).json({ error: "Date is required" });

//   try {
//     // fetch user's name + email
//     const userResult = await pool.query(
//       "SELECT name, email FROM users WHERE id = $1",
//       [req.user.id]
//     );

//     if (userResult.rows.length === 0) {
//       return res.status(404).json({ error: "User not found" });
//     }

//     const { name, email } = userResult.rows[0];

//     const result = await pool.query(
//       `INSERT INTO appointments (name, email, date, status, user_id) 
//        VALUES ($1, $2, $3, $4, $5) RETURNING *`,
//       [name, email, date, "pending", req.user.id]
//     );

//     res.json(result.rows[0]);
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
//   const { date } = req.body;

//   try {
//     const result = await pool.query(
//       `UPDATE appointments 
//        SET date = $1
//        WHERE id = $2 AND user_id = $3
//        RETURNING *`,
//       [date, req.params.id, req.user.id]
//     );

//     if (result.rows.length === 0) {
//       return res
//         .status(404)
//         .json({ error: "Appointment not found or not yours" });
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
//       return res
//         .status(404)
//         .json({ error: "Appointment not found or not yours" });
//     }

//     res.json({ success: true, deleted: result.rows[0] });
//   } catch (err) {
//     console.error("Error deleting appointment:", err);
//     res.status(500).json({ error: "Database error while deleting appointment" });
//   }
// });

// // =======================
// // Update appointment status (admin only)
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

//     res.json(result.rows[0]);
//   } catch (err) {
//     console.error("Error updating appointment status:", err);
//     res.status(500).json({ error: "Database error while updating status" });
//   }
// });

// module.exports = router;

const express = require("express");
const router = express.Router();
const pool = require("../db");
const verifyAdmin = require("../middleware/admin");
const verifyToken = require("../middleware/auth");
const nodemailer = require("nodemailer");

// =======================
// Setup email transporter
// =======================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // your Gmail
    pass: process.env.EMAIL_PASS, // your Gmail App Password
  },
});

// =======================
// Create appointment (logged-in user)
// =======================
router.post("/", verifyToken, async (req, res) => {
  const { date, time, doctorName, patientName, patientPhone, whatsappOptIn } = req.body;
  if (!date || !time || !doctorName || !patientName || !patientPhone) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // Fetch logged-in user's info
    const userResult = await pool.query(
      "SELECT name, email FROM users WHERE id = $1",
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const { name, email } = userResult.rows[0];

    // Insert appointment into DB
    const result = await pool.query(
      `INSERT INTO appointments 
        (name, email, doctor_name, patient_name, patient_phone, date, time, status, user_id) 
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [name, email, doctorName, patientName, patientPhone, date, time, "pending", req.user.id]
    );

    const appointment = result.rows[0];

    // ✅ Send confirmation email to user
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "✅ Appointment Confirmation",
      text: `Hello ${name},\n\nYour appointment with Dr. ${doctorName} has been booked.\n\n📅 Date: ${date}\n⏰ Time: ${time}\n\nWe will remind you before the appointment.`,
    });

    // ✅ Send notification email to client
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.CLIENT_EMAIL, // your email
      subject: "📢 New Appointment Booked",
      text: `A new appointment has been booked:\n\n👤 Patient: ${patientName}\n📞 Phone: ${patientPhone}\n👨‍⚕️ Doctor: ${doctorName}\n📅 Date: ${date}\n⏰ Time: ${time}\n\nBooked by user: ${name} (${email})`,
    });

    res.json(appointment);
  } catch (err) {
    console.error("Error creating appointment:", err);
    res.status(500).json({ error: "Database error while creating appointment" });
  }
});

// =======================
// Get appointments of logged-in user
// =======================
router.get("/", verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM appointments WHERE user_id = $1 ORDER BY id DESC",
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching user appointments:", err);
    res.status(500).json({ error: "Database error while fetching appointments" });
  }
});

// =======================
// Admin: get all appointments
// =======================
router.get("/all", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM appointments ORDER BY id DESC");
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching all appointments:", err);
    res.status(500).json({ error: "Database error while fetching all appointments" });
  }
});

// =======================
// Update appointment (user can edit their own)
// =======================
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
    console.error("Error updating appointment:", err);
    res.status(500).json({ error: "Database error while updating appointment" });
  }
});

// =======================
// Delete appointment (user can delete their own)
// =======================
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
    console.error("Error deleting appointment:", err);
    res.status(500).json({ error: "Database error while deleting appointment" });
  }
});

// =======================
// Update appointment status (admin only)
// =======================
router.patch("/:id/status", verifyToken, verifyAdmin, async (req, res) => {
  const { status } = req.body;
  const validStatuses = ["pending", "confirmed", "cancelled"];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  try {
    const result = await pool.query(
      "UPDATE appointments SET status = $1 WHERE id = $2 RETURNING *",
      [status, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error updating appointment status:", err);
    res.status(500).json({ error: "Database error while updating status" });
  }
});

module.exports = router;
