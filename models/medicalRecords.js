
// models/medicalRecords.js
const pool = require('../config/db');

/* ----------------------------------------------------
   1. GET ALL USER RECORDS
---------------------------------------------------- */
async function getUserMedicalRecords(userId) {
  const query = `
    SELECT *
    FROM medical_records
    WHERE user_id = $1
    ORDER BY record_date DESC;
  `;
  const { rows } = await pool.query(query, [userId]);
  return rows;
}

/* ----------------------------------------------------
   2. GET SINGLE RECORD BY ID
---------------------------------------------------- */
async function getMedicalRecordById(id, userId) {
  const query = `
    SELECT *
    FROM medical_records
    WHERE id = $1 AND user_id = $2
    LIMIT 1;
  `;
  const { rows } = await pool.query(query, [id, userId]);
  return rows[0] || null;
}

/* ----------------------------------------------------
   3. CREATE A MEDICAL RECORD
---------------------------------------------------- */
async function createMedicalRecord(record) {
  const query = `
    INSERT INTO medical_records (
      user_id,
      record_type,
      title,
      record_date,
      description,
      doctor_name,
      hospital,
      notes,
      file_url,
      file_size,
      file_name
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    RETURNING *;
  `;

  const values = [
    record.user_id,
    record.record_type,
    record.title || null,
    record.record_date,
    record.description,
    record.doctor_name || null,
    record.hospital || null,
    record.notes || null,
    record.file_url || null,
    record.file_size || null,
    record.file_name || null
  ];

  const { rows } = await pool.query(query, values);
  return rows[0];
}

/* ----------------------------------------------------
   4. DELETE RECORD
---------------------------------------------------- */
async function deleteMedicalRecord(id, userId) {
  const query = `
    DELETE FROM medical_records
    WHERE id = $1 AND user_id = $2
    RETURNING *;
  `;
  const { rows } = await pool.query(query, [id, userId]);
  return rows[0] || null;
}

/* ----------------------------------------------------
   5. GET STATISTICS
---------------------------------------------------- */
async function getMedicalRecordsStats(userId) {
  const query = `
    SELECT record_type, COUNT(*) AS count
    FROM medical_records
    WHERE user_id = $1
    GROUP BY record_type;
  `;
  const { rows } = await pool.query(query, [userId]);

  const stats = {};
  rows.forEach((r) => {
    stats[r.record_type] = Number(r.count);
  });

  return stats;
}

/* ----------------------------------------------------
   6. GET RECORDS BY TYPE
---------------------------------------------------- */
async function getRecordsByType(userId, type) {
  const query = `
    SELECT *
    FROM medical_records
    WHERE user_id = $1 AND record_type = $2
    ORDER BY record_date DESC;
  `;
  const { rows } = await pool.query(query, [userId, type]);
  return rows;
}

/* ----------------------------------------------------
   EXPORT FUNCTIONS
---------------------------------------------------- */
module.exports = {
  getUserMedicalRecords,
  getMedicalRecordById,
  createMedicalRecord,
  deleteMedicalRecord,
  getMedicalRecordsStats,
  getRecordsByType
};
