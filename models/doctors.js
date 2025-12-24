
// // models/doctors.js
// const pool = require('../config/db'); // PostgreSQL connection

// /**
//  * Fetch all doctors with their user details
//  */
// const getAllDoctors = async () => {
//   try {
//     const query = `
//       SELECT d.id,
//              u.name,
//              u.email,
//              d.specialization,
//              d.experience,
//              d.rating,
//              d.bio,
//              d.clinic_address
//       FROM doctors d
//       JOIN users u ON d.user_id = u.id
//     `;
//     const { rows } = await pool.query(query);
//     return rows;
//   } catch (err) {
//     console.error('Error fetching doctors:', err.message);
//     throw err; // rethrow so routes can handle it
//   }
// };

// module.exports = { getAllDoctors };

// // models/doctors.js
// const pool = require('../config/db'); // PostgreSQL connection

// /**
//  * Fetch all doctors with their user details and favorite status
//  * @param {number|null} userId - Optional user ID to include favorite status
//  * @returns {Promise<Array>} List of doctors
//  */
// const getAllDoctors = async (userId = null) => {
//   try {
//     let query;
//     let params = [];

//     if (userId) {
//       // Include favorite status for logged-in user
//       query = `
//         SELECT 
//           d.id,
//           u.name,
//           u.email,
//           d.specialization,
//           d.experience,
//           d.rating,
//           d.bio,
//           d.clinic_address,
//           CASE WHEN f.id IS NOT NULL THEN true ELSE false END AS is_favorite
//         FROM doctors d
//         JOIN users u ON d.user_id = u.id
//         LEFT JOIN favorites f ON d.id = f.doctor_id AND f.user_id = $1
//       `;
//       params = [userId];
//     } else {
//       // For non-logged-in users or when no userId provided
//       query = `
//         SELECT 
//           d.id,
//           u.name,
//           u.email,
//           d.specialization,
//           d.experience,
//           d.rating,
//           d.bio,
//           d.clinic_address,
//           false AS is_favorite
//         FROM doctors d
//         JOIN users u ON d.user_id = u.id
//       `;
//     }

//     const { rows } = await pool.query(query, params);
//     return rows;
//   } catch (err) {
//     console.error('❌ Error fetching doctors:', err.message);
//     throw err; // Rethrow so routes can handle it
//   }
// };

// /**
//  * Fetch a specific doctor by ID with favorite status
//  * @param {number} doctorId - Doctor ID
//  * @param {number|null} userId - Optional user ID to include favorite status
//  * @returns {Promise<Object>} Doctor details
//  */
// const getDoctorById = async (doctorId, userId = null) => {
//   try {
//     let query;
//     let params = [doctorId];

//     if (userId) {
//       query = `
//         SELECT 
//           d.id,
//           u.name,
//           u.email,
//           d.specialization,
//           d.experience,
//           d.rating,
//           d.bio,
//           d.clinic_address,
//           CASE WHEN f.id IS NOT NULL THEN true ELSE false END AS is_favorite
//         FROM doctors d
//         JOIN users u ON d.user_id = u.id
//         LEFT JOIN favorites f ON d.id = f.doctor_id AND f.user_id = $2
//         WHERE d.id = $1
//       `;
//       params = [doctorId, userId];
//     } else {
//       query = `
//         SELECT 
//           d.id,
//           u.name,
//           u.email,
//           d.specialization,
//           d.experience,
//           d.rating,
//           d.bio,
//           d.clinic_address,
//           false AS is_favorite
//         FROM doctors d
//         JOIN users u ON d.user_id = u.id
//         WHERE d.id = $1
//       `;
//     }

//     const { rows } = await pool.query(query, params);
//     return rows[0];
//   } catch (err) {
//     console.error('❌ Error fetching doctor by ID:', err.message);
//     throw err;
//   }
// };

// module.exports = { 
//   getAllDoctors, 
//   getDoctorById 
// };


const pool = require("../config/db");

/**
 * Fetch all doctors
 * Works even if user_id is NULL
 */
const getAllDoctors = async (userId = null) => {
  try {
    let query;
    let params = [];

    if (userId) {
      query = `
        SELECT
          d.id,
          COALESCE(u.name, 'Doctor') AS name,
          d.specialization,
          d.experience,
          d.rating,
          d.bio,
          d.clinic_address,
          CASE WHEN f.id IS NOT NULL THEN true ELSE false END AS is_favorite
        FROM doctors d
        LEFT JOIN users u ON d.user_id = u.id
        LEFT JOIN favorites f 
          ON d.id = f.doctor_id AND f.user_id = $1
        ORDER BY d.id ASC
      `;
      params = [userId];
    } else {
      query = `
        SELECT
          d.id,
          COALESCE(u.name, 'Doctor') AS name,
          d.specialization,
          d.experience,
          d.rating,
          d.bio,
          d.clinic_address,
          false AS is_favorite
        FROM doctors d
        LEFT JOIN users u ON d.user_id = u.id
        ORDER BY d.id ASC
      `;
    }

    const { rows } = await pool.query(query, params);
    return rows; // ✅ always array
  } catch (err) {
    console.error("❌ Error fetching doctors:", err.message);
    throw err;
  }
};

const getDoctorById = async (doctorId, userId = null) => {
  try {
    let query;
    let params = [doctorId];

    if (userId) {
      query = `
        SELECT
          d.id,
          COALESCE(u.name, 'Doctor') AS name,
          d.specialization,
          d.experience,
          d.rating,
          d.bio,
          d.clinic_address,
          CASE WHEN f.id IS NOT NULL THEN true ELSE false END AS is_favorite
        FROM doctors d
        LEFT JOIN users u ON d.user_id = u.id
        LEFT JOIN favorites f 
          ON d.id = f.doctor_id AND f.user_id = $2
        WHERE d.id = $1
      `;
      params = [doctorId, userId];
    } else {
      query = `
        SELECT
          d.id,
          COALESCE(u.name, 'Doctor') AS name,
          d.specialization,
          d.experience,
          d.rating,
          d.bio,
          d.clinic_address,
          false AS is_favorite
        FROM doctors d
        LEFT JOIN users u ON d.user_id = u.id
        WHERE d.id = $1
      `;
    }

    const { rows } = await pool.query(query, params);
    return rows[0];
  } catch (err) {
    console.error("❌ Error fetching doctor:", err.message);
    throw err;
  }
};

module.exports = {
  getAllDoctors,
  getDoctorById,
};
