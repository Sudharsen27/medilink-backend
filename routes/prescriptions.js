const express = require("express");
const { param } = require("express-validator");
const { protect } = require("../middleware/auth");
const asyncHandler = require("../middleware/asyncHandler");
const handleValidationErrors = require("../middleware/validation");
const {
  getUserPrescriptions,
  getPrescriptionById,
} = require("../models/prescriptions");

const router = express.Router();

router.use(protect);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const prescriptions = await getUserPrescriptions(req.user.id);
    res.json({
      success: true,
      count: prescriptions.length,
      data: prescriptions,
    });
  })
);

router.get(
  "/:id",
  param("id").isInt().withMessage("Valid prescription ID required"),
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const prescription = await getPrescriptionById(
      req.user.id,
      Number(req.params.id)
    );

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: "Prescription not found",
      });
    }

    res.json({
      success: true,
      data: prescription,
    });
  })
);

module.exports = router;
