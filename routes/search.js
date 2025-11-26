const express = require('express');
const { body, query, param } = require('express-validator');
const { protect } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const handleValidationErrors = require('../middleware/validation');
const {
  advancedSearch,
  getSearchFilters,
  saveSearch,
  getSavedSearches,
  deleteSavedSearch,
  getSearchSuggestions
} = require('../models/search');

const router = express.Router();

// All routes protected
router.use(protect);

// @desc    Advanced search across all entities
// @route   POST /api/search/advanced
// @access  Private
router.post('/advanced', [
  body('query').optional().isString().trim().isLength({ max: 500 }),
  body('entityTypes').optional().isArray(),
  body('entityTypes.*').isIn(['doctors', 'appointments', 'prescriptions', 'medical_records']),
  body('filters').optional().isObject(),
  body('sortBy').optional().isIn(['relevance', 'date', 'name']),
  body('sortOrder').optional().isIn(['asc', 'desc']),
  body('page').optional().isInt({ min: 1 }),
  body('limit').optional().isInt({ min: 1, max: 100 })
], handleValidationErrors, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const searchParams = req.body;

  const startTime = Date.now();
  const searchResults = await advancedSearch(userId, searchParams);
  const searchTime = Date.now() - startTime;

  res.status(200).json({
    success: true,
    data: {
      ...searchResults,
      searchTime
    }
  });
}));

// @desc    Quick search with autocomplete
// @route   GET /api/search/quick
// @access  Private
router.get('/quick', [
  query('q').notEmpty().isString().trim().isLength({ min: 1, max: 100 }),
  query('type').optional().isIn(['doctors', 'appointments', 'prescriptions', 'medical_records', 'all'])
], handleValidationErrors, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { q: query, type = 'all' } = req.query;

  const searchParams = {
    query,
    entityTypes: type === 'all' 
      ? ['doctors', 'appointments', 'prescriptions', 'medical_records']
      : [type],
    limit: 5
  };

  const searchResults = await advancedSearch(userId, searchParams);

  res.status(200).json({
    success: true,
    data: searchResults
  });
}));

// @desc    Get available search filters for entity type
// @route   GET /api/search/filters/:entityType
// @access  Private
router.get('/filters/:entityType', [
  param('entityType').isIn(['doctors', 'appointments', 'prescriptions', 'medical_records'])
], handleValidationErrors, asyncHandler(async (req, res) => {
  const { entityType } = req.params;

  const filters = await getSearchFilters(entityType);

  res.status(200).json({
    success: true,
    data: filters
  });
}));

// @desc    Get search suggestions
// @route   GET /api/search/suggestions
// @access  Private
router.get('/suggestions', [
  query('q').notEmpty().isString().trim().isLength({ min: 1, max: 100 }),
  query('type').optional().isIn(['doctors', 'medications', 'general'])
], handleValidationErrors, asyncHandler(async (req, res) => {
  const { q: query, type = 'general' } = req.query;

  const suggestions = await getSearchSuggestions(query, type);

  res.status(200).json({
    success: true,
    data: suggestions
  });
}));

// @desc    Save search for user
// @route   POST /api/search/saved
// @access  Private
router.post('/saved', [
  body('name').notEmpty().isString().trim().isLength({ min: 1, max: 100 }),
  body('query').optional().isString().trim().isLength({ max: 500 }),
  body('entity_types').optional().isArray(),
  body('entity_types.*').isIn(['doctors', 'appointments', 'prescriptions', 'medical_records']),
  body('filters').optional().isObject(),
  body('is_global').optional().isBoolean()
], handleValidationErrors, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const searchData = req.body;

  const savedSearch = await saveSearch(userId, searchData);

  res.status(201).json({
    success: true,
    message: 'Search saved successfully',
    data: savedSearch
  });
}));

// @desc    Get user's saved searches
// @route   GET /api/search/saved
// @access  Private
router.get('/saved', asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const savedSearches = await getSavedSearches(userId);

  res.status(200).json({
    success: true,
    data: savedSearches
  });
}));

// @desc    Delete saved search
// @route   DELETE /api/search/saved/:id
// @access  Private
router.delete('/saved/:id', [
  param('id').isInt({ min: 1 })
], handleValidationErrors, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const searchId = req.params.id;

  const deletedSearch = await deleteSavedSearch(searchId, userId);

  if (!deletedSearch) {
    return res.status(404).json({
      success: false,
      error: 'Saved search not found or access denied'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Saved search deleted successfully',
    data: deletedSearch
  });
}));

// @desc    Get search analytics and popular searches
// @route   GET /api/search/analytics
// @access  Private
router.get('/analytics', asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Get popular searches (simplified - in production, you'd track this)
  const popularSearchesQuery = `
    SELECT query, COUNT(*) as search_count
    FROM search_history 
    WHERE user_id = $1 AND created_at >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY query 
    ORDER BY search_count DESC 
    LIMIT 10
  `;

  const { rows: popularSearches } = await pool.query(popularSearchesQuery, [userId]);

  // Get search statistics
  const statsQuery = `
    SELECT 
      COUNT(*) as total_searches,
      COUNT(DISTINCT query) as unique_searches,
      AVG(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 ELSE 0 END) as weekly_activity
    FROM search_history 
    WHERE user_id = $1
  `;

  const { rows: stats } = await pool.query(statsQuery, [userId]);

  res.status(200).json({
    success: true,
    data: {
      popularSearches,
      statistics: stats[0]
    }
  });
}));

// @desc    Clear search history
// @route   DELETE /api/search/history
// @access  Private
router.delete('/history', asyncHandler(async (req, res) => {
  const userId = req.user.id;

  await pool.query('DELETE FROM search_history WHERE user_id = $1', [userId]);

  res.status(200).json({
    success: true,
    message: 'Search history cleared successfully'
  });
}));

module.exports = router;