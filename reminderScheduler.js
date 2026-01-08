// const cron = require("node-cron");
// const pool = require("./config/db");
// const twilio = require("twilio");
// require("dotenv").config();

// // Twilio client
// const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// // Send WhatsApp message
// const sendWhatsAppMessage = async (to, message) => {
//   try {
//     await client.messages.create({
//       from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
//       to: `whatsapp:${to}`,
//       body: message,
//     });
//     console.log("Reminder sent to:", to);
//   } catch (err) {
//     console.error("Error sending WhatsApp message:", err);
//   }
// };

// // Scheduler: run every hour
// const startReminderScheduler = () => {
//   console.log("✅ Reminder scheduler started");

//   cron.schedule("0 * * * *", async () => {
//     try {
//       const now = new Date();
//       const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

//       // Format date and time for PostgreSQL
//       const dateStr = oneHourLater.toISOString().split("T")[0]; // YYYY-MM-DD
//       const timeStr = oneHourLater.toTimeString().slice(0, 5); // HH:MM

//       const result = await pool.query(
//         `SELECT * FROM appointments 
//          WHERE date = $1 AND to_char(date, 'HH24:MI') = $2 
//            AND status = 'pending'`,
//         [dateStr, timeStr]
//       );

//       for (const appt of result.rows) {
//         const msg = `Reminder: You have an appointment with Dr. ${appt.doctor_name} at ${appt.date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} today.`;
//         await sendWhatsAppMessage(appt.phone_number, msg);

//         // Optional: mark reminder sent
//         await pool.query(
//           "UPDATE appointments SET status = 'reminder_sent' WHERE id = $1",
//           [appt.id]
//         );
//       }
//     } catch (err) {
//       console.error("Error in reminder scheduler:", err);
//     }
//   });
// };

// module.exports = { startReminderScheduler };


// const cron = require("node-cron");
// const pool = require("./config/db");
// const twilio = require("twilio");
// require("dotenv").config();

// // ===============================
// // 📲 Twilio Client
// // ===============================
// const client = twilio(
//   process.env.TWILIO_ACCOUNT_SID,
//   process.env.TWILIO_AUTH_TOKEN
// );

// // ===============================
// // 📤 Send WhatsApp Message
// // ===============================
// const sendWhatsAppMessage = async (to, message) => {
//   try {
//     await client.messages.create({
//       from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
//       to: `whatsapp:${to}`,
//       body: message,
//     });
//     console.log("📩 WhatsApp reminder sent to:", to);
//   } catch (err) {
//     console.error("❌ WhatsApp send error:", err.message);
//   }
// };

// // ===============================
// // ⏰ Reminder Scheduler (TEST MODE)
// // ===============================
// const startReminderScheduler = () => {
//   console.log("⏰ WhatsApp Reminder Scheduler started (2-minute test)");

//   // 🔁 Run every 1 minute
//   cron.schedule("* * * * *", async () => {
//     try {
//       const now = new Date();
//       const twoMinutesLater = new Date(now.getTime() + 2 * 60 * 1000);

//       const result = await pool.query(
//         `
//         SELECT *
//         FROM appointments
//         WHERE send_whatsapp_reminder = true
//           AND reminder_sent = false
//           AND status = 'scheduled'
//           AND (
//             (date + time::interval)
//             BETWEEN $1 AND $2
//           )
//         `,
//         [now, twoMinutesLater]
//       );

//       for (const appt of result.rows) {
//         const message = `⏰ Reminder from Medilink

// 👨‍⚕️ Doctor: ${appt.doctor_name}
// 📅 Date: ${appt.date}
// ⏱ Time: ${appt.time}

// Please be on time.`;

//         await sendWhatsAppMessage(appt.patient_phone, message);

//         // ✅ Mark reminder as sent (NOT appointment status)
//         await pool.query(
//           `
//           UPDATE appointments
//           SET reminder_sent = true
//           WHERE id = $1
//           `,
//           [appt.id]
//         );
//       }
//     } catch (err) {
//       console.error("❌ Reminder scheduler error:", err);
//     }
//   });
// };

// module.exports = { startReminderScheduler };

// const cron = require("node-cron");
// const pool = require("./config/db");
// const twilio = require("twilio");
// require("dotenv").config();

// // ===============================
// // 📲 Twilio Client
// // ===============================
// const client = twilio(
//   process.env.TWILIO_ACCOUNT_SID,
//   process.env.TWILIO_AUTH_TOKEN
// );

// // ===============================
// // 📤 Send WhatsApp Message
// // ===============================
// const sendWhatsAppMessage = async ({ to, message }) => {
//   try {
//     await client.messages.create({
//       from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
//       to: `whatsapp:${to}`,
//       body: message,
//     });
//     console.log("📩 WhatsApp reminder sent to:", to);
//   } catch (err) {
//     console.error("❌ WhatsApp send error:", err.message);
//   }
// };

// // ===============================
// // ⏰ WhatsApp Reminder Scheduler
// // ===============================
// const startReminderScheduler = () => {
//   console.log("⏰ WhatsApp Reminder Scheduler started (2-minute test mode)");

//   // 🔁 Runs every 1 minute
//   cron.schedule("* * * * *", async () => {
//     try {
//       const now = new Date();
//       const twoMinutesLater = new Date(now.getTime() + 2 * 60 * 1000);

//       // 🔍 Fetch upcoming appointments (2 min window)
//       const result = await pool.query(
//         `
//         SELECT *
//         FROM appointments
//         WHERE send_whatsapp_reminder = true
//           AND reminder_sent = false
//           AND status = 'scheduled'
//           AND (
//             (date + time::interval)
//             BETWEEN $1 AND $2
//           )
//         `,
//         [now, twoMinutesLater]
//       );

//       for (const appt of result.rows) {
//         const message = `⏰ Appointment Reminder – Medilink

// 👤 Patient: ${appt.patient_name}
// 👨‍⚕️ Doctor: Dr. ${appt.doctor_name}
// 📅 Date: ${appt.date}
// ⏰ Time: ${appt.time}

// Please be on time.`;

//         await sendWhatsAppMessage({
//           to: appt.patient_phone,
//           message,
//         });

//         // ✅ Mark reminder as sent (important)
//         await pool.query(
//           `
//           UPDATE appointments
//           SET reminder_sent = true
//           WHERE id = $1
//           `,
//           [appt.id]
//         );
//       }
//     } catch (err) {
//       console.error("❌ Reminder scheduler error:", err);
//     }
//   });
// };

// module.exports = { startReminderScheduler };


const cron = require("node-cron");
const pool = require("./config/db");
const twilio = require("twilio");
require("dotenv").config();

// ===============================
// 📲 Twilio Client
// ===============================
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// ===============================
// 📞 Phone formatter (IMPORTANT)
// ===============================
const formatPhone = (phone) => {
  if (!phone) return null;
  if (phone.startsWith("+")) return phone;
  return `+91${phone}`;
};

// ===============================
// 📤 Send WhatsApp Message
// ===============================
const sendWhatsAppMessage = async ({ to, message }) => {
  await client.messages.create({
    from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
    to: `whatsapp:${to}`,
    body: message,
  });
  console.log("📩 WhatsApp reminder sent to:", to);
};

// ===============================
// ⏰ WhatsApp Reminder Scheduler
// ===============================
const startReminderScheduler = () => {
  console.log("⏰ WhatsApp Reminder Scheduler started (2-minute test mode)");

  // 🔁 Runs every 1 minute
  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();
      const twoMinutesLater = new Date(now.getTime() + 2 * 60 * 1000);

      const result = await pool.query(
        `
        SELECT *
        FROM appointments
        WHERE send_whatsapp_reminder = true
          AND reminder_sent = false
          AND status = 'scheduled'
          AND (date + time::interval) BETWEEN $1 AND $2
        `,
        [now, twoMinutesLater]
      );

      for (const appt of result.rows) {
        try {
          const message = `⏰ Appointment Reminder – Medilink

👤 Patient: ${appt.patient_name}
👨‍⚕️ Doctor: Dr. ${appt.doctor_name}
📅 Date: ${appt.date}
⏰ Time: ${appt.time}

Please be on time.`;

          await sendWhatsAppMessage({
            to: formatPhone(appt.patient_phone),
            message,
          });

          // ✅ Mark as sent ONLY after success
          await pool.query(
            "UPDATE appointments SET reminder_sent = true WHERE id = $1",
            [appt.id]
          );
        } catch (err) {
          console.error(
            "❌ WhatsApp failed for appointment",
            appt.id,
            err.message
          );
        }
      }
    } catch (err) {
      console.error("❌ Reminder scheduler error:", err);
    }
  });
};

module.exports = { startReminderScheduler };
