/**
 * Backfill Google Calendar for existing video/telemedicine appointments.
 * Run: npm run backfill:calendar
 */
require("dotenv").config();
const pool = require("../config/db");
const { syncAppointmentCalendar } = require("../services/appointmentCalendar.service");

async function backfill() {
  const { rows } = await pool.query(`
    SELECT * FROM appointments
    WHERE appointment_type IN ('video', 'telemedicine')
       OR appointment_type IS NULL
    ORDER BY id ASC
  `);

  let synced = 0;
  for (const appointment of rows) {
    const updated = await syncAppointmentCalendar(appointment, { force: true });
    if (updated.google_event_id) {
      synced += 1;
      console.log(
        `#${updated.id} ${updated.doctor_name} →`,
        updated.meet_link || updated.calendar_link || "synced"
      );
    }
  }

  console.log(`\n✅ Synced ${synced} of ${rows.length} appointments.`);
  await pool.end();
}

backfill().catch((error) => {
  console.error("Backfill failed:", error.message);
  process.exit(1);
});
