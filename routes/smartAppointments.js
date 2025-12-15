const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const controller = require("../controllers/smartAppointments.controller");

router.get("/smart-slots", protect, controller.smartSlots);

module.exports = router;
