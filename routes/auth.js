// // routes/auth.js
// const express = require('express');
// const router = express.Router();
// const pool = require('../config/db');
// const bcrypt = require('bcrypt');
// const jwt = require('jsonwebtoken');
// const nodemailer = require("nodemailer");

// // ✅ Helper to generate JWT
// function generateToken(user) {
//   return jwt.sign(
//     { id: user.id, email: user.email, role: user.role }, 
//     process.env.JWT_SECRET,
//     { expiresIn: '1d' }
//   );
// }

// // ✅ Nodemailer transporter (Gmail + App Password)
// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

// // ✅ Register new user
// router.post('/register', async (req, res) => {
//   const { name, email, password, role } = req.body;

//   try {
//     // check if email already exists
//     const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
//     if (existingUser.rows.length > 0) {
//       return res.status(400).json({ error: 'User already exists' });
//     }

//     // hash password
//     const hashedPassword = await bcrypt.hash(password, 10);

//     // insert user
//     const result = await pool.query(
//       'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
//       [name, email, hashedPassword, role || 'user']
//     );

//     const user = result.rows[0];
//     const token = generateToken(user);

//     // ✅ Send welcome email
//     await transporter.sendMail({
//       from: `"Medilink App" <${process.env.EMAIL_USER}>`,
//       to: user.email,
//       subject: "Welcome to Medilink 🎉",
//       text: `Hi ${user.name}, welcome to Medilink! Your account has been created successfully.`,
//     });

//     res.status(201).json({
//       token,
//       user: { id: user.id, name: user.name, email: user.email, role: user.role }
//     });
//   } catch (err) {
//     console.error(err.message);
//     res.status(500).json({ error: 'Server error' });
//   }
// });

// // ✅ Login user
// router.post('/login', async (req, res) => {
//   const { email, password } = req.body;

//   try {
//     const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
//     if (result.rows.length === 0) {
//       return res.status(400).json({ error: 'User not found' });
//     }

//     const user = result.rows[0];

//     // compare passwords
//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       return res.status(401).json({ error: 'Invalid password' });
//     }

//     const token = generateToken(user);

//     res.json({
//       token,
//       user: { id: user.id, name: user.name, email: user.email, role: user.role }
//     });
//   } catch (err) {
//     console.error(err.message);
//     res.status(500).json({ error: 'Server error' });
//   }
// });

// module.exports = router;


// routes/auth.js
const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

// ------------------------------------------
// JWT Token Generator
// ------------------------------------------
function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
}

// ------------------------------------------
// Email Transporter (Gmail + App Password)
// ------------------------------------------
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ------------------------------------------
// REGISTER USER
// ------------------------------------------
router.post("/register", async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    // Check if email already exists
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const result = await pool.query(
      "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role",
      [name, email, hashedPassword, role || "user"]
    );

    const user = result.rows[0];
    const token = generateToken(user);

    // Send welcome email
    await transporter.sendMail({
      from: `"Medilink App" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Welcome to Medilink 🎉",
      text: `Hi ${user.name}, welcome to Medilink! Your account has been created successfully.`,
    });

    // SUCCESS RESPONSE
    return res.status(201).json({
      success: true,
      message: "Registration successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("REGISTER ERROR:", err.message);

    return res.status(500).json({
      success: false,
      message: "Server error during registration",
      error: err.message,
    });
  }
});

// ------------------------------------------
// LOGIN USER
// ------------------------------------------
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    const user = result.rows[0];

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    const token = generateToken(user);

    return res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err.message);

    return res.status(500).json({
      success: false,
      message: "Server error during login",
      error: err.message,
    });
  }
});

module.exports = router;
