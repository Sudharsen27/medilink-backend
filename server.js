

// const express = require("express");
// const cors = require("cors");
// const http = require("http");
// const path = require("path");
// require("dotenv").config();

// /* ==========================
//    🚀 Route Imports
// ========================== */
// const authRoutes = require("./routes/auth");
// const appointmentRoutes = require("./routes/appointments");
// const smartAppointmentRoutes = require("./routes/smartAppointments"); // ✅ Smart Booking
// const dependentRoutes = require("./routes/dependents");               // ✅ Caregiver Mode
// const usersRoutes = require("./routes/users");
// const dashboardRoutes = require("./routes/dashboard");
// const doctorsRoutes = require("./routes/doctors");
// const favoritesRoutes = require("./routes/favorites");
// const prescriptionsRoutes = require("./routes/prescriptions");
// const medicalRecordsRoutes = require("./routes/medicalRecords");
// const notificationsRoutes = require("./routes/notifications");
// const patientProfileRoutes = require("./routes/patientProfile");
// const patientRoutes = require("./routes/patientRoutes");
// const emergencyRoutes = require("./routes/emergency");


// /* ==========================
//    ⏰ Scheduler
// ========================== */
// const { startReminderScheduler } = require("./reminderScheduler");

// /* ==========================
//    🔔 WebSocket Server
// ========================== */
// const NotificationWebSocketServer = require("./websocket/server");

// const app = express();
// const PORT = process.env.PORT || 3000;

// /* ==========================
//    🔧 Global Middlewares
// ========================== */
// app.use(
//   cors({
//     origin: [
//       "https://d332c478.medilink-frontendapp.pages.dev",
//       "http://localhost:3000",
//     ],
//     credentials: true,
//   })
// );

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// /* ==========================
//    📁 Static uploads
// ========================== */
// app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// /* ==========================
//    ✅ HEALTH CHECK
// ========================== */
// app.get("/health", (req, res) => {
//   res.status(200).json({
//     success: true,
//     status: "ok",
//     service: "medilink-backend",
//     time: new Date().toISOString(),
//   });
// });

// app.get("/api/health", (req, res) => {
//   res.status(200).json({
//     success: true,
//     status: "ok",
//     service: "medilink-backend",
//     time: new Date().toISOString(),
//   });
// });

// /* ==========================
//    📌 API Routes
// ========================== */
// app.use("/api/auth", authRoutes);

// // 🧠 Core Appointments
// app.use("/api/appointments", appointmentRoutes);

// // 🚀 Smart Appointments (V2)
// app.use("/api/smart-appointments", smartAppointmentRoutes);

// // 👨‍👩‍👧 Caregiver / Dependents
// app.use("/api/dependents", dependentRoutes);

// app.use("/api/users", usersRoutes);
// app.use("/api/dashboard", dashboardRoutes);
// app.use("/api/doctors", doctorsRoutes);
// app.use("/api/favorites", favoritesRoutes);
// app.use("/api/prescriptions", prescriptionsRoutes);
// app.use("/api/medical-records", medicalRecordsRoutes);
// app.use("/api/notifications", notificationsRoutes);
// app.use("/api/patient", patientProfileRoutes);
// app.use("/api/patients", patientRoutes);
// app.use("/api/emergency", emergencyRoutes);

// /* ==========================
//    ❌ 404 JSON HANDLER
// ========================== */
// app.use((req, res) => {
//   res.status(404).json({
//     success: false,
//     message: "Route not found",
//     path: req.originalUrl,
//   });
// });

// /* ==========================
//    🌐 HTTP Server
// ========================== */
// const server = http.createServer(app);

// /* ==========================
//    🔔 WebSocket Init
// ========================== */
// const notificationWSS = new NotificationWebSocketServer(server);
// app.set("notificationWSS", notificationWSS);

// /* ==========================
//    🚀 Start Server
// ========================== */
// server.listen(PORT, () => {
//   console.log(`✅ Backend running on port ${PORT}`);
//   console.log(`📡 WebSocket server active`);
//   console.log(`🔔 Notifications ready`);

//   if (process.env.NODE_ENV === "production") {
//     startReminderScheduler();
//   }
// });


const express = require("express");
const cors = require("cors");
const http = require("http");
const path = require("path");
require("dotenv").config();

/* ==========================
   🚀 Route Imports
========================== */
const authRoutes = require("./routes/auth");
const appointmentRoutes = require("./routes/appointments");
const smartAppointmentRoutes = require("./routes/smartAppointments");
const dependentRoutes = require("./routes/dependents");
const usersRoutes = require("./routes/users");
const dashboardRoutes = require("./routes/dashboard");
const doctorsRoutes = require("./routes/doctors");
const favoritesRoutes = require("./routes/favorites");
const prescriptionsRoutes = require("./routes/prescriptions");
const medicalRecordsRoutes = require("./routes/medicalRecords");
const notificationsRoutes = require("./routes/notifications");
const patientProfileRoutes = require("./routes/patientProfile");
const patientRoutes = require("./routes/patientRoutes");
const emergencyRoutes = require("./routes/emergency");
const adminAnalyticsRoutes = require("./routes/adminAnalytics");

// ✅ ADD THIS
const testWhatsappRoutes = require("./routes/testWhatsapp");

/* ==========================
   ⏰ Scheduler
========================== */
const { startReminderScheduler } = require("./reminderScheduler");

/* ==========================
   🔔 WebSocket Server
========================== */
const NotificationWebSocketServer = require("./websocket/server");

const app = express();
const PORT = process.env.PORT || 5000;

/* ==========================
   🔧 Global Middlewares
========================== */
const DEFAULT_CORS_ORIGINS = [
  "http://localhost:3000",
  "https://d332c478.medilink-frontendapp.pages.dev",
  "https://medilink-frontend-ml45.vercel.app",
];

const corsOrigins = [
  ...DEFAULT_CORS_ORIGINS,
  ...(process.env.CORS_ORIGINS || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),
];

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (corsOrigins.includes(origin)) return true;
  // Vercel production + preview deployments
  if (/^https:\/\/[\w.-]+\.vercel\.app$/.test(origin)) return true;
  return false;
};

app.use(
  cors({
    origin: (origin, callback) => {
      callback(null, isAllowedOrigin(origin));
    },
    credentials: true,
  })
);

// ✅ REQUIRED FOR req.body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ==========================
   📁 Static uploads
========================== */
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ==========================
   ✅ HEALTH CHECK
========================== */
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "ok",
    service: "medilink-backend",
    time: new Date().toISOString(),
  });
});

/* ==========================
   📌 API Routes
========================== */
app.use("/api/auth", authRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/smart-appointments", smartAppointmentRoutes);
app.use("/api/dependents", dependentRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/doctors", doctorsRoutes);
app.use("/api/favorites", favoritesRoutes);
app.use("/api/prescriptions", prescriptionsRoutes);
app.use("/api/medical-records", medicalRecordsRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/patient", patientProfileRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/emergency", emergencyRoutes);
app.use("/api/admin", adminAnalyticsRoutes);

// ✅ WHATSAPP TEST ROUTE (THIS WAS MISSING)
app.use("/api/test/whatsapp", testWhatsappRoutes);

/* ==========================
   ❌ 404 JSON HANDLER
========================== */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
  });
});

/* ==========================
   🌐 HTTP Server
========================== */
const server = http.createServer(app);

/* ==========================
   🔔 WebSocket Init
========================== */
const notificationWSS = new NotificationWebSocketServer(server);
app.set("notificationWSS", notificationWSS);

/* ==========================
   🚀 Start Server
========================== */
server.listen(PORT, () => {
  console.log(`✅ Backend running on port ${PORT}`);
  console.log(`📡 WebSocket server active`);
  console.log(`🔔 Notifications ready`);

  if (process.env.NODE_ENV === "production") {
    startReminderScheduler();
  }
});


// const express = require("express");
// const cors = require("cors");
// const http = require("http");
// const path = require("path");
// require("dotenv").config();

// /* ==========================
//    🚀 App Init
// ========================== */
// const app = express();
// const PORT = process.env.PORT || 5000;

// /* ==========================
//    🔧 Global Middlewares
// ========================== */
// app.use(
//   cors({
//     origin: [
//       "https://d332c478.medilink-frontendapp.pages.dev",
//       "http://localhost:3000",
//     ],
//     credentials: true,
//   })
// );

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// /* ==========================
//    📁 Static uploads
// ========================== */
// app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// /* ==========================
//    🚀 Route Imports
// ========================== */
// const authRoutes = require("./routes/auth");
// const appointmentRoutes = require("./routes/appointments");
// const smartAppointmentRoutes = require("./routes/smartAppointments");
// const dependentRoutes = require("./routes/dependents");
// const usersRoutes = require("./routes/users");
// const dashboardRoutes = require("./routes/dashboard");
// const doctorsRoutes = require("./routes/doctors");
// const favoritesRoutes = require("./routes/favorites");
// const prescriptionsRoutes = require("./routes/prescriptions");
// const medicalRecordsRoutes = require("./routes/medicalRecords");
// const notificationsRoutes = require("./routes/notifications");
// const patientProfileRoutes = require("./routes/patientProfile");
// const patientRoutes = require("./routes/patientRoutes");
// const emergencyRoutes = require("./routes/emergency");
// const testWhatsappRoutes = require("./routes/testWhatsapp");

// /* ==========================
//    ⏰ Scheduler
// ========================== */
// const { startReminderScheduler } = require("./reminderScheduler");

// /* ==========================
//    🔔 WebSocket Server
// ========================== */
// const NotificationWebSocketServer = require("./websocket/server");

// /* ==========================
//    🩺 Health Check
// ========================== */
// app.get("/health", (req, res) => {
//   res.status(200).json({
//     success: true,
//     status: "ok",
//     service: "medilink-backend",
//     time: new Date().toISOString(),
//   });
// });

// /* ==========================
//    📌 API Routes
// ========================== */
// app.use("/api/auth", authRoutes);
// app.use("/api/appointments", appointmentRoutes);
// app.use("/api/smart-appointments", smartAppointmentRoutes);
// app.use("/api/dependents", dependentRoutes);
// app.use("/api/users", usersRoutes);
// app.use("/api/dashboard", dashboardRoutes);
// app.use("/api/doctors", doctorsRoutes);
// app.use("/api/favorites", favoritesRoutes);
// app.use("/api/prescriptions", prescriptionsRoutes);
// app.use("/api/medical-records", medicalRecordsRoutes);
// app.use("/api/notifications", notificationsRoutes);
// app.use("/api/patient", patientProfileRoutes);
// app.use("/api/patients", patientRoutes);
// app.use("/api/emergency", emergencyRoutes);
// app.use("/api/test/whatsapp", testWhatsappRoutes);

// /* ==========================
//    ❌ 404 Handler
// ========================== */
// app.use((req, res) => {
//   res.status(404).json({
//     success: false,
//     message: "Route not found",
//     path: req.originalUrl,
//   });
// });

// /* ==========================
//    ❗ Global Error Handler (LAST)
// ========================== */
// const errorHandler = require("./middleware/errorHandler");
// app.use(errorHandler);

// /* ==========================
//    🌐 HTTP Server
// ========================== */
// const server = http.createServer(app);

// /* ==========================
//    🔔 WebSocket Init
// ========================== */
// const notificationWSS = new NotificationWebSocketServer(server);
// app.set("notificationWSS", notificationWSS);

// /* ==========================
//    🚀 Start Server
// ========================== */
// server.listen(PORT, () => {
//   console.log(`✅ Backend running on port ${PORT}`);
//   console.log(`📡 WebSocket server active`);
//   console.log(`🔔 Notifications ready`);

//   if (process.env.NODE_ENV === "production") {
//     startReminderScheduler();
//   }
// });
