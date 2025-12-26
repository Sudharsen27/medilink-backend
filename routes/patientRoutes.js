

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
