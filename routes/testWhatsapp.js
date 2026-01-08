// // routes/testWhatsapp.js
// const express = require("express");
// const router = express.Router();
// const { sendWhatsAppMessage } = require("../utils/whatsapp");

// router.post("/send", async (req, res) => {
//   const { to, message } = req.body;

//   if (!to || !message) {
//     return res.status(400).json({ error: "to and message are required" });
//   }

//   try {
//     const response = await sendWhatsAppMessage(to, message);
//     res.json({ success: true, sid: response.sid });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// module.exports = router;


const express = require("express");
const router = express.Router();
const { sendWhatsAppMessage } = require("../utils/whatsapp");

// 🔹 Test WhatsApp endpoint
router.post("/send", async (req, res) => {
  console.log("📩 Incoming WhatsApp request body:", req.body);

  const { to, message } = req.body || {};

  if (!to || !message) {
    return res.status(400).json({
      success: false,
      error: "Both 'to' and 'message' are required",
      received: req.body,
    });
  }

  try {
    const response = await sendWhatsAppMessage(to, message);
    res.json({
      success: true,
      sid: response.sid,
    });
  } catch (err) {
    console.error("❌ WhatsApp send error:", err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

module.exports = router;
