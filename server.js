// const express = require('express');
// const cors = require('cors');
// require('dotenv').config();

// // ==========================
// // ✅ Route Imports
// // ==========================
// const authRoutes = require('./routes/auth');
// const appointmentRoutes = require('./routes/appointments');
// const usersRoutes = require('./routes/users');
// const dashboardRoutes = require('./routes/dashboard');
// const doctorsRouter = require('./routes/doctors');
// const healthRoute = require('./routes/health'); // ✅ Added health route
// const favoritesRoutes = require('./routes/favorites');
// const prescriptionsRoutes = require('./routes/prescriptions');
// const medicalRecordsRoutes = require('./routes/medicalRecords');

// // ==========================
// // ✅ Scheduler Import
// // ==========================
// const { startReminderScheduler } = require('./reminderScheduler');

// const app = express();
// const PORT = process.env.PORT || 5000;

// // ==========================
// // ✅ Middlewares
// // ==========================
// app.use(cors());
// app.use(express.json());
// app.use('/api/favorites', favoritesRoutes);

// // ✅ Serve uploaded images
// app.use('/uploads', express.static('uploads'));

// // ==========================
// // ✅ Routes
// // ==========================
// app.use('/api/auth', authRoutes);
// app.use('/api/appointments', appointmentRoutes);
// app.use('/api/users', usersRoutes);
// app.use('/api/dashboard', dashboardRoutes);
// app.use('/api/doctors', doctorsRouter);
// app.use('/api/prescriptions', prescriptionsRoutes);
// app.use('/api/medical-records', medicalRecordsRoutes);

// // ✅ Add Health Check Route
// app.use('/health', healthRoute);

// // ==========================
// // ✅ Start Server
// // ==========================
// app.listen(PORT, () => {
//   console.log(`✅ Server running on http://localhost:${PORT}`);

//   // ✅ Start WhatsApp reminder scheduler when server boots
//   startReminderScheduler();
// });

// /*
// -------------------------------------------------
// Optional: Frontend Health Check Component Example
// -------------------------------------------------
// You can create a simple React component that calls
// this endpoint to verify server health status.

// Example (React):

// useEffect(() => {
//   fetch('http://localhost:5000/health')
//     .then(res => res.json())
//     .then(data => console.log(data.status))
//     .catch(err => console.error('Health check failed', err));
// }, []);
// */

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

//   // Start WhatsApp Reminder Scheduler
//   startReminderScheduler();
// });

const express = require('express');
const cors = require('cors');
const http = require('http'); // ✅ Needed for WebSocket binding
require('dotenv').config();

// ==========================
// ✅ Route Imports
// ==========================
const authRoutes = require('./routes/auth');
const appointmentRoutes = require('./routes/appointments');
const usersRoutes = require('./routes/users');
const dashboardRoutes = require('./routes/dashboard');
const doctorsRouter = require('./routes/doctors');
const healthRoute = require('./routes/health'); 
const favoritesRoutes = require('./routes/favorites');
const prescriptionsRoutes = require('./routes/prescriptions');
const medicalRecordsRoutes = require('./routes/medicalRecords');
const notificationsRoutes = require('./routes/notifications'); // ✅ ADDED MISSING IMPORT

// ==========================
// ✅ Scheduler
// ==========================
const { startReminderScheduler } = require('./reminderScheduler');

// ==========================
// ✅ WebSocket Notification Server
// ==========================
const NotificationWebSocketServer = require('./websocket/server'); // ⭐ NEW IMPORT

const app = express();
const PORT = process.env.PORT || 5000;

// ==========================
// ✅ Middlewares
// ==========================
app.use(cors());
app.use(express.json());
app.use('/api/favorites', favoritesRoutes);

// Serve uploaded images
app.use('/uploads', express.static('uploads'));

// ==========================
// ✅ API Routes
// ==========================
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/doctors', doctorsRouter);
app.use('/api/prescriptions', prescriptionsRoutes);
app.use('/api/medical-records', medicalRecordsRoutes);
app.use('/api/notifications', notificationsRoutes); // ✅ ADDED MISSING ROUTE

// Health check route
app.use('/health', healthRoute);

// ==========================
// ⭐ IMPORTANT: Create HTTP Server
// WebSockets cannot attach to `app.listen`
// ==========================
const server = http.createServer(app);

// ==========================
// ⭐ Initialize WebSocket Server
// ==========================
const notificationWSS = new NotificationWebSocketServer(server);

// Make WebSocket server accessible inside Express route handlers
app.set('notificationWSS', notificationWSS);

// ==========================
// 🚀 Start Express + WebSocket Server
// ==========================
server.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
  console.log(`📡 WebSocket server running on same port`);
  console.log(`🔔 Notifications API available at /api/notifications`); // ✅ ADDED LOG

  // Start WhatsApp Reminder Scheduler
  startReminderScheduler();
});