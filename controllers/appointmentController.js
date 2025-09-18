// controllers/appointmentController.js
const { sendWhatsAppMessage } = require("../utils/whatsapp");

// Example after saving appointment
const createAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.create(req.body);

    // Send WhatsApp reminder
    const msg = `Hello ${appointment.patientName}, your appointment with Dr. ${appointment.doctorName} is booked for ${appointment.date} at ${appointment.time}.`;
    await sendWhatsAppMessage(appointment.patientPhone, msg);

    res.status(201).json(appointment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
