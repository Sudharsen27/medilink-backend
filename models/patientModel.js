// const pool = require('../config/db');

// /**
//  * Get all patients with optional search and pagination
//  */
// const getAllPatients = async (filters = {}) => {
//   try {
//     const { search, page = 1, limit = 50 } = filters;
//     const offset = (page - 1) * limit;

//     // First, check the actual column names in patients table
//     const checkColumnsQuery = `
//       SELECT column_name 
//       FROM information_schema.columns 
//       WHERE table_name = 'patients' 
//       AND column_name IN ('email', 'phone', 'gender', 'blood_type')
//     `;
    
//     const { rows: patientColumns } = await pool.query(checkColumnsQuery);
//     const patientColumnNames = patientColumns.map(col => col.column_name);

//     // Check medical_records table structure
//     const checkMRColumnsQuery = `
//       SELECT column_name 
//       FROM information_schema.columns 
//       WHERE table_name = 'medical_records'
//     `;
//     const { rows: mrColumns } = await pool.query(checkMRColumnsQuery);
//     const hasMedicalRecords = mrColumns.length > 0;
    
//     let query = `
//       SELECT 
//         p.*,
//         MAX(mr.visit_date) as last_visit,
//         COUNT(mr.id) as total_visits
//       FROM patients p
//     `;

//     let countQuery = `SELECT COUNT(*) FROM patients p`;
//     let whereConditions = [];
//     let queryParams = [];

//     // Join with medical_records if the table exists and has the right columns
//     if (hasMedicalRecords && mrColumns.some(col => col.column_name === 'patient_id')) {
//       query += ` LEFT JOIN medical_records mr ON p.id = mr.patient_id`;
//     } else {
//       query += ` LEFT JOIN (SELECT NULL as visit_date, NULL as id, NULL as patient_id) mr ON false`;
//     }

//     // Search filter
//     if (search) {
//       whereConditions.push(`
//         (p.name ILIKE $${queryParams.length + 1} OR 
//          ${patientColumnNames.includes('email') ? 'p.email' : "''"} ILIKE $${queryParams.length + 1} OR 
//          ${patientColumnNames.includes('phone') ? 'p.phone' : "''"} ILIKE $${queryParams.length + 1})
//       `);
//       queryParams.push(`%${search}%`);
//     }

//     // Add WHERE clause if conditions exist
//     if (whereConditions.length > 0) {
//       const whereClause = ' WHERE ' + whereConditions.join(' AND ');
//       query += whereClause;
//       countQuery += whereClause;
//     }

//     // Add GROUP BY and pagination
//     query += `
//       GROUP BY p.id
//       ORDER BY p.created_at DESC
//       LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
//     `;
//     queryParams.push(limit, offset);

//     // Execute queries
//     const [patientsResult, countResult] = await Promise.all([
//       pool.query(query, queryParams),
//       pool.query(countQuery, queryParams.slice(0, -2)) // Remove limit/offset for count
//     ]);

//     const patients = patientsResult.rows.map(patient => ({
//       ...patient,
//       age: patient.date_of_birth ? 
//         new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear() : null,
//       // Ensure all expected fields exist with fallbacks
//       email: patient.email || 'Not available',
//       phone: patient.phone || 'Not available',
//       gender: patient.gender || 'Not specified',
//       blood_type: patient.blood_type || 'Not set'
//     }));

//     return {
//       patients,
//       totalCount: parseInt(countResult.rows[0].count),
//       totalPages: Math.ceil(countResult.rows[0].count / limit),
//       currentPage: page
//     };
//   } catch (error) {
//     console.error('Error getting patients:', error);
//     throw new Error('Failed to fetch patients');
//   }
// };

// /**
//  * Get patient by ID
//  */
// const getPatientById = async (patientId) => {
//   try {
//     const query = `
//       SELECT p.*
//       FROM patients p
//       WHERE p.id = $1
//     `;

//     const { rows } = await pool.query(query, [patientId]);
    
//     if (rows.length === 0) {
//       throw new Error('Patient not found');
//     }

//     const patient = rows[0];
//     return {
//       ...patient,
//       age: patient.date_of_birth ? 
//         new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear() : null,
//       email: patient.email || 'Not available',
//       phone: patient.phone || 'Not available',
//       gender: patient.gender || 'Not specified',
//       blood_type: patient.blood_type || 'Not set',
//       allergies: patient.allergies || 'None recorded',
//       medical_conditions: patient.medical_conditions || 'None recorded'
//     };
//   } catch (error) {
//     console.error('Error getting patient by ID:', error);
//     throw new Error('Failed to fetch patient');
//   }
// };

// /**
//  * Create new patient
//  */
// const createPatient = async (patientData) => {
//   try {
//     // Check which columns actually exist in patients table
//     const checkColumnsQuery = `
//       SELECT column_name 
//       FROM information_schema.columns 
//       WHERE table_name = 'patients'
//     `;
//     const { rows: existingColumns } = await pool.query(checkColumnsQuery);
//     const columnNames = existingColumns.map(col => col.column_name);

//     // Build dynamic query based on available columns
//     const fields = [];
//     const placeholders = [];
//     const values = [];
//     let paramCount = 1;

//     const fieldMappings = {
//       name: patientData.name,
//       email: patientData.email,
//       phone: patientData.phone,
//       date_of_birth: patientData.date_of_birth,
//       gender: patientData.gender,
//       blood_type: patientData.blood_type,
//       allergies: patientData.allergies,
//       medical_conditions: patientData.medical_conditions,
//       emergency_contact_name: patientData.emergency_contact_name,
//       emergency_contact_phone: patientData.emergency_contact_phone
//     };

//     Object.entries(fieldMappings).forEach(([field, value]) => {
//       if (columnNames.includes(field) && value !== undefined) {
//         fields.push(field);
//         placeholders.push(`$${paramCount}`);
//         values.push(value);
//         paramCount++;
//       }
//     });

//     if (fields.length === 0) {
//       throw new Error('No valid fields to insert');
//     }

//     const query = `
//       INSERT INTO patients (${fields.join(', ')})
//       VALUES (${placeholders.join(', ')})
//       RETURNING *
//     `;

//     const { rows } = await pool.query(query, values);
//     return rows[0];
//   } catch (error) {
//     console.error('Error creating patient:', error);
//     throw new Error('Failed to create patient');
//   }
// };

// /**
//  * Update patient
//  */
// const updatePatient = async (patientId, patientData) => {
//   try {
//     // Check which columns actually exist
//     const checkColumnsQuery = `
//       SELECT column_name 
//       FROM information_schema.columns 
//       WHERE table_name = 'patients'
//     `;
//     const { rows: existingColumns } = await pool.query(checkColumnsQuery);
//     const columnNames = existingColumns.map(col => col.column_name);

//     // Build dynamic SET clause
//     const setClause = [];
//     const values = [patientId];
//     let paramCount = 2;

//     const fieldMappings = {
//       name: patientData.name,
//       email: patientData.email,
//       phone: patientData.phone,
//       date_of_birth: patientData.date_of_birth,
//       gender: patientData.gender,
//       blood_type: patientData.blood_type,
//       allergies: patientData.allergies,
//       medical_conditions: patientData.medical_conditions,
//       emergency_contact_name: patientData.emergency_contact_name,
//       emergency_contact_phone: patientData.emergency_contact_phone
//     };

//     Object.entries(fieldMappings).forEach(([field, value]) => {
//       if (columnNames.includes(field) && value !== undefined) {
//         setClause.push(`${field} = $${paramCount}`);
//         values.push(value);
//         paramCount++;
//       }
//     });

//     if (setClause.length === 0) {
//       throw new Error('No valid fields to update');
//     }

//     setClause.push('updated_at = CURRENT_TIMESTAMP');

//     const query = `
//       UPDATE patients 
//       SET ${setClause.join(', ')}
//       WHERE id = $1
//       RETURNING *
//     `;

//     const { rows } = await pool.query(query, values);
    
//     if (rows.length === 0) {
//       throw new Error('Patient not found');
//     }

//     return rows[0];
//   } catch (error) {
//     console.error('Error updating patient:', error);
//     throw new Error('Failed to update patient');
//   }
// };

// /**
//  * Delete patient
//  */
// const deletePatient = async (patientId) => {
//   try {
//     const query = 'DELETE FROM patients WHERE id = $1 RETURNING *';
//     const { rows } = await pool.query(query, [patientId]);
    
//     if (rows.length === 0) {
//       throw new Error('Patient not found');
//     }

//     return rows[0];
//   } catch (error) {
//     console.error('Error deleting patient:', error);
//     throw new Error('Failed to delete patient');
//   }
// };

// /**
//  * Get patient's medical records
//  */
// const getMedicalRecords = async (patientId) => {
//   try {
//     // First check if medical_records table exists and has patient_id column
//     const checkTableQuery = `
//       SELECT column_name 
//       FROM information_schema.columns 
//       WHERE table_name = 'medical_records' AND column_name = 'patient_id'
//     `;
    
//     const { rows: tableRows } = await pool.query(checkTableQuery);
    
//     if (tableRows.length === 0) {
//       // Return empty array if table doesn't exist or doesn't have patient_id
//       return [];
//     }

//     const query = `
//       SELECT mr.*
//       FROM medical_records mr
//       WHERE mr.patient_id = $1
//       ORDER BY mr.visit_date DESC, mr.created_at DESC
//     `;

//     const { rows } = await pool.query(query, [patientId]);
//     return rows;
//   } catch (error) {
//     console.error('Error getting medical records:', error);
//     return []; // Return empty array instead of throwing
//   }
// };

// /**
//  * Add medical record
//  */
// const addMedicalRecord = async (recordData) => {
//   try {
//     // Check if medical_records table exists with required columns
//     const checkColumnsQuery = `
//       SELECT column_name 
//       FROM information_schema.columns 
//       WHERE table_name = 'medical_records'
//       AND column_name IN ('patient_id', 'doctor_id', 'visit_date')
//     `;
    
//     const { rows: requiredColumns } = await pool.query(checkColumnsQuery);
    
//     if (requiredColumns.length < 3) {
//       throw new Error('Medical records table is not properly configured');
//     }

//     const {
//       patient_id, doctor_id, visit_date, record_type = 'consultation',
//       diagnosis, treatment, notes, prescriptions
//     } = recordData;

//     const query = `
//       INSERT INTO medical_records (
//         patient_id, doctor_id, visit_date, record_type, diagnosis,
//         treatment, notes, prescriptions
//       ) 
//       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
//       RETURNING *
//     `;

//     const values = [
//       patient_id, doctor_id, visit_date, record_type, diagnosis,
//       treatment, notes, prescriptions ? JSON.stringify(prescriptions) : null
//     ];

//     const { rows } = await pool.query(query, values);
//     return rows[0];
//   } catch (error) {
//     console.error('Error adding medical record:', error);
//     throw new Error('Failed to add medical record');
//   }
// };

// /**
//  * Get patient statistics
//  */
// const getPatientStats = async () => {
//   try {
//     // Simple stats that work with any schema
//     const totalPatientsQuery = 'SELECT COUNT(*) FROM patients';
//     const totalPatientsResult = await pool.query(totalPatientsQuery);

//     return {
//       total: parseInt(totalPatientsResult.rows[0].count),
//       byGender: [],
//       byBloodType: [],
//       recent: 0
//     };
//   } catch (error) {
//     console.error('Error getting patient stats:', error);
//     return {
//       total: 0,
//       byGender: [],
//       byBloodType: [],
//       recent: 0
//     };
//   }
// };

// module.exports = {
//   getAllPatients,
//   getPatientById,
//   createPatient,
//   updatePatient,
//   deletePatient,
//   getMedicalRecords,
//   addMedicalRecord,
//   getPatientStats
// };

// const pool = require('../config/db');

// /* ------------------------------------------------------
//    Utility: Detect available columns in "patients" table
// --------------------------------------------------------- */
// async function getPatientColumns() {
//   const query = `
//     SELECT column_name 
//     FROM information_schema.columns 
//     WHERE table_name = 'patients'
//   `;
//   const { rows } = await pool.query(query);
//   return rows.map(r => r.column_name);
// }

// /* ------------------------------------------------------
//    GET ALL PATIENTS (with search + pagination)
// --------------------------------------------------------- */
// const getAllPatients = async ({ search, page = 1, limit = 50 } = {}) => {
//   try {
//     const offset = (page - 1) * limit;

//     const query = `
//       SELECT 
//         p.*,
//         (
//           SELECT MAX(visit_date) 
//           FROM medical_records mr 
//           WHERE mr.patient_id = p.id
//         ) AS last_visit,
//         (
//           SELECT COUNT(*) 
//           FROM medical_records mr 
//           WHERE mr.patient_id = p.id
//         ) AS total_visits
//       FROM patients p
//       ${search ? `WHERE 
//           p.first_name ILIKE $1 OR 
//           p.last_name ILIKE $1 OR 
//           p.phone ILIKE $1 OR 
//           p.email ILIKE $1
//         ` : ""}
//       ORDER BY p.created_at DESC
//       LIMIT ${limit} OFFSET ${offset}
//     `;

//     const params = search ? [`%${search}%`] : [];

//     const patientsResult = await pool.query(query, params);
//     const countResult = await pool.query(`SELECT COUNT(*) FROM patients`);

//     return {
//       patients: patientsResult.rows,
//       totalCount: Number(countResult.rows[0].count),
//       totalPages: Math.ceil(countResult.rows[0].count / limit),
//       currentPage: page
//     };

//   } catch (error) {
//     console.error('❌ Error getting patients:', error);
//     throw new Error('Failed to fetch patients');
//   }
// };

// /* ------------------------------------------------------
//    GET PATIENT BY ID
// --------------------------------------------------------- */
// const getPatientById = async (id) => {
//   try {
//     const query = `SELECT * FROM patients WHERE id = $1`;
//     const { rows } = await pool.query(query, [id]);

//     if (rows.length === 0) throw new Error('Patient not found');

//     return rows[0];

//   } catch (error) {
//     console.error('❌ Error getting patient by ID:', error);
//     throw new Error('Failed to fetch patient');
//   }
// };

// /* ------------------------------------------------------
//    CREATE PATIENT (FIXED VERSION WITH first_name SUPPORT)
// --------------------------------------------------------- */
// const createPatient = async (data) => {
//   try {
//     const tableColumns = await getPatientColumns();

//     // Map allowed fields based on DB columns
//     const allowedFields = {
//       first_name: data.first_name,
//       last_name: data.last_name,
//       middle_name: data.middle_name,
//       email: data.email,
//       phone: data.phone,
//       date_of_birth: data.date_of_birth,
//       gender: data.gender,
//       blood_type: data.blood_type,
//       allergies: data.allergies,
//       medical_conditions: data.medical_conditions,
//       emergency_contact_name: data.emergency_contact_name,
//       emergency_contact_phone: data.emergency_contact_phone,
//       added_by: data.added_by
//     };

//     const fields = [];
//     const placeholders = [];
//     const values = [];
//     let i = 1;

//     for (const [key, value] of Object.entries(allowedFields)) {
//       if (value !== undefined && tableColumns.includes(key)) {
//         fields.push(key);
//         placeholders.push(`$${i}`);
//         values.push(value);
//         i++;
//       }
//     }

//     if (!fields.includes("first_name")) {
//       throw new Error("first_name is required but missing");
//     }

//     const query = `
//       INSERT INTO patients (${fields.join(", ")})
//       VALUES (${placeholders.join(", ")})
//       RETURNING *
//     `;

//     const { rows } = await pool.query(query, values);
//     return rows[0];

//   } catch (error) {
//     console.error('❌ Error creating patient:', error);
//     throw new Error('Failed to create patient');
//   }
// };

// /* ------------------------------------------------------
//    UPDATE PATIENT
// --------------------------------------------------------- */
// const updatePatient = async (id, data) => {
//   try {
//     const tableColumns = await getPatientColumns();

//     const allowedFields = {
//       first_name: data.first_name,
//       last_name: data.last_name,
//       middle_name: data.middle_name,
//       email: data.email,
//       phone: data.phone,
//       date_of_birth: data.date_of_birth,
//       gender: data.gender,
//       blood_type: data.blood_type,
//       allergies: data.allergies,
//       medical_conditions: data.medical_conditions,
//       emergency_contact_name: data.emergency_contact_name,
//       emergency_contact_phone: data.emergency_contact_phone
//     };

//     const sets = [];
//     const values = [id];
//     let i = 2;

//     for (const [key, value] of Object.entries(allowedFields)) {
//       if (value !== undefined && tableColumns.includes(key)) {
//         sets.push(`${key} = $${i}`);
//         values.push(value);
//         i++;
//       }
//     }

//     if (sets.length === 0) throw new Error("No fields to update");

//     const query = `
//       UPDATE patients 
//       SET ${sets.join(", ")}, updated_at = CURRENT_TIMESTAMP
//       WHERE id = $1
//       RETURNING *
//     `;

//     const { rows } = await pool.query(query, values);

//     if (rows.length === 0) throw new Error("Patient not found");

//     return rows[0];

//   } catch (error) {
//     console.error('❌ Error updating patient:', error);
//     throw new Error('Failed to update patient');
//   }
// };

// /* ------------------------------------------------------
//    DELETE PATIENT
// --------------------------------------------------------- */
// const deletePatient = async (id) => {
//   try {
//     const query = `DELETE FROM patients WHERE id = $1 RETURNING *`;
//     const { rows } = await pool.query(query, [id]);

//     if (rows.length === 0) throw new Error("Patient not found");

//     return rows[0];

//   } catch (error) {
//     console.error('❌ Error deleting patient:', error);
//     throw new Error('Failed to delete patient');
//   }
// };

// /* ------------------------------------------------------
//    EXPORT MODULE
// --------------------------------------------------------- */
// module.exports = {
//   getAllPatients,
//   getPatientById,
//   createPatient,
//   updatePatient,
//   deletePatient
// };


// models/patientModel.js
const pool = require('../config/db');

/**
 * Return list of column names for patients table
 */
async function getPatientColumns() {
  const q = `
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'patients'
  `;
  const { rows } = await pool.query(q);
  return rows.map(r => r.column_name);
}

/**
 * Check if medical_records table exists and which columns it has
 */
async function getMedicalRecordsColumns() {
  const q = `
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'medical_records'
  `;
  const { rows } = await pool.query(q);
  return rows.map(r => r.column_name);
}

/* ------------------------------------------------------
   GET ALL PATIENTS (search + pagination)
   - search applies to first_name, last_name, phone, email, address
--------------------------------------------------------- */
const getAllPatients = async ({ search, page = 1, limit = 50 } = {}) => {
  try {
    const offset = (page - 1) * limit;
    const params = [];
    let where = '';

    if (search) {
      // search across multiple columns
      params.push(`%${search}%`);
      where = `
        WHERE (
          p.first_name ILIKE $${params.length} OR
          p.last_name ILIKE $${params.length} OR
          p.phone ILIKE $${params.length} OR
          (p.email IS NOT NULL AND p.email ILIKE $${params.length}) OR
          (p.address IS NOT NULL AND p.address ILIKE $${params.length})
        )
      `;
    }

    // Fetch last visit and total visits from medical_records if exists (subqueries — safe if table missing)
    const lastVisitSubquery = `
      (
        SELECT MAX(mr.visit_date) FROM medical_records mr WHERE mr.patient_id = p.id
      ) AS last_visit
    `;
    const totalVisitsSubquery = `
      (
        SELECT COUNT(*) FROM medical_records mr WHERE mr.patient_id = p.id
      )::integer AS total_visits
    `;

    const mainQuery = `
      SELECT
        p.*,
        ${lastVisitSubquery},
        ${totalVisitsSubquery}
      FROM patients p
      ${where}
      ORDER BY p.created_at DESC
      LIMIT $${params.length + 1}
      OFFSET $${params.length + 2}
    `;

    params.push(limit, offset);

    const [patientsResult, countResult] = await Promise.all([
      pool.query(mainQuery, params),
      // count does not need limit/offset
      pool.query(`SELECT COUNT(*) AS count FROM patients p ${where}`, params.slice(0, Math.max(0, params.length - 2)))
    ]);

    const patients = patientsResult.rows.map(p => ({
      ...p,
      // normalize commonly-used fields (frontend convenience)
      dob: p.dob || null,
      email: p.email || null,
      phone: p.phone || null,
      gender: p.gender || null,
      blood_group: p.blood_group || null,
      allergies: p.allergies || null,
      medical_history: p.medical_history || null
    }));

    const totalCount = Number(countResult.rows[0]?.count || 0);

    return {
      patients,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page
    };
  } catch (error) {
    console.error('Error in getAllPatients:', error);
    throw new Error('Failed to fetch patients');
  }
};

/* ------------------------------------------------------
   GET PATIENT BY ID
--------------------------------------------------------- */
const getPatientById = async (patientId) => {
  try {
    const q = `SELECT * FROM patients WHERE id = $1`;
    const { rows } = await pool.query(q, [patientId]);
    if (!rows || rows.length === 0) {
      return null;
    }
    return rows[0];
  } catch (error) {
    console.error('Error in getPatientById:', error);
    throw new Error('Failed to fetch patient');
  }
};

/* ------------------------------------------------------
   CREATE PATIENT
   - Requires first_name, last_name, phone (not-null in your schema)
   - Accepts only columns that actually exist in DB
--------------------------------------------------------- */
const createPatient = async (data) => {
  try {
    const columns = await getPatientColumns();

    // map request keys to DB columns expected in your schema
    const fieldMap = {
      first_name: data.first_name,
      last_name: data.last_name,
      phone: data.phone,
      email: data.email,
      dob: data.dob, // date
      gender: data.gender,
      address: data.address,
      emergency_contact_name: data.emergency_contact_name,
      emergency_contact_phone: data.emergency_contact_phone,
      emergency_contact_relation: data.emergency_contact_relation,
      blood_group: data.blood_group,
      allergies: data.allergies,
      medical_history: data.medical_history,
      insurance_provider: data.insurance_provider,
      insurance_policy_number: data.insurance_policy_number,
      user_id: data.user_id // optional link to user/doctor
    };

    // Ensure required fields are present
    if (!data.first_name) throw new Error('first_name is required');
    if (!data.last_name) throw new Error('last_name is required');
    if (!data.phone) throw new Error('phone is required');

    const fields = [];
    const placeholders = [];
    const values = [];
    let i = 1;

    for (const [key, val] of Object.entries(fieldMap)) {
      if (val !== undefined && columns.includes(key)) {
        fields.push(key);
        placeholders.push(`$${i}`);
        // convert empty strings to null for optional fields to avoid inserting empty strings if not desired
        values.push(val === '' ? null : val);
        i++;
      }
    }

    if (fields.length === 0) {
      throw new Error('No valid patient fields provided');
    }

    const insertQuery = `
      INSERT INTO patients (${fields.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING *
    `;

    const { rows } = await pool.query(insertQuery, values);
    return rows[0];
  } catch (error) {
    console.error('Error in createPatient:', error);
    // bubble up helpful error messages for route handler
    throw new Error(error.message || 'Failed to create patient');
  }
};

/* ------------------------------------------------------
   UPDATE PATIENT
   - Only updates allowed/existing columns
--------------------------------------------------------- */
const updatePatient = async (patientId, data) => {
  try {
    const columns = await getPatientColumns();

    const fieldMap = {
      first_name: data.first_name,
      last_name: data.last_name,
      phone: data.phone,
      email: data.email,
      dob: data.dob,
      gender: data.gender,
      address: data.address,
      emergency_contact_name: data.emergency_contact_name,
      emergency_contact_phone: data.emergency_contact_phone,
      emergency_contact_relation: data.emergency_contact_relation,
      blood_group: data.blood_group,
      allergies: data.allergies,
      medical_history: data.medical_history,
      insurance_provider: data.insurance_provider,
      insurance_policy_number: data.insurance_policy_number,
      status: data.status
    };

    const sets = [];
    const values = [patientId];
    let i = 2;

    for (const [key, val] of Object.entries(fieldMap)) {
      if (val !== undefined && columns.includes(key)) {
        sets.push(`${key} = $${i}`);
        values.push(val === '' ? null : val);
        i++;
      }
    }

    if (sets.length === 0) {
      throw new Error('No valid fields to update');
    }

    const q = `
      UPDATE patients
      SET ${sets.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

    const { rows } = await pool.query(q, values);
    if (!rows || rows.length === 0) {
      throw new Error('Patient not found');
    }
    return rows[0];
  } catch (error) {
    console.error('Error in updatePatient:', error);
    throw new Error(error.message || 'Failed to update patient');
  }
};

/* ------------------------------------------------------
   DELETE PATIENT
--------------------------------------------------------- */
const deletePatient = async (patientId) => {
  try {
    const q = `DELETE FROM patients WHERE id = $1 RETURNING *`;
    const { rows } = await pool.query(q, [patientId]);
    if (!rows || rows.length === 0) {
      throw new Error('Patient not found');
    }
    return rows[0];
  } catch (error) {
    console.error('Error in deletePatient:', error);
    throw new Error('Failed to delete patient');
  }
};

/* ------------------------------------------------------
   GET MEDICAL RECORDS for a patient
   - Safe: checks table/columns first
--------------------------------------------------------- */
const getMedicalRecords = async (patientId) => {
  try {
    const mrColumns = await getMedicalRecordsColumns();
    if (!mrColumns || mrColumns.length === 0 || !mrColumns.includes('patient_id')) {
      // medical_records table not present or not modeled as expected
      return [];
    }

    const q = `
      SELECT mr.* 
      FROM medical_records mr
      WHERE mr.patient_id = $1
      ORDER BY mr.visit_date DESC, mr.created_at DESC
    `;
    const { rows } = await pool.query(q, [patientId]);
    return rows;
  } catch (error) {
    console.error('Error in getMedicalRecords:', error);
    return []; // return empty on failure to avoid breaking UI
  }
};

/* ------------------------------------------------------
   ADD MEDICAL RECORD
   - Expects at least patient_id and doctor_id (if available)
   - Validates required columns dynamically
--------------------------------------------------------- */
// const addMedicalRecord = async (recordData) => {
//   try {
//     const mrColumns = await getMedicalRecordsColumns();

//     if (!mrColumns || mrColumns.length === 0) {
//       throw new Error('medical_records table is not configured');
//     }

//     // Common fields we expect to be able to insert (if present)
//     const fieldMap = {
//       patient_id: recordData.patient_id,
//       doctor_id: recordData.doctor_id,
//       visit_date: recordData.visit_date,
//       record_type: recordData.record_type,
//       diagnosis: recordData.diagnosis,
//       treatment: recordData.treatment,
//       notes: recordData.notes,
//       prescriptions: recordData.prescriptions ? JSON.stringify(recordData.prescriptions) : null
//     };

//     // ensure essential columns exist
//     if (!mrColumns.includes('patient_id')) throw new Error('medical_records.patient_id is required in DB');
//     if (!mrColumns.includes('visit_date') && !mrColumns.includes('created_at')) {
//       // not fatal; just warn — but proceed if patient_id present
//     }

//     const fields = [];
//     const placeholders = [];
//     const values = [];
//     let i = 1;

//     for (const [key, val] of Object.entries(fieldMap)) {
//       if (val !== undefined && mrColumns.includes(key)) {
//         fields.push(key);
//         placeholders.push(`$${i}`);
//         values.push(val);
//         i++;
//       }
//     }

//     if (!fields.includes('patient_id')) throw new Error('patient_id is required to add medical record');

//     const q = `
//       INSERT INTO medical_records (${fields.join(', ')})
//       VALUES (${placeholders.join(', ')})
//       RETURNING *
//     `;

//     const { rows } = await pool.query(q, values);
//     return rows[0];
//   } catch (error) {
//     console.error('Error in addMedicalRecord:', error);
//     throw new Error(error.message || 'Failed to add medical record');
//   }
// };
/* ------------------------------------------------------
   ADD MEDICAL RECORD  (FULLY FIXED FOR YOUR TABLE)
--------------------------------------------------------- */
const addMedicalRecord = async (recordData) => {
  try {
    const mrColumns = await getMedicalRecordsColumns();

    if (!mrColumns || mrColumns.length === 0) {
      throw new Error("medical_records table is not configured");
    }

    // Required defaults
    const today = new Date().toISOString().split("T")[0];

    // Your DB requires: record_date, record_type, description
    const fieldMap = {
      patient_id: recordData.patient_id,
      doctor_id: recordData.doctor_id || null,
      record_type: recordData.record_type || "General",  // REQUIRED
      record_date: recordData.record_date || today,      // REQUIRED
      description: recordData.description || "No description provided", // REQUIRED
      visit_date: recordData.visit_date || today,        
      diagnosis: recordData.diagnosis || "",
      treatment: recordData.treatment || "",
      notes: recordData.notes || "",
      prescriptions: recordData.prescriptions
        ? JSON.stringify(recordData.prescriptions)
        : null,
      title: recordData.title || null,
      doctor_name: recordData.doctor_name || null,
      hospital: recordData.hospital || null,
      file_url: recordData.file_url || null,
      file_size: recordData.file_size || null,
      file_name: recordData.file_name || null,
    };

    const fields = [];
    const placeholders = [];
    const values = [];
    let i = 1;

    for (const [key, val] of Object.entries(fieldMap)) {
      if (mrColumns.includes(key)) {
        fields.push(key);
        placeholders.push(`$${i}`);
        values.push(val);
        i++;
      }
    }

    if (!fields.includes("patient_id")) {
      throw new Error("patient_id is required to add medical record");
    }

    const q = `
      INSERT INTO medical_records (${fields.join(", ")})
      VALUES (${placeholders.join(", ")})
      RETURNING *
    `;

    const { rows } = await pool.query(q, values);
    return rows[0];

  } catch (error) {
    console.error("Error in addMedicalRecord:", error);
    throw new Error(error.message || "Failed to add medical record");
  }
};

/* ------------------------------------------------------
   GET PATIENT STATS
   - Basic stats: total patients, by gender, recent count (30 days)
--------------------------------------------------------- */
const getPatientStats = async () => {
  try {
    const totalQ = `SELECT COUNT(*) AS count FROM patients`;
    const byGenderQ = `SELECT gender, COUNT(*) FROM patients GROUP BY gender`;
    const recentQ = `SELECT COUNT(*) AS count FROM patients WHERE created_at >= (CURRENT_TIMESTAMP - INTERVAL '30 days')`;

    const [totalRes, genderRes, recentRes] = await Promise.all([
      pool.query(totalQ),
      pool.query(byGenderQ),
      pool.query(recentQ)
    ]);

    const total = Number(totalRes.rows[0]?.count || 0);
    const byGender = genderRes.rows.map(r => ({ gender: r.gender, count: Number(r.count) }));
    const recent = Number(recentRes.rows[0]?.count || 0);

    return { total, byGender, recent };
  } catch (error) {
    console.error('Error in getPatientStats:', error);
    return { total: 0, byGender: [], recent: 0 };
  }
};

module.exports = {
  getPatientColumns,
  getAllPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
  getMedicalRecords,
  addMedicalRecord,
  getPatientStats
};
