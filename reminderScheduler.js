const cron = require("node-cron");
const pool = require("./config/db");
const twilio = require("twilio");
require("dotenv").config();

// Twilio client
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Send WhatsApp message
const sendWhatsAppMessage = async (to, message) => {
  try {
    await client.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${to}`,
      body: message,
    });
    console.log("Reminder sent to:", to);
  } catch (err) {
    console.error("Error sending WhatsApp message:", err);
  }
};

// Scheduler: run every hour
const startReminderScheduler = () => {
  console.log("✅ Reminder scheduler started");

  cron.schedule("0 * * * *", async () => {
    try {
      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

      // Format date and time for PostgreSQL
      const dateStr = oneHourLater.toISOString().split("T")[0]; // YYYY-MM-DD
      const timeStr = oneHourLater.toTimeString().slice(0, 5); // HH:MM

      const result = await pool.query(
        `SELECT * FROM appointments 
         WHERE date = $1 AND to_char(date, 'HH24:MI') = $2 
           AND status = 'pending'`,
        [dateStr, timeStr]
      );

      for (const appt of result.rows) {
        const msg = `Reminder: You have an appointment with Dr. ${appt.doctor_name} at ${appt.date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} today.`;
        await sendWhatsAppMessage(appt.phone_number, msg);

        // Optional: mark reminder sent
        await pool.query(
          "UPDATE appointments SET status = 'reminder_sent' WHERE id = $1",
          [appt.id]
        );
      }
    } catch (err) {
      console.error("Error in reminder scheduler:", err);
    }
  });
};

module.exports = { startReminderScheduler };
