require("dotenv").config();
const pool = require("../config/db");

(async () => {
  const u = await pool.query(
    "SELECT id, email FROM users WHERE email = $1",
    ["patient@medilink.test"]
  );
  console.log("user", u.rows);
  if (!u.rows[0]) {
    await pool.end();
    return;
  }
  const pid = u.rows[0].id;
  const rx = await pool.query(
    "SELECT id, medication_name, status FROM prescriptions WHERE user_id = $1",
    [pid]
  );
  const ap = await pool.query(
    `SELECT id, status, appointment_type, doctor_name, date, appointment_date
     FROM appointments WHERE user_id = $1`,
    [pid]
  );
  console.log("prescriptions", rx.rows);
  console.log("appointments", ap.rows);
  await pool.end();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
