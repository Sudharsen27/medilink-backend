const express = require('express');
const cors = require('cors');
require('dotenv').config();

// ==========================
// ✅ Route Imports
// ==========================
const authRoutes = require('./routes/auth');
const appointmentRoutes = require('./routes/appointments');
const usersRoutes = require('./routes/users');
const dashboardRoutes = require('./routes/dashboard');
const doctorsRouter = require('./routes/doctors');
const healthRoute = require('./routes/health'); // ✅ Added health route
const favoritesRoutes = require('./routes/favorites');
const prescriptionsRoutes = require('./routes/prescriptions');
const medicalRecordsRoutes = require('./routes/medicalRecords');

// ==========================
// ✅ Scheduler Import
// ==========================
const { startReminderScheduler } = require('./reminderScheduler');

const app = express();
const PORT = process.env.PORT || 5000;

// ==========================
// ✅ Middlewares
// ==========================
app.use(cors());
app.use(express.json());
app.use('/api/favorites', favoritesRoutes);

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
app.use('/api/prescriptions', prescriptionsRoutes);
app.use('/api/medical-records', medicalRecordsRoutes);

// ✅ Add Health Check Route
app.use('/health', healthRoute);

// ==========================
// ✅ Start Server
// ==========================
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);

  // ✅ Start WhatsApp reminder scheduler when server boots
  startReminderScheduler();
});

/*
-------------------------------------------------
Optional: Frontend Health Check Component Example
-------------------------------------------------
You can create a simple React component that calls
this endpoint to verify server health status.

Example (React):

useEffect(() => {
  fetch('http://localhost:5000/health')
    .then(res => res.json())
    .then(data => console.log(data.status))
    .catch(err => console.error('Health check failed', err));
}, []);
*/
