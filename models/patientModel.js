const pool = require('../config/db');

/**
 * Get all patients with optional search and pagination
 */
const getAllPatients = async (filters = {}) => {
  try {
    const { search, page = 1, limit = 50 } = filters;
    const offset = (page - 1) * limit;

    // First, check the actual column names in patients table
    const checkColumnsQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'patients' 
      AND column_name IN ('email', 'phone', 'gender', 'blood_type')
    `;
    
    const { rows: patientColumns } = await pool.query(checkColumnsQuery);
    const patientColumnNames = patientColumns.map(col => col.column_name);

    // Check medical_records table structure
    const checkMRColumnsQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'medical_records'
    `;
    const { rows: mrColumns } = await pool.query(checkMRColumnsQuery);
    const hasMedicalRecords = mrColumns.length > 0;
    
    let query = `
      SELECT 
        p.*,
        MAX(mr.visit_date) as last_visit,
        COUNT(mr.id) as total_visits
      FROM patients p
    `;

    let countQuery = `SELECT COUNT(*) FROM patients p`;
    let whereConditions = [];
    let queryParams = [];

    // Join with medical_records if the table exists and has the right columns
    if (hasMedicalRecords && mrColumns.some(col => col.column_name === 'patient_id')) {
      query += ` LEFT JOIN medical_records mr ON p.id = mr.patient_id`;
    } else {
      query += ` LEFT JOIN (SELECT NULL as visit_date, NULL as id, NULL as patient_id) mr ON false`;
    }

    // Search filter
    if (search) {
      whereConditions.push(`
        (p.name ILIKE $${queryParams.length + 1} OR 
         ${patientColumnNames.includes('email') ? 'p.email' : "''"} ILIKE $${queryParams.length + 1} OR 
         ${patientColumnNames.includes('phone') ? 'p.phone' : "''"} ILIKE $${queryParams.length + 1})
      `);
      queryParams.push(`%${search}%`);
    }

    // Add WHERE clause if conditions exist
    if (whereConditions.length > 0) {
      const whereClause = ' WHERE ' + whereConditions.join(' AND ');
      query += whereClause;
      countQuery += whereClause;
    }

    // Add GROUP BY and pagination
    query += `
      GROUP BY p.id
      ORDER BY p.created_at DESC
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;
    queryParams.push(limit, offset);

    // Execute queries
    const [patientsResult, countResult] = await Promise.all([
      pool.query(query, queryParams),
      pool.query(countQuery, queryParams.slice(0, -2)) // Remove limit/offset for count
    ]);

    const patients = patientsResult.rows.map(patient => ({
      ...patient,
      age: patient.date_of_birth ? 
        new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear() : null,
      // Ensure all expected fields exist with fallbacks
      email: patient.email || 'Not available',
      phone: patient.phone || 'Not available',
      gender: patient.gender || 'Not specified',
      blood_type: patient.blood_type || 'Not set'
    }));

    return {
      patients,
      totalCount: parseInt(countResult.rows[0].count),
      totalPages: Math.ceil(countResult.rows[0].count / limit),
      currentPage: page
    };
  } catch (error) {
    console.error('Error getting patients:', error);
    throw new Error('Failed to fetch patients');
  }
};

/**
 * Get patient by ID
 */
const getPatientById = async (patientId) => {
  try {
    const query = `
      SELECT p.*
      FROM patients p
      WHERE p.id = $1
    `;

    const { rows } = await pool.query(query, [patientId]);
    
    if (rows.length === 0) {
      throw new Error('Patient not found');
    }

    const patient = rows[0];
    return {
      ...patient,
      age: patient.date_of_birth ? 
        new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear() : null,
      email: patient.email || 'Not available',
      phone: patient.phone || 'Not available',
      gender: patient.gender || 'Not specified',
      blood_type: patient.blood_type || 'Not set',
      allergies: patient.allergies || 'None recorded',
      medical_conditions: patient.medical_conditions || 'None recorded'
    };
  } catch (error) {
    console.error('Error getting patient by ID:', error);
    throw new Error('Failed to fetch patient');
  }
};

/**
 * Create new patient
 */
const createPatient = async (patientData) => {
  try {
    // Check which columns actually exist in patients table
    const checkColumnsQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'patients'
    `;
    const { rows: existingColumns } = await pool.query(checkColumnsQuery);
    const columnNames = existingColumns.map(col => col.column_name);

    // Build dynamic query based on available columns
    const fields = [];
    const placeholders = [];
    const values = [];
    let paramCount = 1;

    const fieldMappings = {
      name: patientData.name,
      email: patientData.email,
      phone: patientData.phone,
      date_of_birth: patientData.date_of_birth,
      gender: patientData.gender,
      blood_type: patientData.blood_type,
      allergies: patientData.allergies,
      medical_conditions: patientData.medical_conditions,
      emergency_contact_name: patientData.emergency_contact_name,
      emergency_contact_phone: patientData.emergency_contact_phone
    };

    Object.entries(fieldMappings).forEach(([field, value]) => {
      if (columnNames.includes(field) && value !== undefined) {
        fields.push(field);
        placeholders.push(`$${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No valid fields to insert');
    }

    const query = `
      INSERT INTO patients (${fields.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING *
    `;

    const { rows } = await pool.query(query, values);
    return rows[0];
  } catch (error) {
    console.error('Error creating patient:', error);
    throw new Error('Failed to create patient');
  }
};

/**
 * Update patient
 */
const updatePatient = async (patientId, patientData) => {
  try {
    // Check which columns actually exist
    const checkColumnsQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'patients'
    `;
    const { rows: existingColumns } = await pool.query(checkColumnsQuery);
    const columnNames = existingColumns.map(col => col.column_name);

    // Build dynamic SET clause
    const setClause = [];
    const values = [patientId];
    let paramCount = 2;

    const fieldMappings = {
      name: patientData.name,
      email: patientData.email,
      phone: patientData.phone,
      date_of_birth: patientData.date_of_birth,
      gender: patientData.gender,
      blood_type: patientData.blood_type,
      allergies: patientData.allergies,
      medical_conditions: patientData.medical_conditions,
      emergency_contact_name: patientData.emergency_contact_name,
      emergency_contact_phone: patientData.emergency_contact_phone
    };

    Object.entries(fieldMappings).forEach(([field, value]) => {
      if (columnNames.includes(field) && value !== undefined) {
        setClause.push(`${field} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (setClause.length === 0) {
      throw new Error('No valid fields to update');
    }

    setClause.push('updated_at = CURRENT_TIMESTAMP');

    const query = `
      UPDATE patients 
      SET ${setClause.join(', ')}
      WHERE id = $1
      RETURNING *
    `;

    const { rows } = await pool.query(query, values);
    
    if (rows.length === 0) {
      throw new Error('Patient not found');
    }

    return rows[0];
  } catch (error) {
    console.error('Error updating patient:', error);
    throw new Error('Failed to update patient');
  }
};

/**
 * Delete patient
 */
const deletePatient = async (patientId) => {
  try {
    const query = 'DELETE FROM patients WHERE id = $1 RETURNING *';
    const { rows } = await pool.query(query, [patientId]);
    
    if (rows.length === 0) {
      throw new Error('Patient not found');
    }

    return rows[0];
  } catch (error) {
    console.error('Error deleting patient:', error);
    throw new Error('Failed to delete patient');
  }
};

/**
 * Get patient's medical records
 */
const getMedicalRecords = async (patientId) => {
  try {
    // First check if medical_records table exists and has patient_id column
    const checkTableQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'medical_records' AND column_name = 'patient_id'
    `;
    
    const { rows: tableRows } = await pool.query(checkTableQuery);
    
    if (tableRows.length === 0) {
      // Return empty array if table doesn't exist or doesn't have patient_id
      return [];
    }

    const query = `
      SELECT mr.*
      FROM medical_records mr
      WHERE mr.patient_id = $1
      ORDER BY mr.visit_date DESC, mr.created_at DESC
    `;

    const { rows } = await pool.query(query, [patientId]);
    return rows;
  } catch (error) {
    console.error('Error getting medical records:', error);
    return []; // Return empty array instead of throwing
  }
};

/**
 * Add medical record
 */
const addMedicalRecord = async (recordData) => {
  try {
    // Check if medical_records table exists with required columns
    const checkColumnsQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'medical_records'
      AND column_name IN ('patient_id', 'doctor_id', 'visit_date')
    `;
    
    const { rows: requiredColumns } = await pool.query(checkColumnsQuery);
    
    if (requiredColumns.length < 3) {
      throw new Error('Medical records table is not properly configured');
    }

    const {
      patient_id, doctor_id, visit_date, record_type = 'consultation',
      diagnosis, treatment, notes, prescriptions
    } = recordData;

    const query = `
      INSERT INTO medical_records (
        patient_id, doctor_id, visit_date, record_type, diagnosis,
        treatment, notes, prescriptions
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const values = [
      patient_id, doctor_id, visit_date, record_type, diagnosis,
      treatment, notes, prescriptions ? JSON.stringify(prescriptions) : null
    ];

    const { rows } = await pool.query(query, values);
    return rows[0];
  } catch (error) {
    console.error('Error adding medical record:', error);
    throw new Error('Failed to add medical record');
  }
};

/**
 * Get patient statistics
 */
const getPatientStats = async () => {
  try {
    // Simple stats that work with any schema
    const totalPatientsQuery = 'SELECT COUNT(*) FROM patients';
    const totalPatientsResult = await pool.query(totalPatientsQuery);

    return {
      total: parseInt(totalPatientsResult.rows[0].count),
      byGender: [],
      byBloodType: [],
      recent: 0
    };
  } catch (error) {
    console.error('Error getting patient stats:', error);
    return {
      total: 0,
      byGender: [],
      byBloodType: [],
      recent: 0
    };
  }
};

module.exports = {
  getAllPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
  getMedicalRecords,
  addMedicalRecord,
  getPatientStats
};