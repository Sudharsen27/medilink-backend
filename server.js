// const express = require('express');
// const cors = require('cors');
// require('dotenv').config();

// const authRoutes = require('./routes/auth');
// const appointmentRoutes = require('./routes/appointments');
// const usersRoutes = require('./routes/users');
// const dashboardRoutes = require('./routes/dashboard');
// const doctorsRouter = require('./routes/doctors');

// const { startReminderScheduler } = require('./reminderScheduler');

// const app = express();
// const PORT = process.env.PORT || 5000;

// // Middlewares
// app.use(cors());
// app.use(express.json());

// // Routess
// app.use('/api/auth', authRoutes);
// app.use('/api/appointments', appointmentRoutes);
// app.use('/api/users', usersRoutes);
// app.use('/api/dashboard', dashboardRoutes);
// app.use('/api/doctors', doctorsRouter);


// // Start server
// app.listen(PORT, () => {
//   console.log(`✅ Server running on http://localhost:${PORT}`);

//   // ✅ Start WhatsApp reminder scheduler when server boots
//   startReminderScheduler();
// });

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const appointmentRoutes = require('./routes/appointments');
const usersRoutes = require('./routes/users');
const dashboardRoutes = require('./routes/dashboard');
const doctorsRouter = require('./routes/doctors');

const { startReminderScheduler } = require('./reminderScheduler');

const app = express();
const PORT = process.env.PORT || 5000;

// ==========================
// ✅ Middlewares
// ==========================
app.use(cors());
app.use(express.json());

// ✅ Serve uploaded images
app.use('/uploads', express.static('uploads'));

// ==========================
// ✅ Routes
// ==========================
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/doctors', doctorsRouter);

// ==========================
// ✅ Start Server
// ==========================
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);

  // ✅ Start WhatsApp reminder scheduler when server boots
  startReminderScheduler();
});
