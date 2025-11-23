// const pool = require('../config/db');
// const path = require('path');
// const fs = require('fs');

// /**
//  * Get all medical records for a user
//  */
// const getUserMedicalRecords = async (userId) => {
//   const query = `
//     SELECT 
//       id,
//       record_type,
//       record_date,
//       description,
//       doctor_name,
//       hospital,
//       file_url,
//       file_size,
//       file_name,
//       notes,
//       created_at
//     FROM medical_records 
//     WHERE user_id = $1
//     ORDER BY record_date DESC, created_at DESC
//   `;

//   const { rows } = await pool.query(query, [userId]);
//   return rows;
// };

// /**
//  * Get medical record by ID
//  */
// const getMedicalRecordById = async (recordId, userId) => {
//   const query = `
//     SELECT 
//       id,
//       record_type,
//       record_date,
//       description,
//       doctor_name,
//       hospital,
//       file_url,
//       file_size,
//       file_name,
//       notes,
//       created_at
//     FROM medical_records 
//     WHERE id = $1 AND user_id = $2
//   `;

//   const { rows } = await pool.query(query, [recordId, userId]);
//   return rows[0] || null;
// };

// /**
//  * Create a new medical record
//  */
// const createMedicalRecord = async (recordData) => {
//   const {
//     user_id,
//     record_type,
//     record_date,
//     description,
//     doctor_name,
//     hospital,
//     file_url,
//     file_size,
//     file_name,
//     notes
//   } = recordData;

//   const query = `
//     INSERT INTO medical_records (
//       user_id, record_type, record_date, description, 
//       doctor_name, hospital, file_url, file_size, file_name, notes
//     )
//     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
//     RETURNING *
//   `;

//   const values = [
//     user_id,
//     record_type,
//     record_date,
//     description,
//     doctor_name,
//     hospital,
//     file_url,
//     file_size,
//     file_name,
//     notes
//   ];

//   const { rows } = await pool.query(query, values);
//   return rows[0];
// };

// /**
//  * Delete medical record
//  */
// const deleteMedicalRecord = async (recordId, userId) => {
//   // First get the record to check if it has a file
//   const recordQuery = 'SELECT file_url FROM medical_records WHERE id = $1 AND user_id = $2';
//   const { rows } = await pool.query(recordQuery, [recordId, userId]);
  
//   if (rows.length === 0) {
//     return null;
//   }

//   const record = rows[0];

//   // Delete the file from storage if it exists
//   if (record.file_url) {
//     try {
//       const filePath = path.join(__dirname, '..', record.file_url);
//       if (fs.existsSync(filePath)) {
//         fs.unlinkSync(filePath);
//       }
//     } catch (error) {
//       console.error('Error deleting file:', error);
//       // Continue with database deletion even if file deletion fails
//     }
//   }

//   // Delete from database
//   const deleteQuery = 'DELETE FROM medical_records WHERE id = $1 AND user_id = $2 RETURNING *';
//   const { rows: deletedRows } = await pool.query(deleteQuery, [recordId, userId]);
//   return deletedRows[0] || null;
// };

// /**
//  * Get medical records statistics
//  */
// const getMedicalRecordsStats = async (userId) => {
//   const query = `
//     SELECT 
//       COUNT(*) as total,
//       COUNT(CASE WHEN record_date >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as recent_count,
//       COUNT(DISTINCT record_type) as type_count,
//       JSON_OBJECT_AGG(
//         record_type, 
//         COUNT(*)
//       ) FILTER (WHERE record_type IS NOT NULL) as records_by_type
//     FROM medical_records 
//     WHERE user_id = $1
//   `;

//   const { rows } = await pool.query(query, [userId]);
  
//   if (rows.length === 0) {
//     return {
//       total: 0,
//       recent_count: 0,
//       type_count: 0,
//       records_by_type: {}
//     };
//   }

//   const stats = rows[0];
  
//   // Parse JSON if it's returned as string (some PostgreSQL versions)
//   if (typeof stats.records_by_type === 'string') {
//     stats.records_by_type = JSON.parse(stats.records_by_type);
//   }

//   return stats;
// };

// /**
//  * Get records by type
//  */
// const getRecordsByType = async (userId, recordType) => {
//   const query = `
//     SELECT * FROM medical_records 
//     WHERE user_id = $1 AND record_type = $2
//     ORDER BY record_date DESC
//   `;

//   const { rows } = await pool.query(query, [userId, recordType]);
//   return rows;
// };

// /**
//  * Check if user owns the medical record
//  */
// const userOwnsRecord = async (recordId, userId) => {
//   const query = 'SELECT id FROM medical_records WHERE id = $1 AND user_id = $2';
//   const { rows } = await pool.query(query, [recordId, userId]);
//   return rows.length > 0;
// };

// module.exports = {
//   getUserMedicalRecords,
//   getMedicalRecordById,
//   createMedicalRecord,
//   deleteMedicalRecord,
//   getMedicalRecordsStats,
//   getRecordsByType,
//   userOwnsRecord
// };

// // models/medicalRecords.js
// const pool = require('../config/db');

// // createMedicalRecord - accepts an object with fields matching DB columns
// async function createMedicalRecord(record) {
//   const query = `
//     INSERT INTO medical_records (
//       user_id,
//       record_type,
//       title,
//       record_date,
//       description,
//       doctor_name,
//       hospital,
//       notes,
//       file_url,
//       file_size,
//       file_name
//     )
//     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
//     RETURNING *;
//   `;

//   const values = [
//     record.user_id,
//     record.record_type,
//     record.title || null,
//     record.record_date,
//     record.description,
//     record.doctor_name || null,
//     record.hospital || null,
//     record.notes || null,
//     record.file_url || null,
//     record.file_size || null,
//     record.file_name || null
//   ];

//   const { rows } = await pool.query(query, values);
//   return rows[0];
// }

// module.exports = {
//   // ... other exports
//   createMedicalRecord,
//   // getUserMedicalRecords, getMedicalRecordById, deleteMedicalRecord, etc.
// };

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
