const pool = require('../config/db');

/**
 * Record search in history
 */
const recordSearch = async (userId, searchData) => {
  const { query, entity_types, filters, result_count } = searchData;

  const queryText = `
    INSERT INTO search_history (user_id, query, entity_types, filters, result_count)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;

  const values = [
    userId,
    query,
    JSON.stringify(entity_types),
    JSON.stringify(filters),
    result_count
  ];

  const { rows } = await pool.query(queryText, values);
  return rows[0];
};

/**
 * Get user's search history
 */
const getSearchHistory = async (userId, limit = 20) => {
  const queryText = `
    SELECT * FROM search_history 
    WHERE user_id = $1 
    ORDER BY created_at DESC 
    LIMIT $2
  `;

  const { rows } = await pool.query(queryText, [userId, limit]);
  
  return rows.map(row => ({
    ...row,
    entity_types: JSON.parse(row.entity_types),
    filters: JSON.parse(row.filters)
  }));
};

/**
 * Delete search history item
 */
const deleteSearchHistoryItem = async (historyId, userId) => {
  const queryText = `
    DELETE FROM search_history 
    WHERE id = $1 AND user_id = $2 
    RETURNING *
  `;

  const { rows } = await pool.query(queryText, [historyId, userId]);
  return rows[0];
};

module.exports = {
  recordSearch,
  getSearchHistory,
  deleteSearchHistoryItem
};