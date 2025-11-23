// const express = require('express');
// const router = express.Router();
// const auth = require('../middleware/auth');

// router.get('/', auth, async (req, res) => {
//   try {
//     const medicalRecords = []; // Replace with DB logic
//     res.json(medicalRecords);
//   } catch (err) {
//     console.error('Error fetching medical records:', err);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// module.exports = router;


// const express = require('express');
// const { body, param } = require('express-validator');
// const path = require('path');
// const fs = require('fs');

// const pool = require('../config/db');
// const { protect } = require('../middleware/auth');
// const asyncHandler = require('../middleware/asyncHandler');
// const handleValidationErrors = require('../middleware/validation');
// const { upload, handleUploadErrors } = require('../middleware/upload');

// const {
//   getUserMedicalRecords,
//   getMedicalRecordById,
//   createMedicalRecord,
//   deleteMedicalRecord,
//   getMedicalRecordsStats,
//   getRecordsByType,
//   userOwnsRecord
// } = require('../models/medicalRecords');

// const router = express.Router();

// // ✅ All routes require login
// router.use(protect);

// // ======================================================================
// // @desc    Get all medical records for a user
// // @route   GET /api/medical-records
// // ======================================================================
// router.get(
//   '/',
//   asyncHandler(async (req, res) => {
//     const userId = req.user.id;

//     const medicalRecords = await getUserMedicalRecords(userId);

//     res.status(200).json({
//       success: true,
//       count: medicalRecords.length,
//       data: medicalRecords
//     });
//   })
// );

// // ======================================================================
// // @desc    Get a medical record by ID
// // @route   GET /api/medical-records/:id
// // ======================================================================
// router.get(
//   '/:id',
//   [
//     param('id').isInt({ min: 1 }).withMessage('Valid medical record ID is required')
//   ],
//   handleValidationErrors,
//   asyncHandler(async (req, res) => {
//     const recordId = req.params.id;
//     const userId = req.user.id;

//     const medicalRecord = await getMedicalRecordById(recordId, userId);

//     if (!medicalRecord) {
//       return res.status(404).json({ success: false, error: 'Medical record not found' });
//     }

//     res.status(200).json({
//       success: true,
//       data: medicalRecord
//     });
//   })
// );

// // ======================================================================
// // @desc    Create/Upload a medical record
// // @route   POST /api/medical-records
// // ======================================================================
// router.post(
//   '/',
//   upload,
//   handleUploadErrors,
//   [
//     body('record_type')
//       .notEmpty()
//       .isIn([
//         'lab_report',
//         'x_ray',
//         'mri_scan',
//         'blood_test',
//         'prescription',
//         'doctor_notes',
//         'surgery_report',
//         'vaccination',
//         'allergy_test'
//       ])
//       .withMessage('Invalid record type'),

//     body('record_date').isDate().withMessage('Valid record date is required'),
//     body('description')
//       .notEmpty()
//       .isLength({ max: 1000 })
//       .withMessage('Description cannot exceed 1000 characters'),

//     body('doctor_name')
//       .optional()
//       .isLength({ max: 200 })
//       .withMessage('Doctor name cannot exceed 200 characters'),

//     body('hospital')
//       .optional()
//       .isLength({ max: 200 })
//       .withMessage('Hospital name cannot exceed 200 characters'),

//     body('notes')
//       .optional()
//       .isLength({ max: 500 })
//       .withMessage('Notes cannot exceed 500 characters')
//   ],
//   handleValidationErrors,
//   asyncHandler(async (req, res) => {
//     const userId = req.user.id;

//     const {
//       record_type,
//       record_date,
//       description,
//       doctor_name,
//       hospital,
//       notes
//     } = req.body;

//     const recordData = {
//       user_id: userId,
//       record_type,
//       record_date,
//       description,
//       doctor_name: doctor_name || null,
//       hospital: hospital || null,
//       notes: notes || null
//     };

//     if (req.file) {
//       recordData.file_url = `/uploads/medical-records/${req.file.filename}`;
//       recordData.file_size = req.file.size;
//       recordData.file_name = req.file.originalname;
//     }

//     const newRecord = await createMedicalRecord(recordData);

//     res.status(201).json({
//       success: true,
//       message: 'Medical record created successfully',
//       data: newRecord
//     });
//   })
// );

// // ======================================================================
// // @desc    Delete a medical record
// // @route   DELETE /api/medical-records/:id
// // ======================================================================
// router.delete(
//   '/:id',
//   [
//     param('id').isInt({ min: 1 }).withMessage('Valid medical record ID is required')
//   ],
//   handleValidationErrors,
//   asyncHandler(async (req, res) => {
//     const recordId = req.params.id;
//     const userId = req.user.id;

//     const deletedRecord = await deleteMedicalRecord(recordId, userId);

//     if (!deletedRecord) {
//       return res.status(404).json({
//         success: false,
//         error: 'Medical record not found'
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: 'Medical record deleted successfully',
//       data: deletedRecord
//     });
//   })
// );

// // ======================================================================
// // @desc    Get medical record statistics
// // @route   GET /api/medical-records/stats/overview
// // ======================================================================
// router.get(
//   '/stats/overview',
//   asyncHandler(async (req, res) => {
//     const userId = req.user.id;

//     const stats = await getMedicalRecordsStats(userId);

//     res.status(200).json({
//       success: true,
//       data: stats
//     });
//   })
// );

// // ======================================================================
// // @desc    Get medical records by type
// // @route   GET /api/medical-records/type/:type
// // ======================================================================
// router.get(
//   '/type/:type',
//   [
//     param('type').isIn([
//       'lab_report',
//       'x_ray',
//       'mri_scan',
//       'blood_test',
//       'prescription',
//       'doctor_notes',
//       'surgery_report',
//       'vaccination',
//       'allergy_test'
//     ])
//   ],
//   handleValidationErrors,
//   asyncHandler(async (req, res) => {
//     const userId = req.user.id;
//     const recordType = req.params.type;

//     const records = await getRecordsByType(userId, recordType);

//     res.status(200).json({
//       success: true,
//       count: records.length,
//       data: records
//     });
//   })
// );

// // ======================================================================
// // @desc    Download a medical record file
// // @route   GET /api/medical-records/:id/download
// // ======================================================================
// router.get(
//   '/:id/download',
//   [
//     param('id').isInt({ min: 1 }).withMessage('Valid medical record ID is required')
//   ],
//   handleValidationErrors,
//   asyncHandler(async (req, res) => {
//     const recordId = req.params.id;
//     const userId = req.user.id;

//     const ownsRecord = await userOwnsRecord(recordId, userId);
//     if (!ownsRecord) {
//       return res.status(404).json({ success: false, error: 'Medical record not found' });
//     }

//     const record = await getMedicalRecordById(recordId, userId);

//     if (!record || !record.file_url) {
//       return res.status(404).json({
//         success: false,
//         error: 'File not found for this medical record'
//       });
//     }

//     const filePath = path.join(__dirname, '..', record.file_url);

//     if (!fs.existsSync(filePath)) {
//       return res.status(404).json({
//         success: false,
//         error: 'File not found on server'
//       });
//     }

//     res.setHeader('Content-Disposition', `attachment; filename="${record.file_name}"`);
//     res.setHeader('Content-Type', 'application/octet-stream');

//     res.sendFile(filePath);
//   })
// );

// module.exports = router;


// const express = require('express');
// const { body, param } = require('express-validator');
// const path = require('path');
// const fs = require('fs');

// const pool = require('../config/db');
// const { protect } = require('../middleware/auth');
// const asyncHandler = require('../middleware/asyncHandler');
// const handleValidationErrors = require('../middleware/validation');
// const { upload, handleUploadErrors } = require('../middleware/upload');

// const {
//   getUserMedicalRecords,
//   getMedicalRecordById,
//   createMedicalRecord,
//   deleteMedicalRecord,
//   getMedicalRecordsStats,
//   getRecordsByType,
//   userOwnsRecord
// } = require('../models/medicalRecords');

// const router = express.Router();

// // Require login for all routes
// router.use(protect);

// /* =====================================================
//    GET ALL MEDICAL RECORDS
//    GET /api/medical-records
// ===================================================== */
// router.get(
//   '/',
//   asyncHandler(async (req, res) => {
//     const userId = req.user.id;
//     const records = await getUserMedicalRecords(userId);

//     res.status(200).json({
//       success: true,
//       count: records.length,
//       data: records
//     });
//   })
// );

// /* =====================================================
//    GET MEDICAL RECORD BY ID
//    GET /api/medical-records/:id
// ===================================================== */
// router.get(
//   '/:id',
//   param('id').isInt().withMessage('Valid medical record ID required'),
//   handleValidationErrors,
//   asyncHandler(async (req, res) => {
//     const { id } = req.params;
//     const userId = req.user.id;

//     const record = await getMedicalRecordById(id, userId);

//     if (!record) {
//       return res.status(404).json({ success: false, error: 'Record not found' });
//     }

//     res.json({ success: true, data: record });
//   })
// );

// /* =====================================================
//    CREATE MEDICAL RECORD
//    POST /api/medical-records
// ===================================================== */
// router.post(
//   '/',
//   upload,
//   handleUploadErrors,
//   [
//     body('record_type')
//       .notEmpty()
//       .isIn([
//         'lab_report',
//         'x_ray',
//         'mri_scan',
//         'blood_test',
//         'prescription',
//         'doctor_notes',
//         'surgery_report',
//         'vaccination',
//         'allergy_test'
//       ])
//       .withMessage('Invalid record type'),

//     body('record_date')
//       .isDate()
//       .withMessage('Valid record date required'),

//     body('description')
//       .notEmpty()
//       .isLength({ max: 1000 }),

//     body('doctor_name')
//       .optional()
//       .isLength({ max: 200 }),

//     body('hospital')
//       .optional()
//       .isLength({ max: 200 }),

//     body('notes')
//       .optional()
//       .isLength({ max: 500 })
//   ],
//   handleValidationErrors,

//   asyncHandler(async (req, res) => {
//     const userId = req.user.id;

//     const recordData = {
//       user_id: userId,
//       record_type: req.body.record_type,
//       record_date: req.body.record_date,
//       description: req.body.description,
//       doctor_name: req.body.doctor_name || null,
//       hospital: req.body.hospital || null,
//       notes: req.body.notes || null,
//       file_url: null,
//       file_size: null,
//       file_name: null
//     };

//     if (req.file) {
//       recordData.file_url = `/uploads/medical-records/${req.file.filename}`;
//       recordData.file_size = req.file.size;
//       recordData.file_name = req.file.originalname;
//     }

//     const newRecord = await createMedicalRecord(recordData);

//     res.status(201).json({
//       success: true,
//       message: 'Medical record created successfully',
//       data: newRecord
//     });
//   })
// );

// /* =====================================================
//    DELETE MEDICAL RECORD
//    DELETE /api/medical-records/:id
// ===================================================== */
// router.delete(
//   '/:id',
//   param('id').isInt().withMessage('Valid record ID required'),
//   handleValidationErrors,
//   asyncHandler(async (req, res) => {
//     const { id } = req.params;
//     const userId = req.user.id;

//     const deleted = await deleteMedicalRecord(id, userId);

//     if (!deleted) {
//       return res.status(404).json({ success: false, error: 'Record not found' });
//     }

//     res.json({
//       success: true,
//       message: 'Medical record deleted successfully',
//       data: deleted
//     });
//   })
// );

// /* =====================================================
//    GET STATISTICS
//    GET /api/medical-records/stats/overview
// ===================================================== */
// router.get(
//   '/stats/overview',
//   asyncHandler(async (req, res) => {
//     const userId = req.user.id;
//     const stats = await getMedicalRecordsStats(userId);

//     res.json({ success: true, data: stats });
//   })
// );

// /* =====================================================
//    GET RECORDS BY TYPE
//    GET /api/medical-records/type/:type
// ===================================================== */
// router.get(
//   '/type/:type',
//   param('type').isString(),
//   handleValidationErrors,
//   asyncHandler(async (req, res) => {
//     const userId = req.user.id;
//     const type = req.params.type;

//     const records = await getRecordsByType(userId, type);

//     res.json({
//       success: true,
//       count: records.length,
//       data: records
//     });
//   })
// );

// /* =====================================================
//    DOWNLOAD FILE
//    GET /api/medical-records/:id/download
// ===================================================== */
// router.get(
//   '/:id/download',
//   param('id').isInt(),
//   handleValidationErrors,
//   asyncHandler(async (req, res) => {
//     const { id } = req.params;
//     const userId = req.user.id;

//     const record = await getMedicalRecordById(id, userId);

//     if (!record || !record.file_url) {
//       return res.status(404).json({ success: false, error: 'File not found' });
//     }

//     const filePath = path.join(__dirname, '..', record.file_url);

//     if (!fs.existsSync(filePath)) {
//       return res.status(404).json({ success: false, error: 'File missing from server' });
//     }

//     res.setHeader('Content-Disposition', `attachment; filename="${record.file_name}"`);
//     res.setHeader('Content-Type', 'application/octet-stream');

//     res.sendFile(filePath);
//   })
// );

// module.exports = router;


const express = require('express');
const { body, param } = require('express-validator');
const path = require('path');
const fs = require('fs');

const pool = require('../config/db');
const { protect } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const handleValidationErrors = require('../middleware/validation');
const { upload, handleUploadErrors } = require('../middleware/upload');

const {
  getUserMedicalRecords,
  getMedicalRecordById,
  createMedicalRecord,
  deleteMedicalRecord,
  getMedicalRecordsStats,
  getRecordsByType,
  userOwnsRecord
} = require('../models/medicalRecords');

const router = express.Router();

// Require login for all routes
router.use(protect);

/* =====================================================
   GET ALL MEDICAL RECORDS
===================================================== */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const records = await getUserMedicalRecords(userId);

    res.status(200).json({
      success: true,
      count: records.length,
      data: records
    });
  })
);

/* =====================================================
   GET MEDICAL RECORD BY ID
===================================================== */
router.get(
  '/:id',
  param('id').isInt().withMessage('Valid medical record ID required'),
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const record = await getMedicalRecordById(id, userId);

    if (!record) {
      return res.status(404).json({ success: false, error: 'Record not found' });
    }

    res.json({ success: true, data: record });
  })
);

/* =====================================================
   CREATE MEDICAL RECORD (with `title` added)
===================================================== */
router.post(
  '/',
  upload,
  handleUploadErrors,
  [
    body('record_type')
      .notEmpty()
      .isIn([
        'lab_report',
        'x_ray',
        'mri_scan',
        'blood_test',
        'prescription',
        'doctor_notes',
        'surgery_report',
        'vaccination',
        'allergy_test'
      ])
      .withMessage('Invalid record type'),

    body('title')
      .optional()
      .isLength({ max: 200 })
      .withMessage('Title must be under 200 characters'),

    body('record_date')
      .isDate()
      .withMessage('Valid record date required'),

    body('description')
      .notEmpty()
      .isLength({ max: 1000 })
      .withMessage('Description required'),

    body('doctor_name').optional().isLength({ max: 200 }),
    body('hospital').optional().isLength({ max: 200 }),
    body('notes').optional().isLength({ max: 500 })
  ],
  handleValidationErrors,

  asyncHandler(async (req, res) => {
    const userId = req.user.id;

    // Destructure with title added
    const {
      record_type,
      title,
      record_date,
      description,
      doctor_name,
      hospital,
      notes
    } = req.body;

    const recordData = {
      user_id: userId,
      record_type,
      title: title || null,
      record_date,
      description,
      doctor_name: doctor_name || null,
      hospital: hospital || null,
      notes: notes || null,
      file_url: null,
      file_size: null,
      file_name: null
    };

    if (req.file) {
      recordData.file_url = `/uploads/medical-records/${req.file.filename}`;
      recordData.file_size = req.file.size;
      recordData.file_name = req.file.originalname;
    }

    const newRecord = await createMedicalRecord(recordData);

    res.status(201).json({
      success: true,
      message: 'Medical record created successfully',
      data: newRecord
    });
  })
);

/* =====================================================
   DELETE MEDICAL RECORD
===================================================== */
router.delete(
  '/:id',
  param('id').isInt().withMessage('Valid record ID required'),
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const deleted = await deleteMedicalRecord(id, userId);

    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Record not found' });
    }

    res.json({
      success: true,
      message: 'Medical record deleted successfully',
      data: deleted
    });
  })
);

/* =====================================================
   GET STATS
===================================================== */
router.get(
  '/stats/overview',
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const stats = await getMedicalRecordsStats(userId);

    res.json({ success: true, data: stats });
  })
);

/* =====================================================
   GET RECORDS BY TYPE
===================================================== */
router.get(
  '/type/:type',
  param('type').isString(),
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const type = req.params.type;

    const records = await getRecordsByType(userId, type);

    res.json({
      success: true,
      count: records.length,
      data: records
    });
  })
);

/* =====================================================
   DOWNLOAD FILE
===================================================== */
router.get(
  '/:id/download',
  param('id').isInt(),
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const record = await getMedicalRecordById(id, userId);

    if (!record || !record.file_url) {
      return res.status(404).json({ success: false, error: 'File not found' });
    }

    const filePath = path.join(__dirname, '..', record.file_url);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'File missing from server' });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${record.file_name}"`);
    res.setHeader('Content-Type', 'application/octet-stream');

    res.sendFile(filePath);
  })
);

module.exports = router;
