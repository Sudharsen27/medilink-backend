// models/Appointment.js
const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // patient
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // doctor
  date: { type: Date, required: true }, // full datetime
  notes: { type: String },
});

module.exports = mongoose.model("Appointment", appointmentSchema);
