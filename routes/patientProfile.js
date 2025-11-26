const express = require('express');
const { body, query } = require('express-validator');
const { protect } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const handleValidationErrors = require('../middleware/validation');
const {
  getPatientProfile,
  updatePatientProfile,
  getHealthMetrics,
  addHealthMetric,
  getMetricsByType,
  deleteHealthMetric
} = require('../models/patientProfile');

const router = express.Router();

// All routes protected
router.use(protect);

// @desc    Get patient profile
// @route   GET /api/patient/profile
// @access  Private
router.get('/profile', asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const profile = await getPatientProfile(userId);

  res.status(200).json({
    success: true,
    data: profile
  });
}));

// @desc    Update patient profile
// @route   PUT /api/patient/profile
// @access  Private
router.put('/profile', [
  body('personal_info').optional().isObject(),
  body('medical_history').optional().isObject(),
  body('insurance_info').optional().isObject(),
  body('preferences').optional().isObject()
], handleValidationErrors, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const profileData = req.body;

  const updatedProfile = await updatePatientProfile(userId, profileData);

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: updatedProfile
  });
}));

// @desc    Get health metrics
// @route   GET /api/patient/health-metrics
// @access  Private
router.get('/health-metrics', [
  query('limit').optional().isInt({ min: 1, max: 100 })
], handleValidationErrors, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const limit = parseInt(req.query.limit) || 50;

  const metrics = await getHealthMetrics(userId, limit);

  res.status(200).json({
    success: true,
    count: metrics.length,
    data: metrics
  });
}));

// @desc    Add health metric
// @route   POST /api/patient/health-metrics
// @access  Private
router.post('/health-metrics', [
  body('metric_type').notEmpty().isString(),
  body('value').optional().isFloat(),
  body('systolic').optional().isInt(),
  body('diastolic').optional().isInt(),
  body('unit').optional().isString(),
  body('notes').optional().isString(),
  body('recorded_at').optional().isISO8601()
], handleValidationErrors, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const metricData = req.body;

  // Validate metric data based on type
  if (metricData.metric_type === 'blood_pressure') {
    if (!metricData.systolic || !metricData.diastolic) {
      return res.status(400).json({
        success: false,
        error: 'Systolic and diastolic values are required for blood pressure'
      });
    }
  } else {
    if (!metricData.value) {
      return res.status(400).json({
        success: false,
        error: 'Value is required for this metric type'
      });
    }
  }

  const newMetric = await addHealthMetric(userId, metricData);

  res.status(201).json({
    success: true,
    message: 'Health metric added successfully',
    data: newMetric
  });
}));

// @desc    Get metrics by type
// @route   GET /api/patient/health-metrics/:type
// @access  Private
router.get('/health-metrics/:type', [
  query('limit').optional().isInt({ min: 1, max: 50 })
], handleValidationErrors, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const metricType = req.params.type;
  const limit = parseInt(req.query.limit) || 10;

  const metrics = await getMetricsByType(userId, metricType, limit);

  res.status(200).json({
    success: true,
    count: metrics.length,
    data: metrics
  });
}));

// @desc    Delete health metric
// @route   DELETE /api/patient/health-metrics/:id
// @access  Private
router.delete('/health-metrics/:id', asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const metricId = req.params.id;

  const deletedMetric = await deleteHealthMetric(metricId, userId);

  if (!deletedMetric) {
    return res.status(404).json({
      success: false,
      error: 'Health metric not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Health metric deleted successfully',
    data: deletedMetric
  });
}));

module.exports = router;        