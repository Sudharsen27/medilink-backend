const pool = require('../config/db');

/**
 * Get patient profile by user ID
 */
const getPatientProfile = async (userId) => {
  const query = `
    SELECT 
      id,
      user_id,
      personal_info,
      medical_history,
      insurance_info,
      preferences,
      created_at,
      updated_at
    FROM patient_profiles 
    WHERE user_id = $1
  `;

  const { rows } = await pool.query(query, [userId]);
  
  if (rows.length === 0) {
    // Create default profile if doesn't exist
    return createDefaultProfile(userId);
  }
  
  return rows[0];
};

/**
 * Create default patient profile
 */
const createDefaultProfile = async (userId) => {
  const defaultProfile = {
    personal_info: {
      full_name: '',
      date_of_birth: null,
      gender: '',
      blood_type: '',
      height: null,
      weight: null,
      emergency_contact: null
    },
    medical_history: {
      conditions: [],
      allergies: [],
      medications: [],
      surgeries: []
    },
    insurance_info: {
      provider: '',
      policy_number: '',
      group_number: ''
    },
    preferences: {
      language: 'en',
      notifications: true,
      theme: 'system'
    }
  };

  const query = `
    INSERT INTO patient_profiles (user_id, personal_info, medical_history, insurance_info, preferences)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;

  const values = [
    userId,
    JSON.stringify(defaultProfile.personal_info),
    JSON.stringify(defaultProfile.medical_history),
    JSON.stringify(defaultProfile.insurance_info),
    JSON.stringify(defaultProfile.preferences)
  ];

  const { rows } = await pool.query(query, values);
  return rows[0];
};

/**
 * Update patient profile
 */
const updatePatientProfile = async (userId, profileData) => {
  const { personal_info, medical_history, insurance_info, preferences } = profileData;

  const query = `
    UPDATE patient_profiles 
    SET 
      personal_info = COALESCE($2, personal_info),
      medical_history = COALESCE($3, medical_history),
      insurance_info = COALESCE($4, insurance_info),
      preferences = COALESCE($5, preferences),
      updated_at = CURRENT_TIMESTAMP
    WHERE user_id = $1
    RETURNING *
  `;

  const values = [
    userId,
    personal_info ? JSON.stringify(personal_info) : null,
    medical_history ? JSON.stringify(medical_history) : null,
    insurance_info ? JSON.stringify(insurance_info) : null,
    preferences ? JSON.stringify(preferences) : null
  ];

  const { rows } = await pool.query(query, values);
  
  if (rows.length === 0) {
    throw new Error('Profile not found');
  }
  
  return rows[0];
};

/**
 * Get health metrics for patient
 */
const getHealthMetrics = async (userId, limit = 50) => {
  const query = `
    SELECT 
      id,
      user_id,
      metric_type,
      value,
      systolic,
      diastolic,
      unit,
      notes,
      recorded_at,
      created_at
    FROM health_metrics 
    WHERE user_id = $1
    ORDER BY recorded_at DESC, created_at DESC
    LIMIT $2
  `;

  const { rows } = await pool.query(query, [userId, limit]);
  return rows;
};

/**
 * Add health metric
 */
const addHealthMetric = async (userId, metricData) => {
  const { metric_type, value, systolic, diastolic, unit, notes, recorded_at } = metricData;

  const query = `
    INSERT INTO health_metrics (user_id, metric_type, value, systolic, diastolic, unit, notes, recorded_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `;

  const values = [
    userId,
    metric_type,
    value || null,
    systolic || null,
    diastolic || null,
    unit || null,
    notes || null,
    recorded_at || new Date().toISOString()
  ];

  const { rows } = await pool.query(query, values);
  return rows[0];
};

/**
 * Get health metrics by type
 */
const getMetricsByType = async (userId, metricType, limit = 10) => {
  const query = `
    SELECT *
    FROM health_metrics 
    WHERE user_id = $1 AND metric_type = $2
    ORDER BY recorded_at DESC
    LIMIT $3
  `;

  const { rows } = await pool.query(query, [userId, metricType, limit]);
  return rows;
};

/**
 * Delete health metric
 */
const deleteHealthMetric = async (metricId, userId) => {
  const query = `
    DELETE FROM health_metrics 
    WHERE id = $1 AND user_id = $2
    RETURNING *
  `;

  const { rows } = await pool.query(query, [metricId, userId]);
  return rows[0];
};

module.exports = {
  getPatientProfile,
  updatePatientProfile,
  getHealthMetrics,
  addHealthMetric,
  getMetricsByType,
  deleteHealthMetric
};