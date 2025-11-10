// models/favorites.js
const pool = require('../config/db');

/**
 * Add a doctor to user's favorites
 */
const addFavorite = async (userId, doctorId) => {
  try {
    const query = `
      INSERT INTO favorites (user_id, doctor_id)
      VALUES ($1, $2)
      RETURNING *
    `;
    const { rows } = await pool.query(query, [userId, doctorId]);
    return rows[0];
  } catch (err) {
    // Handle unique constraint violation (already favorited)
    if (err.code === '23505') {
      throw new Error('Doctor is already in favorites');
    }
    console.error('Error adding favorite:', err.message);
    throw err;
  }
};

/**
 * Remove a doctor from user's favorites
 */
const removeFavorite = async (userId, doctorId) => {
  try {
    const query = `
      DELETE FROM favorites 
      WHERE user_id = $1 AND doctor_id = $2
      RETURNING *
    `;
    const { rows } = await pool.query(query, [userId, doctorId]);
    return rows[0];
  } catch (err) {
    console.error('Error removing favorite:', err.message);
    throw err;
  }
};

/**
 * Check if a doctor is in user's favorites
 */
const isFavorite = async (userId, doctorId) => {
  try {
    const query = `
      SELECT id FROM favorites 
      WHERE user_id = $1 AND doctor_id = $2
    `;
    const { rows } = await pool.query(query, [userId, doctorId]);
    return rows.length > 0;
  } catch (err) {
    console.error('Error checking favorite:', err.message);
    throw err;
  }
};

/**
 * Get all favorites for a user with doctor details
 */
const getUserFavorites = async (userId) => {
  try {
    const query = `
      SELECT 
        f.id as favorite_id,
        f.created_at as favorited_at,
        d.id as doctor_id,
        u.name as doctor_name,
        d.specialization,
        d.experience,
        d.rating,
        d.bio,
        d.clinic_address,
        u.email as doctor_email
      FROM favorites f
      JOIN doctors d ON f.doctor_id = d.id
      JOIN users u ON d.user_id = u.id
      WHERE f.user_id = $1
      ORDER BY f.created_at DESC
    `;
    const { rows } = await pool.query(query, [userId]);
    return rows;
  } catch (err) {
    console.error('Error fetching user favorites:', err.message);
    throw err;
  }
};

/**
 * Get favorite count for a user
 */
const getFavoriteCount = async (userId) => {
  try {
    const query = `
      SELECT COUNT(*) as count 
      FROM favorites 
      WHERE user_id = $1
    `;
    const { rows } = await pool.query(query, [userId]);
    return parseInt(rows[0].count);
  } catch (err) {
    console.error('Error getting favorite count:', err.message);
    throw err;
  }
};

module.exports = {
  addFavorite,
  removeFavorite,
  isFavorite,
  getUserFavorites,
  getFavoriteCount
};