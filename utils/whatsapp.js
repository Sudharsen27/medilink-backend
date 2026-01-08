// // utils/whatsapp.js
// const twilio = require("twilio");

// // Load from .env
// const accountSid = process.env.TWILIO_ACCOUNT_SID;
// const authToken = process.env.TWILIO_AUTH_TOKEN;
// const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;

// const client = twilio(accountSid, authToken);

// // ✅ Function to send WhatsApp messages
// async function sendWhatsAppMessage(to, message) {
//   try {
//     const response = await client.messages.create({
//       from: `whatsapp:${whatsappNumber}`,  // Your Twilio WhatsApp number
//       to: `whatsapp:${to}`,               // Recipient’s number (+91 format for India)
//       body: message,
//     });

//     console.log("✅ WhatsApp message sent:", response.sid);
//     return response;
//   } catch (err) {
//     console.error("❌ Error sending WhatsApp message:", err.message);
//     throw err;
//   }
// }

// module.exports = { sendWhatsAppMessage };

// // utils/whatsapp.js
// const twilio = require("twilio");

// const accountSid = process.env.TWILIO_ACCOUNT_SID;
// const authToken = process.env.TWILIO_AUTH_TOKEN;
// const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;

// const client = twilio(accountSid, authToken);

// async function sendWhatsAppMessage(to, message) {
//   try {
//     const response = await client.messages.create({
//       from: `whatsapp:${whatsappNumber}`,
//       to: `whatsapp:${to}`,
//       body: message,
//     });

//     console.log("✅ WhatsApp message sent:", response.sid);
//     return response;
//   } catch (err) {
//     console.error("❌ Error sending WhatsApp message:", err.message);
//     throw err;
//   }
// }

// module.exports = { sendWhatsAppMessage };


const twilio = require("twilio");

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const sendWhatsAppMessage = async ({ to, message }) => {
  if (!to || !message) {
    throw new Error("WhatsApp requires both 'to' and 'message'");
  }

  return client.messages.create({
    from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
    to: `whatsapp:${to}`,
    body: message,
  });
};

module.exports = { sendWhatsAppMessage };
