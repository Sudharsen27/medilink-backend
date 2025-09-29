
// models/doctors.js
const pool = require('../config/db'); // PostgreSQL connection

/**
 * Fetch all doctors with their user details
 */
const getAllDoctors = async () => {
  try {
    const query = `
      SELECT d.id,
             u.name,
             u.email,
             d.specialization,
             d.experience,
             d.rating,
             d.bio,
             d.clinic_address
      FROM doctors d
      JOIN users u ON d.user_id = u.id
    `;
    const { rows } = await pool.query(query);
    return rows;
  } catch (err) {
    console.error('Error fetching doctors:', err.message);
    throw err; // rethrow so routes can handle it
  }
};

module.exports = { getAllDoctors };
