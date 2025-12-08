// const pool = require('../config/db');
// const twilio = require('twilio');

// /**
//  * Get emergency medical info
//  */
// const getEmergencyMedicalInfo = async (userId) => {
//   const query = `
//     SELECT 
//       blood_type,
//       allergies,
//       medications,
//       conditions,
//       emergency_notes,
//       doctor_name,
//       doctor_phone,
//       insurance_provider,
//       insurance_id
//     FROM emergency_medical_info 
//     WHERE user_id = $1
//   `;

//   const { rows } = await pool.query(query, [userId]);
  
//   if (rows.length === 0) {
//     // Create default medical info if doesn't exist
//     return createDefaultMedicalInfo(userId);
//   }
  
//   return rows[0];
// };

// /**
//  * Create default medical info
//  */
// const createDefaultMedicalInfo = async (userId) => {
//   const defaultInfo = {
//     blood_type: null,
//     allergies: [],
//     medications: [],
//     conditions: [],
//     emergency_notes: '',
//     doctor_name: '',
//     doctor_phone: '',
//     insurance_provider: '',
//     insurance_id: ''
//   };

//   const query = `
//     INSERT INTO emergency_medical_info (user_id, blood_type, allergies, medications, conditions)
//     VALUES ($1, $2, $3, $4, $5)
//     RETURNING *
//   `;

//   const values = [
//     userId,
//     defaultInfo.blood_type,
//     JSON.stringify(defaultInfo.allergies),
//     JSON.stringify(defaultInfo.medications),
//     JSON.stringify(defaultInfo.conditions)
//   ];

//   const { rows } = await pool.query(query, values);
//   return rows[0];
// };

// /**
//  * Update emergency medical info
//  */
// const updateEmergencyMedicalInfo = async (userId, medicalInfo) => {
//   const {
//     blood_type,
//     allergies,
//     medications,
//     conditions,
//     emergency_notes,
//     doctor_name,
//     doctor_phone,
//     insurance_provider,
//     insurance_id
//   } = medicalInfo;

//   const query = `
//     INSERT INTO emergency_medical_info (
//       user_id, blood_type, allergies, medications, conditions, 
//       emergency_notes, doctor_name, doctor_phone, insurance_provider, insurance_id
//     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
//     ON CONFLICT (user_id) 
//     DO UPDATE SET
//       blood_type = EXCLUDED.blood_type,
//       allergies = EXCLUDED.allergies,
//       medications = EXCLUDED.medications,
//       conditions = EXCLUDED.conditions,
//       emergency_notes = EXCLUDED.emergency_notes,
//       doctor_name = EXCLUDED.doctor_name,
//       doctor_phone = EXCLUDED.doctor_phone,
//       insurance_provider = EXCLUDED.insurance_provider,
//       insurance_id = EXCLUDED.insurance_id,
//       updated_at = CURRENT_TIMESTAMP
//     RETURNING *
//   `;

//   const values = [
//     userId,
//     blood_type,
//     JSON.stringify(allergies || []),
//     JSON.stringify(medications || []),
//     JSON.stringify(conditions || []),
//     emergency_notes,
//     doctor_name,
//     doctor_phone,
//     insurance_provider,
//     insurance_id
//   ];

//   const { rows } = await pool.query(query, values);
//   return rows[0];
// };

// /**
//  * Get emergency contacts
//  */
// const getEmergencyContacts = async (userId) => {
//   const query = `
//     SELECT 
//       id,
//       name,
//       phone,
//       email,
//       relationship,
//       is_primary,
//       created_at
//     FROM emergency_contacts 
//     WHERE user_id = $1
//     ORDER BY is_primary DESC, created_at ASC
//   `;

//   const { rows } = await pool.query(query, [userId]);
//   return rows;
// };

// /**
//  * Update emergency contacts
//  */
// const updateEmergencyContacts = async (userId, contacts) => {
//   // Start a transaction
//   const client = await pool.connect();
  
//   try {
//     await client.query('BEGIN');
    
//     // Delete existing contacts
//     await client.query('DELETE FROM emergency_contacts WHERE user_id = $1', [userId]);
    
//     // Insert new contacts
//     const insertPromises = contacts.map(async (contact) => {
//       const query = `
//         INSERT INTO emergency_contacts (
//           user_id, name, phone, email, relationship, is_primary
//         ) VALUES ($1, $2, $3, $4, $5, $6)
//         RETURNING *
//       `;

//       const values = [
//         userId,
//         contact.name,
//         contact.phone,
//         contact.email,
//         contact.relationship,
//         contact.is_primary || false
//       ];

//       return client.query(query, values);
//     });

//     await Promise.all(insertPromises);
//     await client.query('COMMIT');
    
//     return contacts;
//   } catch (error) {
//     await client.query('ROLLBACK');
//     throw error;
//   } finally {
//     client.release();
//   }
// };

// /**
//  * Trigger emergency
//  */
// const triggerEmergency = async (userId, emergencyData) => {
//   const { location, medical_info } = emergencyData;
  
//   const query = `
//     INSERT INTO emergency_logs (
//       user_id,
//       location,
//       medical_info,
//       status,
//       triggered_at
//     ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
//     RETURNING *
//   `;

//   const values = [
//     userId,
//     JSON.stringify(location),
//     JSON.stringify(medical_info),
//     'triggered'
//   ];

//   const { rows } = await pool.query(query, values);
  
//   // Send SMS to emergency contacts
//   await notifyEmergencyContacts(userId, location, medical_info);
  
//   // Log to emergency services (in production, this would integrate with actual emergency services)
//   await logToEmergencyServices(userId, location);
  
//   return rows[0];
// };

// /**
//  * Notify emergency contacts via SMS
//  */
// const notifyEmergencyContacts = async (userId, location, medicalInfo) => {
//   try {
//     const contacts = await getEmergencyContacts(userId);
//     const user = await getUserInfo(userId);
    
//     // Filter contacts with phone numbers
//     const contactsWithPhone = contacts.filter(contact => contact.phone && contact.is_primary);
    
//     if (contactsWithPhone.length === 0) {
//       return;
//     }

//     // Configure Twilio (replace with your credentials)
//     const accountSid = process.env.TWILIO_ACCOUNT_SID;
//     const authToken = process.env.TWILIO_AUTH_TOKEN;
//     const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
    
//     if (!accountSid || !authToken || !twilioPhone) {
//       console.log('Twilio not configured, skipping SMS notifications');
//       return;
//     }
    
//     const client = twilio(accountSid, authToken);
    
//     // Create message
//     const locationLink = location 
//       ? `https://maps.google.com/?q=${location.latitude},${location.longitude}`
//       : 'Location not available';
    
//     const message = `
// 🚨 EMERGENCY ALERT 🚨

// ${user.full_name} has triggered an emergency SOS via MediLink.

// Location: ${locationLink}
// Time: ${new Date().toLocaleString()}

// Medical Info:
// - Blood Type: ${medicalInfo.blood_type || 'Not specified'}
// - Allergies: ${medicalInfo.allergies?.join(', ') || 'None'}
// - Conditions: ${medicalInfo.conditions?.join(', ') || 'None'}

// Please check on them immediately!
//     `.trim();
    
//     // Send SMS to each contact
//     const smsPromises = contactsWithPhone.map(contact =>
//       client.messages.create({
//         body: message,
//         from: twilioPhone,
//         to: contact.phone
//       })
//     );
    
//     await Promise.all(smsPromises);
    
//   } catch (error) {
//     console.error('Error sending emergency notifications:', error);
//     // Don't throw error - we don't want emergency trigger to fail because of notifications
//   }
// };

// /**
//  * Get user info
//  */
// const getUserInfo = async (userId) => {
//   const query = 'SELECT full_name, email, phone FROM users WHERE id = $1';
//   const { rows } = await pool.query(query, [userId]);
//   return rows[0];
// };

// /**
//  * Log to emergency services
//  */
// const logToEmergencyServices = async (userId, location) => {
//   // In production, this would integrate with actual emergency services
//   // For now, we'll just log it to our database
  
//   const query = `
//     INSERT INTO emergency_service_logs (
//       user_id,
//       location,
//       service_type,
//       status,
//       logged_at
//     ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
//   `;

//   const values = [
//     userId,
//     JSON.stringify(location),
//     'emergency_trigger',
//     'logged'
//   ];

//   await pool.query(query, values);
// };

// /**
//  * Connect to emergency doctor
//  */
// const connectEmergencyDoctor = async (userId, location, medicalInfo) => {
//   // Find available emergency doctors
//   const query = `
//     SELECT 
//       u.id,
//       u.full_name,
//       u.phone,
//       dp.specialization,
//       dp.consultation_fee
//     FROM users u
//     INNER JOIN doctor_profiles dp ON u.id = dp.user_id
//     INNER JOIN doctor_availability da ON u.id = da.doctor_id
//     WHERE u.role = 'doctor'
//     AND u.is_active = true
//     AND da.is_emergency_available = true
//     AND da.is_online = true
//     ORDER BY da.last_active DESC
//     LIMIT 1
//   `;

//   const { rows } = await pool.query(query);
  
//   if (rows.length === 0) {
//     throw new Error('No emergency doctors available at the moment');
//   }
  
//   const doctor = rows[0];
  
//   // Create emergency consultation
//   const consultationQuery = `
//     INSERT INTO emergency_consultations (
//       patient_id,
//       doctor_id,
//       location,
//       medical_info,
//       status,
//       created_at
//     ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
//     RETURNING *
//   `;

//   const consultationValues = [
//     userId,
//     doctor.id,
//     JSON.stringify(location),
//     JSON.stringify(medicalInfo),
//     'connecting'
//   ];

//   const consultationResult = await pool.query(consultationQuery, consultationValues);
  
//   return {
//     doctor,
//     consultation: consultationResult.rows[0]
//   };
// };

// /**
//  * Dispatch ambulance
//  */
// const dispatchAmbulance = async (userId, location, medicalInfo, hospitalId) => {
//   // Log ambulance dispatch
//   const query = `
//     INSERT INTO ambulance_dispatches (
//       user_id,
//       location,
//       medical_info,
//       hospital_id,
//       status,
//       dispatched_at
//     ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
//     RETURNING *
//   `;

//   const values = [
//     userId,
//     JSON.stringify(location),
//     JSON.stringify(medicalInfo),
//     hospitalId,
//     'dispatched'
//   ];

//   const { rows } = await pool.query(query, values);
  
//   // In production, this would integrate with actual ambulance services
//   // For now, return the dispatch record
  
//   return rows[0];
// };

// /**
//  * End emergency
//  */
// const endEmergency = async (userId, emergencyLogId) => {
//   const query = `
//     UPDATE emergency_logs 
//     SET 
//       status = 'ended',
//       ended_at = CURRENT_TIMESTAMP
//     WHERE id = $1 AND user_id = $2
//     RETURNING *
//   `;

//   const { rows } = await pool.query(query, [emergencyLogId, userId]);
//   return rows[0];
// };

// /**
//  * Get emergency services
//  */
// const getEmergencyServices = async () => {
//   // Return default emergency services
//   return [
//     { id: 1, name: 'National Emergency Number', number: '112', type: 'general' },
//     { id: 2, name: 'Ambulance', number: '108', type: 'ambulance' },
//     { id: 3, name: 'Police', number: '100', type: 'police' },
//     { id: 4, name: 'Fire', number: '101', type: 'fire' },
//     { id: 5, name: 'Women Helpline', number: '1091', type: 'helpline' },
//     { id: 6, name: 'Child Helpline', number: '1098', type: 'helpline' },
//     { id: 7, name: 'Mental Health Helpline', number: '1800-599-0019', type: 'helpline' }
//   ];
// };

// module.exports = {
//   getEmergencyMedicalInfo,
//   updateEmergencyMedicalInfo,
//   getEmergencyContacts,
//   updateEmergencyContacts,
//   triggerEmergency,
//   connectEmergencyDoctor,
//   dispatchAmbulance,
//   endEmergency,
//   getEmergencyServices
// };

const pool = require('../config/db');
const twilio = require('twilio');

// /* ======================================================
//    EMERGENCY MEDICAL INFO
// ====================================================== */

// const getEmergencyMedicalInfo = async (userId) => {
//   const { rows } = await pool.query(
//     `SELECT *
//      FROM emergency_medical_info
//      WHERE user_id = $1`,
//     [userId]
//   );

//   if (rows.length === 0) {
//     return createDefaultMedicalInfo(userId);
//   }

//   return rows[0];
// };

// const createDefaultMedicalInfo = async (userId) => {
//   const { rows } = await pool.query(
//     `INSERT INTO emergency_medical_info (user_id)
//      VALUES ($1)
//      RETURNING *`,
//     [userId]
//   );
//   return rows[0];
// };

// const updateEmergencyMedicalInfo = async (userId, medicalInfo) => {
//   const {
//     blood_type,
//     allergies = [],
//     medications = [],
//     conditions = [],
//     emergency_notes,
//     doctor_name,
//     doctor_phone,
//     insurance_provider,
//     insurance_id
//   } = medicalInfo;

//   const { rows } = await pool.query(
//     `
//     INSERT INTO emergency_medical_info (
//       user_id, blood_type, allergies, medications, conditions,
//       emergency_notes, doctor_name, doctor_phone,
//       insurance_provider, insurance_id
//     )
//     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
//     ON CONFLICT (user_id)
//     DO UPDATE SET
//       blood_type = EXCLUDED.blood_type,
//       allergies = EXCLUDED.allergies,
//       medications = EXCLUDED.medications,
//       conditions = EXCLUDED.conditions,
//       emergency_notes = EXCLUDED.emergency_notes,
//       doctor_name = EXCLUDED.doctor_name,
//       doctor_phone = EXCLUDED.doctor_phone,
//       insurance_provider = EXCLUDED.insurance_provider,
//       insurance_id = EXCLUDED.insurance_id,
//       updated_at = NOW()
//     RETURNING *
//     `,
//     [
//       userId,
//       blood_type,
//       allergies,
//       medications,
//       conditions,
//       emergency_notes,
//       doctor_name,
//       doctor_phone,
//       insurance_provider,
//       insurance_id
//     ]
//   );

//   return rows[0];
// };

// /* ======================================================
//    EMERGENCY CONTACTS
// ====================================================== */

// const getEmergencyContacts = async (userId) => {
//   const { rows } = await pool.query(
//     `
//     SELECT id, name, phone, email, relationship, is_primary
//     FROM emergency_contacts
//     WHERE user_id = $1
//     ORDER BY is_primary DESC, created_at
//     `,
//     [userId]
//   );
//   return rows;
// };

// const updateEmergencyContacts = async (userId, contacts) => {
//   const client = await pool.connect();
//   try {
//     await client.query('BEGIN');

//     await client.query(
//       `DELETE FROM emergency_contacts WHERE user_id = $1`,
//       [userId]
//     );

//     for (const c of contacts) {
//       await client.query(
//         `
//         INSERT INTO emergency_contacts
//         (user_id, name, phone, email, relationship, is_primary)
//         VALUES ($1,$2,$3,$4,$5,$6)
//         `,
//         [userId, c.name, c.phone, c.email, c.relationship, c.is_primary || false]
//       );
//     }

//     await client.query('COMMIT');
//     return contacts;
//   } catch (err) {
//     await client.query('ROLLBACK');
//     throw err;
//   } finally {
//     client.release();
//   }
// };

// /* ======================================================
//    TRIGGER EMERGENCY
// ====================================================== */

// const triggerEmergency = async (userId, { location, medical_info }) => {
//   const { rows } = await pool.query(
//     `
//     INSERT INTO emergency_logs (user_id, location, medical_info, status)
//     VALUES ($1,$2,$3,'triggered')
//     RETURNING *
//     `,
//     [userId, location, medical_info]
//   );

//   await notifyEmergencyContacts(userId, location, medical_info);
//   await logToEmergencyServices(userId, location);

//   return rows[0];
// };

// /* ======================================================
//    NOTIFY CONTACTS (SMS)
// ====================================================== */

// const notifyEmergencyContacts = async (userId, location, medicalInfo) => {
//   const contacts = await getEmergencyContacts(userId);
//   const user = await getUserInfo(userId);

//   const primaryContacts = contacts.filter(c => c.phone && c.is_primary);
//   if (primaryContacts.length === 0) return;

//   if (!process.env.TWILIO_ACCOUNT_SID) return;

//   const client = twilio(
//     process.env.TWILIO_ACCOUNT_SID,
//     process.env.TWILIO_AUTH_TOKEN
//   );

//   const locationLink = location
//     ? `https://maps.google.com/?q=${location.latitude},${location.longitude}`
//     : 'Location not available';

//   const message = `
// 🚨 EMERGENCY ALERT 🚨
// ${user.name} has triggered an SOS.

// Location: ${locationLink}
// Time: ${new Date().toLocaleString()}
//   `.trim();

//   await Promise.all(
//     primaryContacts.map(c =>
//       client.messages.create({
//         to: c.phone,
//         from: process.env.TWILIO_PHONE_NUMBER,
//         body: message
//       })
//     )
//   );
// };

// /* ======================================================
//    ✅ FIXED USER INFO (NO full_name)
// ====================================================== */

// const getUserInfo = async (userId) => {
//   const { rows } = await pool.query(
//     `
//     SELECT 
//       CONCAT(first_name, ' ', last_name) AS name,
//       email,
//       phone
//     FROM users
//     WHERE id = $1
//     `,
//     [userId]
//   );
//   return rows[0];
// };

// /* ======================================================
//    ✅ FIXED CONNECT EMERGENCY DOCTOR
// ====================================================== */

// const connectEmergencyDoctor = async (userId, location, medicalInfo) => {
//   const { rows } = await pool.query(
//     `
//     SELECT
//       u.id,
//       CONCAT(u.first_name, ' ', u.last_name) AS name,
//       u.phone,
//       dp.specialization,
//       da.current_queue
//     FROM users u
//     JOIN doctor_profiles dp ON dp.user_id = u.id
//     JOIN doctor_availability da ON da.doctor_id = u.id
//     WHERE u.role = 'doctor'
//       AND da.is_online = true
//       AND da.is_emergency_available = true
//       AND da.current_queue < da.max_emergency_queue
//     ORDER BY da.current_queue ASC, da.last_active DESC
//     LIMIT 1
//     `
//   );

//   if (rows.length === 0) {
//     throw new Error('No emergency doctor available');
//   }

//   const doctor = rows[0];

//   const { rows: consultation } = await pool.query(
//     `
//     INSERT INTO emergency_consultations
//       (patient_id, doctor_id, location, medical_info, status)
//     VALUES ($1,$2,$3,$4,'connecting')
//     RETURNING *
//     `,
//     [userId, doctor.id, location, medicalInfo]
//   );

//   return {
//     doctor,
//     consultation: consultation[0]
//   };
// };

// /* ======================================================
//    AMBULANCE / END / SERVICES
// ====================================================== */

// const dispatchAmbulance = async (userId, location, medicalInfo, hospitalId) => {
//   const { rows } = await pool.query(
//     `
//     INSERT INTO ambulance_dispatches
//       (user_id, location, medical_info, hospital_id, status)
//     VALUES ($1,$2,$3,$4,'dispatched')
//     RETURNING *
//     `,
//     [userId, location, medicalInfo, hospitalId]
//   );
//   return rows[0];
// };

// const endEmergency = async (userId, emergencyLogId) => {
//   const { rows } = await pool.query(
//     `
//     UPDATE emergency_logs
//     SET status='ended', ended_at=NOW()
//     WHERE id=$1 AND user_id=$2
//     RETURNING *
//     `,
//     [emergencyLogId, userId]
//   );
//   return rows[0];
// };

// const getEmergencyServices = async () => ([
//   { id: 1, name: 'National Emergency', number: '112' },
//   { id: 2, name: 'Ambulance', number: '108' },
//   { id: 3, name: 'Police', number: '100' }
// ]);

// /* ====================================================== */

// module.exports = {
//   getEmergencyMedicalInfo,
//   updateEmergencyMedicalInfo,
//   getEmergencyContacts,
//   updateEmergencyContacts,
//   triggerEmergency,
//   connectEmergencyDoctor,
//   dispatchAmbulance,
//   endEmergency,
//   getEmergencyServices
// };

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