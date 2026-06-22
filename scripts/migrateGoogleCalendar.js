/**
 * Ensures Google Calendar columns exist on appointments table.
 * Run: npm run migrate:calendar
 */
require("dotenv").config();
const pool = require("../config/db");

async function migrate() {
  await pool.query(`
    ALTER TABLE appointments
      ADD COLUMN IF NOT EXISTS google_event_id VARCHAR(255),
      ADD COLUMN IF NOT EXISTS meet_link TEXT,
      ADD COLUMN IF NOT EXISTS calendar_link TEXT,
      ADD COLUMN IF NOT EXISTS calendar_synced_at TIMESTAMPTZ
  `);

  console.log("✅ Google Calendar columns are ready on appointments table.");
  await pool.end();
}

migrate().catch((error) => {
  console.error("Migration failed:", error.message);
  process.exit(1);
});
