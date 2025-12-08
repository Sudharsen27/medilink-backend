

// const express = require('express');
// const cors = require('cors');
// const http = require('http'); // ✅ Needed for WebSocket binding
// require('dotenv').config();

// // ==========================
// // ✅ Route Imports
// // ==========================
// const authRoutes = require('./routes/auth');
// const appointmentRoutes = require('./routes/appointments');
// const usersRoutes = require('./routes/users');
// const dashboardRoutes = require('./routes/dashboard');
// const doctorsRouter = require('./routes/doctors');
// const healthRoute = require('./routes/health'); 
// const favoritesRoutes = require('./routes/favorites');
// const prescriptionsRoutes = require('./routes/prescriptions');
// const medicalRecordsRoutes = require('./routes/medicalRecords');
// const notificationsRoutes = require('./routes/notifications'); // ✅ ADDED MISSING IMPORT

// // ==========================
// // ✅ Scheduler
// // ==========================
// const { startReminderScheduler } = require('./reminderScheduler');

// // ==========================
// // ✅ WebSocket Notification Server
// // ==========================
// const NotificationWebSocketServer = require('./websocket/server'); // ⭐ NEW IMPORT

// const app = express();
// const PORT = process.env.PORT || 5000;

// // ==========================
// // ✅ Middlewares
// // ==========================
// app.use(cors());
// app.use(express.json());
// app.use('/api/favorites', favoritesRoutes);

// // Serve uploaded images
// app.use('/uploads', express.static('uploads'));

// // ==========================
// // ✅ API Routes
// // ==========================
// app.use('/api/auth', authRoutes);
// app.use('/api/appointments', appointmentRoutes);
// app.use('/api/users', usersRoutes);
// app.use('/api/dashboard', dashboardRoutes);
// app.use('/api/doctors', doctorsRouter);
// app.use('/api/prescriptions', prescriptionsRoutes);
// app.use('/api/medical-records', medicalRecordsRoutes);
// app.use('/api/notifications', notificationsRoutes); // ✅ ADDED MISSING ROUTE

// // Health check route
// app.use('/health', healthRoute);

// // ==========================
// // ⭐ IMPORTANT: Create HTTP Server
// // WebSockets cannot attach to `app.listen`
// // ==========================
// const server = http.createServer(app);

// // ==========================
// // ⭐ Initialize WebSocket Server
// // ==========================
// const notificationWSS = new NotificationWebSocketServer(server);

// // Make WebSocket server accessible inside Express route handlers
// app.set('notificationWSS', notificationWSS);

// // ==========================
// // 🚀 Start Express + WebSocket Server
// // ==========================
// server.listen(PORT, () => {
//   console.log(`✅ Server running at http://localhost:${PORT}`);
//   console.log(`📡 WebSocket server running on same port`);
//   console.log(`🔔 Notifications API available at /api/notifications`); // ✅ ADDED LOG

//   // Start WhatsApp Reminder Scheduler
//   startReminderScheduler();
// });

const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');        // ⭐ Needed for serving uploads folder
require('dotenv').config();

// ==========================
// 🚀 Route Imports
// ==========================
const authRoutes = require('./routes/auth');
const appointmentRoutes = require('./routes/appointments');
const usersRoutes = require('./routes/users');
const dashboardRoutes = require('./routes/dashboard');
const doctorsRoutes = require('./routes/doctors');
const healthRoutes = require('./routes/health');
const favoritesRoutes = require('./routes/favorites');
const prescriptionsRoutes = require('./routes/prescriptions');
const medicalRecordsRoutes = require('./routes/medicalRecords');
  // ⭐ CORRECT IMPORT
const notificationsRoutes = require('./routes/notifications');
const patientProfileRoutes = require('./routes/patientProfile');
const patientRoutes = require('./routes/patientRoutes');
const emergencyRoutes = require('./routes/emergency');

// ==========================
// ⏰ Scheduler
// ==========================
const { startReminderScheduler } = require('./reminderScheduler');

// ==========================
// 🔔 WebSocket Server
// ==========================
const NotificationWebSocketServer = require('./websocket/server');

const app = express();
const PORT = process.env.PORT || 5000;

// ==========================
// 🔧 Global Middlewares
// ==========================
app.use(cors());
app.use(express.json());

// ==========================
// 📁 Static Uploads Directory
// ==========================
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ==========================
// 📌 API Route Handlers
// ==========================
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/doctors', doctorsRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/prescriptions', prescriptionsRoutes);
app.use('/api/medical-records', medicalRecordsRoutes);   // ⭐ FIXED
app.use('/api/notifications', notificationsRoutes);
app.use('/health', healthRoutes);
app.use('/api/patient', patientProfileRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/emergency', emergencyRoutes);

// ==========================
// 🌐 Create HTTP Server (Required for WebSockets)
// ==========================
const server = http.createServer(app);

// ==========================
// 🔔 Initialize WebSocket
// ==========================
const notificationWSS = new NotificationWebSocketServer(server);

// Make WS available inside routes
app.set('notificationWSS', notificationWSS);

// ==========================
// 🚀 Start Server + Scheduler
// ==========================
server.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
  console.log(`📡 WebSocket server running on same port`);
  console.log(`🔔 Notifications API available at /api/notifications`);
  
  startReminderScheduler();
});
