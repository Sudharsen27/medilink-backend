

/* ======================================================
   EMERGENCY MEDICAL INFO
====================================================== */

const getEmergencyMedicalInfo = async (userId) => {
  const { rows } = await pool.query(
    `SELECT *
     FROM emergency_medical_info
     WHERE user_id = $1`,
    [userId]
  );

  if (rows.length === 0) {
    return createDefaultMedicalInfo(userId);
  }

  return rows[0];
};

const createDefaultMedicalInfo = async (userId) => {
  const { rows } = await pool.query(
    `INSERT INTO emergency_medical_info (user_id)
     VALUES ($1)
     RETURNING *`,
    [userId]
  );
  return rows[0];
};

const updateEmergencyMedicalInfo = async (userId, medicalInfo) => {
  const {
    blood_type = null,
    allergies = [],
    medications = [],
    conditions = [],
    emergency_notes = '',
    doctor_name = '',
    doctor_phone = '',
    insurance_provider = '',
    insurance_id = ''
  } = medicalInfo;

  const { rows } = await pool.query(
    `
    INSERT INTO emergency_medical_info (
      user_id,
      blood_type,
      allergies,
      medications,
      conditions,
      emergency_notes,
      doctor_name,
      doctor_phone,
      insurance_provider,
      insurance_id
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    ON CONFLICT (user_id)
    DO UPDATE SET
      blood_type = EXCLUDED.blood_type,
      allergies = EXCLUDED.allergies,
      medications = EXCLUDED.medications,
      conditions = EXCLUDED.conditions,
      emergency_notes = EXCLUDED.emergency_notes,
      doctor_name = EXCLUDED.doctor_name,
      doctor_phone = EXCLUDED.doctor_phone,
      insurance_provider = EXCLUDED.insurance_provider,
      insurance_id = EXCLUDED.insurance_id,
      updated_at = NOW()
    RETURNING *
    `,
    [
      userId,
      blood_type,
      JSON.stringify(allergies),
      JSON.stringify(medications),
      JSON.stringify(conditions),
      emergency_notes,
      doctor_name,
      doctor_phone,
      insurance_provider,
      insurance_id
    ]
  );

  return rows[0];
};

/* ======================================================
   EMERGENCY CONTACTS
====================================================== */

const getEmergencyContacts = async (userId) => {
  const { rows } = await pool.query(
    `
    SELECT id, name, phone, email, relationship, is_primary
    FROM emergency_contacts
    WHERE user_id = $1
    ORDER BY is_primary DESC, created_at ASC
    `,
    [userId]
  );
  return rows;
};

const updateEmergencyContacts = async (userId, contacts) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `DELETE FROM emergency_contacts WHERE user_id = $1`,
      [userId]
    );

    for (const c of contacts) {
      await client.query(
        `
        INSERT INTO emergency_contacts
        (user_id, name, phone, email, relationship, is_primary)
        VALUES ($1,$2,$3,$4,$5,$6)
        `,
        [
          userId,
          c.name,
          c.phone,
          c.email || null,
          c.relationship,
          Boolean(c.is_primary)
        ]
      );
    }

    await client.query('COMMIT');
    return contacts;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

/* ======================================================
   TRIGGER EMERGENCY
====================================================== */

const triggerEmergency = async (userId, { location, medical_info }) => {
  const { rows } = await pool.query(
    `
    INSERT INTO emergency_logs
      (user_id, location, medical_info, status)
    VALUES ($1,$2,$3,'triggered')
    RETURNING *
    `,
    [
      userId,
      JSON.stringify(location),
      JSON.stringify(medical_info)
    ]
  );

  await notifyEmergencyContacts(userId, location, medical_info);
  await logToEmergencyServices(userId, location);

  return rows[0];
};

/* ======================================================
   NOTIFY CONTACTS (SMS)
====================================================== */

const notifyEmergencyContacts = async (userId, location) => {
  const contacts = await getEmergencyContacts(userId);
  const user = await getUserInfo(userId);

  const primaryContacts = contacts.filter(c => c.phone && c.is_primary);
  if (!primaryContacts.length) return;

  if (!process.env.TWILIO_ACCOUNT_SID) return;

  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  const locationLink = location
    ? `https://maps.google.com/?q=${location.latitude},${location.longitude}`
    : 'Location not available';

  const message = `
🚨 EMERGENCY ALERT 🚨
${user.name} has triggered SOS.

Location: ${locationLink}
Time: ${new Date().toLocaleString()}
  `.trim();

  await Promise.all(
    primaryContacts.map(c =>
      client.messages.create({
        to: c.phone,
        from: process.env.TWILIO_PHONE_NUMBER,
        body: message
      })
    )
  );
};

/* ======================================================
   USER INFO (SAFE)
====================================================== */

const getUserInfo = async (userId) => {
  const { rows } = await pool.query(
    `
    SELECT
      CONCAT(first_name, ' ', last_name) AS name,
      email,
      phone
    FROM users
    WHERE id = $1
    `,
    [userId]
  );
  return rows[0];
};

/* ======================================================
   ✅ CONNECT EMERGENCY DOCTOR (FIXED JSON)
====================================================== */

const connectEmergencyDoctor = async (userId, location, medicalInfo) => {
  const { rows } = await pool.query(
    `
    SELECT
      u.id,
      CONCAT(u.first_name, ' ', u.last_name) AS name,
      u.phone,
      dp.professional_details ->> 'specialization' AS specialization,
      da.current_queue
    FROM users u
    JOIN doctor_profiles dp ON dp.user_id = u.id
    JOIN doctor_availability da ON da.doctor_id = u.id
    WHERE u.role = 'doctor'
      AND da.is_online = true
      AND da.is_emergency_available = true
    ORDER BY da.current_queue ASC, da.last_active DESC
    LIMIT 1
    `
  );

  if (!rows.length) {
    throw new Error('No emergency doctor available');
  }

  const doctor = rows[0];

  const { rows: consultation } = await pool.query(
    `
    INSERT INTO emergency_consultations
      (patient_id, doctor_id, location, medical_info, status)
    VALUES ($1,$2,$3,$4,'connecting')
    RETURNING *
    `,
    [
      userId,
      doctor.id,
      JSON.stringify(location),
      JSON.stringify(medicalInfo)
    ]
  );

  return {
    doctor,
    consultation: consultation[0]
  };
};

/* ======================================================
   AMBULANCE / END / SERVICES
====================================================== */

const dispatchAmbulance = async (userId, location, medicalInfo, hospitalId) => {
  const { rows } = await pool.query(
    `
    INSERT INTO ambulance_dispatches
      (user_id, location, medical_info, hospital_id, status)
    VALUES ($1,$2,$3,$4,'dispatched')
    RETURNING *
    `,
    [
      userId,
      JSON.stringify(location),
      JSON.stringify(medicalInfo),
      hospitalId || null
    ]
  );
  return rows[0];
};

const endEmergency = async (userId, emergencyLogId) => {
  const { rows } = await pool.query(
    `
    UPDATE emergency_logs
    SET status='ended', ended_at=NOW()
    WHERE id=$1 AND user_id=$2
    RETURNING *
    `,
    [emergencyLogId, userId]
  );
  return rows[0];
};

const getEmergencyServices = async () => ([
  { id: 1, name: 'National Emergency', number: '112' },
  { id: 2, name: 'Ambulance', number: '108' },
  { id: 3, name: 'Police', number: '100' }
]);

/* ====================================================== */

module.exports = {
  getEmergencyMedicalInfo,
  updateEmergencyMedicalInfo,
  getEmergencyContacts,
  updateEmergencyContacts,
  triggerEmergency,
  connectEmergencyDoctor,
  dispatchAmbulance,
  endEmergency,
  getEmergencyServices
};