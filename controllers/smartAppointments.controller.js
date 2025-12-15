const service = require("../services/smartAppointments.service");

exports.smartSlots = async (req, res) => {
  try {
    const { doctorId } = req.query;
    const patientId = req.user.id;

    const slots = await service.getSmartSlots(doctorId, patientId);
    res.json({ success: true, slots });
  } catch (err) {
    console.error("Smart slots error:", err);
    res.status(500).json({ error: "Failed to generate smart slots" });
  }
};
