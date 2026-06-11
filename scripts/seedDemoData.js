/**
 * Seeds prescriptions + telemedicine appointments for demo patient.
 * Run: npm run seed:demo
 */
require("dotenv").config();
const pool = require("../config/db");

const PATIENT_EMAIL = "patient@medilink.test";

const seedPrescriptions = async (userId) => {
  const existing = await pool.query(
    "SELECT COUNT(*)::int AS count FROM prescriptions WHERE user_id = $1",
    [userId]
  );
  if (existing.rows[0].count > 0) {
    console.log(`ℹ️  Patient already has ${existing.rows[0].count} prescription(s) — skipping.`);
    return;
  }

  await pool.query(
    `
    INSERT INTO prescriptions (
      user_id, medication_name, doctor_name, dosage, frequency,
      start_date, end_date, status, instructions
    ) VALUES
      ($1, 'Amoxicillin', 'Dr. Sarah Johnson', '500mg', 'Twice daily',
       CURRENT_DATE - INTERVAL '3 days', CURRENT_DATE + INTERVAL '4 days', 'active',
       'Take after meals. Complete the full course even if you feel better.'),
      ($1, 'Paracetamol', 'Dr. Sarah Johnson', '650mg', 'As needed',
       CURRENT_DATE - INTERVAL '3 days', CURRENT_DATE + INTERVAL '2 days', 'active',
       'For fever or pain. Do not exceed 4 doses in 24 hours.'),
      ($1, 'Vitamin D3', 'Dr. Michael Chen', '1000 IU', 'Once daily',
       CURRENT_DATE - INTERVAL '14 days', CURRENT_DATE + INTERVAL '46 days', 'active',
       'Take with breakfast.')
    `,
    [userId]
  );
  console.log("✅ Seeded 3 prescriptions");
};

const seedTelemedicineAppointments = async (userId, userRow) => {
  const existing = await pool.query(
    `
    SELECT COUNT(*)::int AS count
    FROM appointments
    WHERE user_id = $1
      AND appointment_type IN ('telemedicine', 'video')
    `,
    [userId]
  );

  if (existing.rows[0].count > 0) {
    console.log(`ℹ️  Patient already has ${existing.rows[0].count} telemedicine appointment(s) — skipping insert.`);
  } else {
    await pool.query(
      `
      INSERT INTO appointments (
        user_id, name, email, doctor_name, patient_name, patient_phone,
        appointment_date, appointment_time, date, time,
        status, appointment_type, reason
      ) VALUES
        ($1, $2, $3, 'Dr. Sarah Johnson', $2, $4,
         CURRENT_DATE, '14:30:00', CURRENT_DATE, '14:30:00',
         'confirmed', 'telemedicine', 'Follow-up consultation — blood pressure review'),
        ($1, $2, $3, 'Dr. Michael Chen', $2, $4,
         CURRENT_DATE + INTERVAL '2 days', '10:00:00', CURRENT_DATE + INTERVAL '2 days', '10:00:00',
         'scheduled', 'telemedicine', 'Skin rash video consult')
      `,
      [userId, userRow.name, userRow.email, userRow.phone]
    );
    console.log("✅ Seeded 2 telemedicine appointments");
  }

  // Upgrade any legacy row missing type/date so it appears in the list
  await pool.query(
    `
    UPDATE appointments
    SET
      appointment_type = COALESCE(appointment_type, 'telemedicine'),
      appointment_date = COALESCE(appointment_date, date),
      appointment_time = COALESCE(appointment_time, time),
      status = CASE
        WHEN status IN ('cancelled', 'completed') THEN status
        ELSE 'confirmed'
      END,
      reason = COALESCE(reason, 'General video consultation')
    WHERE user_id = $1
      AND (appointment_type IS NULL OR appointment_date IS NULL)
    `,
    [userId]
  );
  console.log("✅ Normalized existing appointments for telemedicine");
};

(async () => {
  const { rows } = await pool.query(
    "SELECT id, name, email, phone FROM users WHERE email = $1",
    [PATIENT_EMAIL]
  );

  if (!rows.length) {
    console.error(`❌ User not found: ${PATIENT_EMAIL}`);
    process.exit(1);
  }

  const patient = rows[0];
  console.log(`👤 Seeding demo data for ${patient.email} (id=${patient.id})`);

  await seedPrescriptions(patient.id);
  await seedTelemedicineAppointments(patient.id, patient);

  const rx = await pool.query(
    "SELECT COUNT(*)::int AS count FROM prescriptions WHERE user_id = $1",
    [patient.id]
  );
  const ap = await pool.query(
    `SELECT COUNT(*)::int AS count FROM appointments
     WHERE user_id = $1 AND status NOT IN ('cancelled', 'completed')`,
    [patient.id]
  );

  console.log(`\n📊 Ready: ${rx.rows[0].count} prescriptions, ${ap.rows[0].count} active appointments`);
  await pool.end();
})().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
