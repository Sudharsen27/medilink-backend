// // server.js
// const express = require('express');
// const cors = require('cors');
// require('dotenv').config();
// const authRoutes = require('./routes/auth');

// const app = express();
// const PORT = 5000;

// app.use(cors());
// app.use(express.json());

// // Routes
// const appointmentRoutes = require('./routes/appointments');
// app.use('/api/appointments', appointmentRoutes);

// app.listen(PORT, () => {
//   console.log(`Server running on http://localhost:${PORT}`);
// });
// app.use('/api/auth', authRoutes);
// server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const appointmentRoutes = require('./routes/appointments');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
