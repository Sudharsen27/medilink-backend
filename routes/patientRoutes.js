// const express = require('express');
// const { body, param, query } = require('express-validator');

// const { protect } = require('../middleware/auth');
// const asyncHandler = require('../middleware/asyncHandler');
// const handleValidationErrors = require('../middleware/validation');

// const {
//   getAllPatients,
//   getPatientById,
//   createPatient,
//   updatePatient,
//   deletePatient,
//   getMedicalRecords,
//   addMedicalRecord,
//   getPatientStats
// } = require('../models/patientModel');

// const router = express.Router();

// // Protect all patient routes
// router.use(protect);

// /* ============================================================
//    Get All Patients
//    GET /api/patients
// ============================================================ */
// router.get('/', [
//   query('search').optional().isString().trim(),
//   query('page').optional().isInt({ min: 1 }),
//   query('limit').optional().isInt({ min: 1, max: 200 })
// ], handleValidationErrors, asyncHandler(async (req, res) => {
//   const { search, page, limit } = req.query;
  
//   const result = await getAllPatients({
//     search,
//     page: parseInt(page) || 1,
//     limit: parseInt(limit) || 50
//   });

//   res.status(200).json({
//     success: true,
//     data: result.patients,
//     pagination: {
//       total: result.totalCount,
//       pages: result.totalPages,
//       current: result.currentPage,
//       hasNext: result.currentPage < result.totalPages,
//       hasPrev: result.currentPage > 1
//     }
//   });
// }));

// /* ============================================================
//    Get Patient by ID
//    GET /api/patients/:id
// ============================================================ */
// router.get('/:id', [
//   param('id').isInt({ min: 1 })
// ], handleValidationErrors, asyncHandler(async (req, res) => {
//   const patientId = parseInt(req.params.id);
  
//   const patient = await getPatientById(patientId);

//   res.status(200).json({
//     success: true,
//     data: patient
//   });
// }));

// /* ============================================================
//    Create New Patient
//    POST /api/patients
// ============================================================ */
// router.post('/', [
//   body('name').isString().trim().notEmpty().withMessage('Name is required'),
//   body('email').optional().isEmail().normalizeEmail(),
//   body('phone').optional().isString().trim(),
//   body('date_of_birth').optional().isDate(),
//   body('gender').optional().isIn(['Male', 'Female', 'Other']),
//   body('blood_type').optional().isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
//   body('allergies').optional().isString().trim(),
//   body('medical_conditions').optional().isString().trim(),
//   body('emergency_contact_name').optional().isString().trim(),
//   body('emergency_contact_phone').optional().isString().trim()
// ], handleValidationErrors, asyncHandler(async (req, res) => {
//   const patientData = req.body;
  
//   const newPatient = await createPatient(patientData);

//   res.status(201).json({
//     success: true,
//     message: 'Patient created successfully',
//     data: newPatient
//   });
// }));

// /* ============================================================
//    Update Patient
//    PUT /api/patients/:id
// ============================================================ */
// router.put('/:id', [
//   param('id').isInt({ min: 1 }),
//   body('name').optional().isString().trim().notEmpty(),
//   body('email').optional().isEmail().normalizeEmail(),
//   body('phone').optional().isString().trim(),
//   body('date_of_birth').optional().isDate(),
//   body('gender').optional().isIn(['Male', 'Female', 'Other']),
//   body('blood_type').optional().isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
//   body('allergies').optional().isString().trim(),
//   body('medical_conditions').optional().isString().trim(),
//   body('emergency_contact_name').optional().isString().trim(),
//   body('emergency_contact_phone').optional().isString().trim()
// ], handleValidationErrors, asyncHandler(async (req, res) => {
//   const patientId = parseInt(req.params.id);
//   const patientData = req.body;
  
//   const updatedPatient = await updatePatient(patientId, patientData);

//   res.status(200).json({
//     success: true,
//     message: 'Patient updated successfully',
//     data: updatedPatient
//   });
// }));

// /* ============================================================
//    Delete Patient
//    DELETE /api/patients/:id
// ============================================================ */
// router.delete('/:id', [
//   param('id').isInt({ min: 1 })
// ], handleValidationErrors, asyncHandler(async (req, res) => {
//   const patientId = parseInt(req.params.id);
  
//   const deletedPatient = await deletePatient(patientId);

//   res.status(200).json({
//     success: true,
//     message: 'Patient deleted successfully',
//     data: deletedPatient
//   });
// }));

// /* ============================================================
//    Get Patient Medical Records
//    GET /api/patients/:id/medical-history
// ============================================================ */
// router.get('/:id/medical-history', [
//   param('id').isInt({ min: 1 })
// ], handleValidationErrors, asyncHandler(async (req, res) => {
//   const patientId = parseInt(req.params.id);
  
//   const medicalRecords = await getMedicalRecords(patientId);

//   res.status(200).json({
//     success: true,
//     data: medicalRecords
//   });
// }));

// /* ============================================================
//    Add Medical Record
//    POST /api/patients/:id/medical-history
// ============================================================ */
// router.post('/:id/medical-history', [
//   param('id').isInt({ min: 1 }),
//   body('visit_date').isDate(),
//   body('record_type').optional().isIn(['consultation', 'followup', 'emergency', 'checkup']),
//   body('diagnosis').optional().isString().trim(),
//   body('treatment').optional().isString().trim(),
//   body('notes').optional().isString().trim(),
//   body('prescriptions').optional().isArray()
// ], handleValidationErrors, asyncHandler(async (req, res) => {
//   const patientId = parseInt(req.params.id);
//   const doctorId = req.user.id;
  
//   const recordData = {
//     patient_id: patientId,
//     doctor_id: doctorId,
//     ...req.body
//   };

//   const newRecord = await addMedicalRecord(recordData);

//   res.status(201).json({
//     success: true,
//     message: 'Medical record added successfully',
//     data: newRecord
//   });
// }));

// /* ============================================================
//    Get Patient Statistics
//    GET /api/patients/stats/overview
// ============================================================ */
// router.get('/stats/overview', asyncHandler(async (req, res) => {
//   const stats = await getPatientStats();

//   res.status(200).json({
//     success: true,
//     data: stats
//   });
// }));

// /* ============================================================
//    Search Patients
//    GET /api/patients/search/:query
// ============================================================ */
// router.get('/search/:query', [
//   param('query').isString().trim().notEmpty()
// ], handleValidationErrors, asyncHandler(async (req, res) => {
//   const searchQuery = req.params.query;
  
//   const result = await getAllPatients({ search: searchQuery, limit: 20 });

//   res.status(200).json({
//     success: true,
//     data: result.patients,
//     count: result.patients.length
//   });
// }));

// module.exports = router;

// const express = require('express');
// const { body, param, query } = require('express-validator');

// const { protect } = require('../middleware/auth');
// const asyncHandler = require('../middleware/asyncHandler');
// const handleValidationErrors = require('../middleware/validation');

// const {
//   getAllPatients,
//   getPatientById,
//   createPatient,
//   updatePatient,
//   deletePatient,
//   getMedicalRecords,
//   addMedicalRecord,
//   getPatientStats
// } = require('../models/patientModel');

// const router = express.Router();

// // Protect all patient routes
// router.use(protect);

// /* ============================================================
//    Get All Patients
//    GET /api/patients
// ============================================================ */
// router.get('/', [
//   query('search').optional().isString().trim(),
//   query('page').optional().isInt({ min: 1 }),
//   query('limit').optional().isInt({ min: 1, max: 200 })
// ], handleValidationErrors, asyncHandler(async (req, res) => {
//   const { search, page, limit } = req.query;
  
//   const result = await getAllPatients({
//     search,
//     page: parseInt(page) || 1,
//     limit: parseInt(limit) || 50
//   });

//   res.status(200).json({
//     success: true,
//     data: result.patients,
//     pagination: {
//       total: result.totalCount,
//       pages: result.totalPages,
//       current: result.currentPage,
//       hasNext: result.currentPage < result.totalPages,
//       hasPrev: result.currentPage > 1
//     }
//   });
// }));

// /* ============================================================
//    Get Patient by ID
//    GET /api/patients/:id
// ============================================================ */
// router.get('/:id', [
//   param('id').isInt({ min: 1 })
// ], handleValidationErrors, asyncHandler(async (req, res) => {
//   const patientId = parseInt(req.params.id);
  
//   const patient = await getPatientById(patientId);

//   res.status(200).json({
//     success: true,
//     data: patient
//   });
// }));

// /* ============================================================
//    Create New Patient
//    POST /api/patients
// ============================================================ */
// router.post('/', [
//   body('name').isString().trim().notEmpty().withMessage('Name is required'),
//   body('email').optional().isEmail().normalizeEmail(),
//   body('phone').optional().isString().trim(),
//   body('date_of_birth').optional().isDate(),
//   body('gender').optional().isIn(['Male', 'Female', 'Other']),
//   body('blood_type').optional().isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
//   body('allergies').optional().isString().trim(),
//   body('medical_conditions').optional().isString().trim(),
//   body('emergency_contact_name').optional().isString().trim(),
//   body('emergency_contact_phone').optional().isString().trim()
// ], handleValidationErrors, asyncHandler(async (req, res) => {
//   const patientData = req.body;
  
//   const newPatient = await createPatient(patientData);

//   res.status(201).json({
//     success: true,
//     message: 'Patient created successfully',
//     data: newPatient
//   });
// }));

// /* ============================================================
//    Update Patient
//    PUT /api/patients/:id
// ============================================================ */
// router.put('/:id', [
//   param('id').isInt({ min: 1 }),
//   body('name').optional().isString().trim().notEmpty(),
//   body('email').optional().isEmail().normalizeEmail(),
//   body('phone').optional().isString().trim(),
//   body('date_of_birth').optional().isDate(),
//   body('gender').optional().isIn(['Male', 'Female', 'Other']),
//   body('blood_type').optional().isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
//   body('allergies').optional().isString().trim(),
//   body('medical_conditions').optional().isString().trim(),
//   body('emergency_contact_name').optional().isString().trim(),
//   body('emergency_contact_phone').optional().isString().trim()
// ], handleValidationErrors, asyncHandler(async (req, res) => {
//   const patientId = parseInt(req.params.id);
//   const patientData = req.body;
  
//   const updatedPatient = await updatePatient(patientId, patientData);

//   res.status(200).json({
//     success: true,
//     message: 'Patient updated successfully',
//     data: updatedPatient
//   });
// }));

// /* ============================================================
//    Delete Patient
//    DELETE /api/patients/:id
// ============================================================ */
// router.delete('/:id', [
//   param('id').isInt({ min: 1 })
// ], handleValidationErrors, asyncHandler(async (req, res) => {
//   const patientId = parseInt(req.params.id);
  
//   const deletedPatient = await deletePatient(patientId);

//   res.status(200).json({
//     success: true,
//     message: 'Patient deleted successfully',
//     data: deletedPatient
//   });
// }));

// /* ============================================================
//    Get Patient Medical Records - FIXED ROUTE
//    GET /api/patients/:id/medical-history
// ============================================================ */
// router.get('/:id/medical-history', [
//   param('id').isInt({ min: 1 })
// ], handleValidationErrors, asyncHandler(async (req, res) => {
//   const patientId = parseInt(req.params.id);
  
//   try {
//     const medicalRecords = await getMedicalRecords(patientId);
    
//     res.status(200).json({
//       success: true,
//       data: medicalRecords
//     });
//   } catch (error) {
//     console.error('Error in medical history route:', error);
//     res.status(200).json({
//       success: true,
//       data: [] // Return empty array instead of error
//     });
//   }
// }));

// /* ============================================================
//    Add Medical Record - FIXED ROUTE
//    POST /api/patients/:id/medical-history
// ============================================================ */
// // router.post('/:id/medical-history', [
// //   param('id').isInt({ min: 1 }),
// //   body('visit_date').optional().isDate(), // Made optional for now
// //   body('record_type').optional().isIn(['consultation', 'followup', 'emergency', 'checkup']),
// //   body('diagnosis').optional().isString().trim(),
// //   body('treatment').optional().isString().trim(),
// //   body('notes').optional().isString().trim(),
// //   body('prescriptions').optional().isArray()
// // ], handleValidationErrors, asyncHandler(async (req, res) => {
// //   const patientId = parseInt(req.params.id);
// //   const doctorId = req.user.id;
  
// //   try {
// //     const recordData = {
// //       patient_id: patientId,
// //       doctor_id: doctorId,
// //       visit_date: req.body.visit_date || new Date().toISOString().split('T')[0],
// //       record_type: req.body.record_type || 'consultation',
// //       ...req.body
// //     };

// //     const newRecord = await addMedicalRecord(recordData);

// //     res.status(201).json({
// //       success: true,
// //       message: 'Medical record added successfully',
// //       data: newRecord
// //     });
// //   } catch (error) {
// //     console.error('Error adding medical record:', error);
// //     res.status(500).json({
// //       success: false,
// //       message: error.message || 'Failed to add medical record'
// //     });
// //   }
// // }));
// /* ============================================================
//    Add Medical Record - SIMPLIFIED VALIDATION
//    POST /api/patients/:id/medical-history
// ============================================================ */
// router.post('/:id/medical-history', [
//   param('id').isInt({ min: 1 }),
//   // Remove strict validation for now
//   body('visit_date').optional().isDate(),
//   body('record_type').optional().isString(),
//   body('diagnosis').optional().isString(),
//   body('treatment').optional().isString(),
//   body('notes').optional().isString(),
//   body('prescriptions').optional().isArray()
// ], handleValidationErrors, asyncHandler(async (req, res) => {
//   const patientId = parseInt(req.params.id);
//   const doctorId = req.user.id;
  
//   console.log('Received medical record data:', req.body);
  
//   try {
//     const recordData = {
//       patient_id: patientId,
//       doctor_id: doctorId,
//       visit_date: req.body.visit_date || new Date().toISOString().split('T')[0],
//       record_type: req.body.record_type || 'consultation',
//       diagnosis: req.body.diagnosis || '',
//       treatment: req.body.treatment || '',
//       notes: req.body.notes || '',
//       prescriptions: req.body.prescriptions || []
//     };

//     console.log('Processed record data:', recordData);

//     const newRecord = await addMedicalRecord(recordData);

//     res.status(201).json({
//       success: true,
//       message: 'Medical record added successfully',
//       data: newRecord
//     });
//   } catch (error) {
//     console.error('Error adding medical record:', error);
//     res.status(500).json({
//       success: false,
//       message: error.message || 'Failed to add medical record'
//     });
//   }
// }));

// /* ============================================================
//    Get Patient Statistics
//    GET /api/patients/stats/overview
// ============================================================ */
// router.get('/stats/overview', asyncHandler(async (req, res) => {
//   try {
//     const stats = await getPatientStats();

//     res.status(200).json({
//       success: true,
//       data: stats
//     });
//   } catch (error) {
//     console.error('Error getting patient stats:', error);
//     res.status(200).json({
//       success: true,
//       data: {
//         total: 0,
//         byGender: [],
//         byBloodType: [],
//         recent: 0
//       }
//     });
//   }
// }));

// /* ============================================================
//    Search Patients
//    GET /api/patients/search/:query
// ============================================================ */
// router.get('/search/:query', [
//   param('query').isString().trim().notEmpty()
// ], handleValidationErrors, asyncHandler(async (req, res) => {
//   const searchQuery = req.params.query;
  
//   const result = await getAllPatients({ search: searchQuery, limit: 20 });

//   res.status(200).json({
//     success: true,
//     data: result.patients,
//     count: result.patients.length
//   });
// }));

// // Add a simple health check route for testing
// router.get('/health/test', asyncHandler(async (req, res) => {
//   res.status(200).json({
//     success: true,
//     message: 'Patient routes are working!',
//     timestamp: new Date().toISOString()
//   });
// }));

// module.exports = router;

// const express = require("express");
// const { body, param, query } = require("express-validator");

// const { protect } = require("../middleware/auth");
// const asyncHandler = require("../middleware/asyncHandler");
// const handleValidationErrors = require("../middleware/validation");

// const {
//   getAllPatients,
//   getPatientById,
//   createPatient,
//   updatePatient,
//   deletePatient,
//   getMedicalRecords,
//   addMedicalRecord,
//   getPatientStats
// } = require("../models/patientModel");

// const router = express.Router();

// /* ============================================================
//    Protect All Routes
// ============================================================ */
// router.use(protect);

// /* ============================================================
//    GET: Patient Stats
//    /api/patients/stats/overview
// ============================================================ */
// router.get(
//   "/stats/overview",
//   asyncHandler(async (req, res) => {
//     try {
//       const stats = await getPatientStats();
//       res.status(200).json({ success: true, data: stats });
//     } catch (error) {
//       console.error("❌ Error getting stats:", error);
//       res.status(200).json({
//         success: true,
//         data: { total: 0, byGender: [], byBloodType: [], recent: 0 }
//       });
//     }
//   })
// );

// /* ============================================================
//    SEARCH: /api/patients/search/:query
// ============================================================ */
// router.get(
//   "/search/:query",
//   [param("query").isString().trim().notEmpty()],
//   handleValidationErrors,
//   asyncHandler(async (req, res) => {
//     const searchTerm = req.params.query;
//     const result = await getAllPatients({ search: searchTerm, limit: 20 });

//     res.status(200).json({
//       success: true,
//       data: result.patients,
//       count: result.patients.length
//     });
//   })
// );

// /* ============================================================
//    GET ALL PATIENTS (with pagination)
//    GET /api/patients
// ============================================================ */
// router.get(
//   "/",
//   [
//     query("search").optional().isString().trim(),
//     query("page").optional().isInt({ min: 1 }),
//     query("limit").optional().isInt({ min: 1, max: 200 })
//   ],
//   handleValidationErrors,
//   asyncHandler(async (req, res) => {
//     const { search, page, limit } = req.query;

//     const result = await getAllPatients({
//       search,
//       page: parseInt(page) || 1,
//       limit: parseInt(limit) || 50
//     });

//     res.status(200).json({
//       success: true,
//       data: result.patients,
//       pagination: {
//         total: result.totalCount,
//         pages: result.totalPages,
//         current: result.currentPage,
//         hasNext: result.currentPage < result.totalPages,
//         hasPrev: result.currentPage > 1
//       }
//     });
//   })
// );

// /* ============================================================
//    GET PATIENT BY ID
//    GET /api/patients/:id
// ============================================================ */
// router.get(
//   "/:id",
//   [param("id").isInt({ min: 1 })],
//   handleValidationErrors,
//   asyncHandler(async (req, res) => {
//     const patientId = Number(req.params.id);
//     const patient = await getPatientById(patientId);

//     res.status(200).json({ success: true, data: patient });
//   })
// );

// /* ============================================================
//    CREATE NEW PATIENT
//    POST /api/patients
// ============================================================ */
// router.post(
//   "/",
//   [
//     body("first_name")
//       .isString()
//       .trim()
//       .notEmpty()
//       .withMessage("First name is required"),

//     body("last_name").optional().isString().trim(),
//     body("middle_name").optional().isString().trim(),

//     body("email").optional().isEmail().normalizeEmail(),
//     body("phone").optional().isString().trim(),

//     body("date_of_birth").optional().isISO8601(),
//     body("gender").optional().isString(),
//     body("blood_type").optional().isString(),

//     body("allergies").optional().isString().trim(),
//     body("medical_conditions").optional().isString().trim(),
//     body("emergency_contact_name").optional().isString().trim(),
//     body("emergency_contact_phone").optional().isString().trim()
//   ],
//   handleValidationErrors,
//   asyncHandler(async (req, res) => {
//     const patientData = req.body;
//     patientData.added_by = req.user.id;

//     const newPatient = await createPatient(patientData);

//     res.status(201).json({
//       success: true,
//       message: "Patient created successfully",
//       data: newPatient
//     });
//   })
// );

// /* ============================================================
//    UPDATE PATIENT
//    PUT /api/patients/:id
// ============================================================ */
// router.put(
//   "/:id",
//   [
//     param("id").isInt({ min: 1 }),
//     body("first_name").optional().isString().trim().notEmpty(),
//     body("last_name").optional().isString().trim(),
//     body("middle_name").optional().isString().trim(),

//     body("email").optional().isEmail(),
//     body("phone").optional().isString(),

//     body("date_of_birth").optional().isISO8601(),
//     body("gender").optional().isString(),
//     body("blood_type").optional().isString(),

//     body("allergies").optional().isString(),
//     body("medical_conditions").optional().isString(),
//     body("emergency_contact_name").optional().isString(),
//     body("emergency_contact_phone").optional().isString()
//   ],
//   handleValidationErrors,
//   asyncHandler(async (req, res) => {
//     const patientId = Number(req.params.id);
//     const updatedPatient = await updatePatient(patientId, req.body);

//     res.status(200).json({
//       success: true,
//       message: "Patient updated successfully",
//       data: updatedPatient
//     });
//   })
// );

// /* ============================================================
//    DELETE PATIENT
//    DELETE /api/patients/:id
// ============================================================ */
// router.delete(
//   "/:id",
//   [param("id").isInt({ min: 1 })],
//   handleValidationErrors,
//   asyncHandler(async (req, res) => {
//     const patientId = Number(req.params.id);
//     const deleted = await deletePatient(patientId);

//     res.status(200).json({
//       success: true,
//       message: "Patient deleted successfully",
//       data: deleted
//     });
//   })
// );

// /* ============================================================
//    GET MEDICAL HISTORY
// ============================================================ */
// router.get(
//   "/:id/medical-history",
//   [param("id").isInt({ min: 1 })],
//   handleValidationErrors,
//   asyncHandler(async (req, res) => {
//     const patientId = Number(req.params.id);
//     const records = await getMedicalRecords(patientId);

//     res.status(200).json({ success: true, data: records });
//   })
// );

// /* ============================================================
//    ADD MEDICAL RECORD
// ============================================================ */
// router.post(
//   "/:id/medical-history",
//   [
//     param("id").isInt({ min: 1 }),
//     body("visit_date").optional().isISO8601(),
//     body("record_type").optional().isString(),
//     body("diagnosis").optional().isString(),
//     body("treatment").optional().isString(),
//     body("notes").optional().isString(),
//     body("prescriptions").optional().isArray()
//   ],
//   handleValidationErrors,
//   asyncHandler(async (req, res) => {
//     const patientId = Number(req.params.id);

//     const recordData = {
//       patient_id: patientId,
//       doctor_id: req.user.id,
//       visit_date: req.body.visit_date || new Date().toISOString().split("T")[0],
//       record_type: req.body.record_type || "consultation",
//       diagnosis: req.body.diagnosis || "",
//       treatment: req.body.treatment || "",
//       notes: req.body.notes || "",
//       prescriptions: req.body.prescriptions || []
//     };

//     const newRecord = await addMedicalRecord(recordData);

//     res.status(201).json({
//       success: true,
//       message: "Medical record added successfully",
//       data: newRecord
//     });
//   })
// );

// /* ============================================================
//    Health Test Route
// ============================================================ */
// router.get("/health/test", (req, res) => {
//   res.status(200).json({
//     success: true,
//     message: "Patient routes OK",
//     timestamp: new Date().toISOString()
//   });
// });

// module.exports = router;

// const express = require("express");
// const { body, param, query } = require("express-validator");

// const { protect } = require("../middleware/auth");
// const asyncHandler = require("../middleware/asyncHandler");
// const handleValidationErrors = require("../middleware/validation");

// const {
//   getAllPatients,
//   getPatientById,
//   createPatient,
//   updatePatient,
//   deletePatient,
//   getMedicalRecords,
//   addMedicalRecord,
//   getPatientStats
// } = require("../models/patientModel");

// const router = express.Router();

// /* ============================================================
//    Protect all routes
// ============================================================ */
// router.use(protect);

// /* ============================================================
//    GET PATIENT STATS
// ============================================================ */
// router.get(
//   "/stats/overview",
//   asyncHandler(async (req, res) => {
//     try {
//       const stats = await getPatientStats();
//       res.status(200).json({ success: true, data: stats });
//     } catch (err) {
//       console.error("Stats Error:", err);
//       res.status(200).json({
//         success: true,
//         data: { total: 0, byGender: [], recent: 0 }
//       });
//     }
//   })
// );

// /* ============================================================
//    SEARCH PATIENTS
// ============================================================ */
// router.get(
//   "/search/:query",
//   [param("query").isString().trim().notEmpty()],
//   handleValidationErrors,
//   asyncHandler(async (req, res) => {
//     const searchTerm = req.params.query;
//     const result = await getAllPatients({ search: searchTerm, limit: 20 });

//     res.status(200).json({
//       success: true,
//       data: result.patients,
//       count: result.patients.length
//     });
//   })
// );

// /* ============================================================
//    GET ALL PATIENTS
// ============================================================ */
// router.get(
//   "/",
//   [
//     query("search").optional().isString().trim(),
//     query("page").optional().isInt({ min: 1 }),
//     query("limit").optional().isInt({ min: 1, max: 200 })
//   ],
//   handleValidationErrors,
//   asyncHandler(async (req, res) => {
//     const { search, page, limit } = req.query;

//     const result = await getAllPatients({
//       search,
//       page: parseInt(page) || 1,
//       limit: parseInt(limit) || 50
//     });

//     res.status(200).json({
//       success: true,
//       data: result.patients,
//       pagination: {
//         total: result.totalCount,
//         pages: result.totalPages,
//         current: result.currentPage
//       }
//     });
//   })
// );

// /* ============================================================
//    GET PATIENT BY ID
// ============================================================ */
// router.get(
//   "/:id",
//   [param("id").isInt({ min: 1 })],
//   handleValidationErrors,
//   asyncHandler(async (req, res) => {
//     const id = Number(req.params.id);
//     const patient = await getPatientById(id);

//     res.status(200).json({ success: true, data: patient });
//   })
// );

// /* ============================================================
//    CREATE PATIENT (MATCHES POSTGRES TABLE)
// ============================================================ */
// router.post(
//   "/",
//   [
//     body("first_name").isString().trim().notEmpty().withMessage("first_name is required"),
//     body("last_name").isString().trim().notEmpty().withMessage("last_name is required"),
//     body("phone").isString().trim().notEmpty().withMessage("phone is required"),

//     body("email").optional().isEmail(),
//     body("dob").optional().isISO8601(),   // PostgreSQL column is "dob"
//     body("gender").optional().isString(),
//     body("address").optional().isString(),

//     body("emergency_contact_name").optional().isString(),
//     body("emergency_contact_phone").optional().isString(),
//     body("emergency_contact_relation").optional().isString(),

//     body("blood_group").optional().isString(),
//     body("allergies").optional().isString(),
//     body("medical_history").optional().isString(),

//     body("insurance_provider").optional().isString(),
//     body("insurance_policy_number").optional().isString()
//   ],
//   handleValidationErrors,
//   asyncHandler(async (req, res) => {
//     const patientData = req.body;
//     patientData.user_id = req.user.id;

//     const created = await createPatient(patientData);

//     res.status(201).json({
//       success: true,
//       message: "Patient created successfully",
//       data: created
//     });
//   })
// );

// /* ============================================================
//    UPDATE PATIENT
// ============================================================ */
// router.put(
//   "/:id",
//   [
//     param("id").isInt({ min: 1 }),

//     body("first_name").optional().isString().trim(),
//     body("last_name").optional().isString().trim(),
//     body("phone").optional().isString().trim(),

//     body("email").optional().isEmail(),
//     body("dob").optional().isISO8601(),
//     body("gender").optional().isString(),
//     body("address").optional().isString(),

//     body("emergency_contact_name").optional().isString(),
//     body("emergency_contact_phone").optional().isString(),
//     body("emergency_contact_relation").optional().isString(),

//     body("blood_group").optional().isString(),
//     body("allergies").optional().isString(),
//     body("medical_history").optional().isString(),

//     body("insurance_provider").optional().isString(),
//     body("insurance_policy_number").optional().isString(),
//     body("status").optional().isString()
//   ],
//   handleValidationErrors,
//   asyncHandler(async (req, res) => {
//     const id = Number(req.params.id);
//     const updated = await updatePatient(id, req.body);

//     res.status(200).json({
//       success: true,
//       message: "Patient updated successfully",
//       data: updated
//     });
//   })
// );

// /* ============================================================
//    DELETE PATIENT
// ============================================================ */
// router.delete(
//   "/:id",
//   [param("id").isInt({ min: 1 })],
//   handleValidationErrors,
//   asyncHandler(async (req, res) => {
//     const id = Number(req.params.id);
//     const deleted = await deletePatient(id);

//     res.status(200).json({
//       success: true,
//       message: "Patient deleted",
//       data: deleted
//     });
//   })
// );

// /* ============================================================
//    GET MEDICAL HISTORY
// ============================================================ */
// router.get(
//   "/:id/medical-history",
//   [param("id").isInt({ min: 1 })],
//   handleValidationErrors,
//   asyncHandler(async (req, res) => {
//     const id = Number(req.params.id);

//     const records = await getMedicalRecords(id);
//     res.status(200).json({ success: true, data: records });
//   })
// );

// /* ============================================================
//    ADD MEDICAL RECORD
// ============================================================ */
// router.post(
//   "/:id/medical-history",
//   [
//     param("id").isInt({ min: 1 }),
//     body("visit_date").optional().isISO8601(),
//     body("record_type").optional().isString(),
//     body("diagnosis").optional().isString(),
//     body("treatment").optional().isString(),
//     body("notes").optional().isString(),
//     body("prescriptions").optional().isArray()
//   ],
//   handleValidationErrors,
//   asyncHandler(async (req, res) => {
//     const patientId = Number(req.params.id);

//     const record = {
//       patient_id: patientId,
//       doctor_id: req.user.id,
//       visit_date: req.body.visit_date,
//       record_type: req.body.record_type || "consultation",
//       diagnosis: req.body.diagnosis || "",
//       treatment: req.body.treatment || "",
//       notes: req.body.notes || "",
//       prescriptions: req.body.prescriptions || []
//     };

//     const created = await addMedicalRecord(record);

//     res.status(201).json({
//       success: true,
//       message: "Medical record added successfully",
//       data: created
//     });
//   })
// );

// /* ============================================================
//    HEALTH CHECK
// ============================================================ */
// router.get("/health/test", (req, res) => {
//   res.status(200).json({
//     success: true,
//     message: "Patient routes working",
//     time: new Date().toISOString()
//   });
// });

// module.exports = router;


const express = require("express");
const { body, param, query } = require("express-validator");

const { protect } = require("../middleware/auth");
const asyncHandler = require("../middleware/asyncHandler");
const handleValidationErrors = require("../middleware/validation");

const {
  getAllPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
  getMedicalRecords,
  addMedicalRecord,
  getPatientStats
} = require("../models/patientModel");

const router = express.Router();

/* ============================================================
   PROTECT ALL ROUTES
============================================================ */
router.use(protect);

/* ============================================================
   GET PATIENT STATS
============================================================ */
router.get(
  "/stats/overview",
  asyncHandler(async (req, res) => {
    try {
      const stats = await getPatientStats();
      res.status(200).json({ success: true, data: stats });
    } catch (error) {
      console.error("Stats Error:", error);
      res.status(200).json({
        success: true,
        data: { total: 0, byGender: [], recent: 0 }
      });
    }
  })
);

/* ============================================================
   SEARCH PATIENTS
============================================================ */
router.get(
  "/search/:query",
  [param("query").isString().trim().notEmpty()],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const search = req.params.query;
    const result = await getAllPatients({ search, limit: 20 });

    res.status(200).json({
      success: true,
      data: result.patients,
      count: result.patients.length
    });
  })
);

/* ============================================================
   GET ALL PATIENTS
============================================================ */
router.get(
  "/",
  [
    query("search").optional().isString().trim(),
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 200 })
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { search, page, limit } = req.query;

    const result = await getAllPatients({
      search,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50
    });

    res.status(200).json({
      success: true,
      data: result.patients,
      pagination: {
        total: result.totalCount,
        pages: result.totalPages,
        current: result.currentPage
      }
    });
  })
);

/* ============================================================
   GET PATIENT BY ID
============================================================ */
router.get(
  "/:id",
  [param("id").isInt({ min: 1 })],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const patient = await getPatientById(id);

    res.status(200).json({ success: true, data: patient });
  })
);

/* ============================================================
   CREATE PATIENT
============================================================ */
router.post(
  "/",
  [
    body("first_name").notEmpty().withMessage("first_name is required"),
    body("last_name").notEmpty().withMessage("last_name is required"),
    body("phone").notEmpty().withMessage("phone is required"),

    body("email").optional().isEmail(),
    body("dob").optional().isISO8601(),
    body("gender").optional().isString(),
    body("address").optional().isString(),

    body("emergency_contact_name").optional().isString(),
    body("emergency_contact_phone").optional().isString(),
    body("emergency_contact_relation").optional().isString(),

    body("blood_group").optional().isString(),
    body("allergies").optional().isString(),
    body("medical_history").optional().isString(),

    body("insurance_provider").optional().isString(),
    body("insurance_policy_number").optional().isString()
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const patientData = req.body;
    patientData.user_id = req.user.id;

    const created = await createPatient(patientData);

    res.status(201).json({
      success: true,
      message: "Patient created successfully",
      data: created
    });
  })
);

/* ============================================================
   UPDATE PATIENT
============================================================ */
router.put(
  "/:id",
  [
    param("id").isInt(),

    body("first_name").optional().isString().trim(),
    body("last_name").optional().isString().trim(),
    body("phone").optional().isString().trim(),

    body("email").optional().isEmail(),
    body("dob").optional().isISO8601(),
    body("gender").optional().isString(),
    body("address").optional().isString(),

    body("emergency_contact_name").optional().isString(),
    body("emergency_contact_phone").optional().isString(),
    body("emergency_contact_relation").optional().isString(),

    body("blood_group").optional().isString(),
    body("allergies").optional().isString(),
    body("medical_history").optional().isString(),

    body("insurance_provider").optional().isString(),
    body("insurance_policy_number").optional().isString(),
    body("status").optional().isString()
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const updated = await updatePatient(id, req.body);

    res.status(200).json({
      success: true,
      message: "Patient updated successfully",
      data: updated
    });
  })
);

/* ============================================================
   GET MEDICAL HISTORY
============================================================ */
router.get(
  "/:id/medical-history",
  [param("id").isInt()],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const records = await getMedicalRecords(id);

    res.status(200).json({ success: true, data: records });
  })
);

/* ============================================================
   ADD MEDICAL RECORD — FULLY FIXED
============================================================ */
router.post(
  "/:id/medical-history",
  [
    param("id").isInt(),
    body("record_type").optional().isString(),
    body("record_date").optional().isISO8601(),
    body("description").optional().isString(),

    body("visit_date").optional().isISO8601(),
    body("diagnosis").optional().isString(),
    body("treatment").optional().isString(),
    body("notes").optional().isString(),
    body("prescriptions").optional().isArray()
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const patientId = Number(req.params.id);
    const today = new Date().toISOString().split("T")[0];

    const record = {
      patient_id: patientId,
      doctor_id: req.user.id,

      // REQUIRED BY POSTGRES TABLE
      record_type: req.body.record_type || "General",
      record_date: req.body.record_date || today,
      description: req.body.description || "No description provided",

      // OPTIONAL
      visit_date: req.body.visit_date || today,
      diagnosis: req.body.diagnosis || "",
      treatment: req.body.treatment || "",
      notes: req.body.notes || "",
      prescriptions: req.body.prescriptions || []
    };

    const created = await addMedicalRecord(record);

    res.status(201).json({
      success: true,
      message: "Medical record added successfully",
      data: created
    });
  })
);

/* ============================================================
   HEALTH CHECK
============================================================ */
router.get("/health/test", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Patient routes working",
    time: new Date().toISOString()
  });
});

module.exports = router;
