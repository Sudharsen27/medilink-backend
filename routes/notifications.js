


const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// =============================================
// ✅ Database Connection (Primary + Fallback)
// =============================================
let db;

try {
  db = require('../config/db');  // Main DB pool
} catch (error) {
  console.log('⚠️ Using fallback database connection');
  const { Pool } = require('pg');

  const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'medilink',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
  });

  db = {
    query: (sql, params) => pool.query(sql, params),
  };
}

// =============================================
// 📌 GET: Fetch Logged-in User Notifications
// =============================================
router.get("/", protect, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      `SELECT * 
       FROM notifications 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json(result.rows);

  } catch (error) {
    console.error("❌ Notifications fetch error:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// =============================================
// 📌 PUT: Mark SINGLE Notification as Read
// =============================================
router.put("/:id/read", protect, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await db.query(
      `UPDATE notifications 
       SET read = true, read_at = NOW() 
       WHERE id = $1 AND user_id = $2 
       RETURNING *`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.json({
      success: true,
      message: `Notification ${id} marked as read`,
      notification: result.rows[0],
    });

  } catch (error) {
    console.error("❌ Mark read error:", error);
    res.status(500).json({ error: "Failed to mark as read" });
  }
});

// =============================================
// 📌 PUT: Mark ALL Notifications as Read
// =============================================
router.put("/read-all", protect, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      `UPDATE notifications 
       SET read = true, read_at = NOW() 
       WHERE user_id = $1 AND read = false 
       RETURNING id`,
      [userId]
    );

    res.json({
      success: true,
      message: "All notifications marked as read",
      updatedCount: result.rows.length,
    });

  } catch (error) {
    console.error("❌ Read all error:", error);
    res.status(500).json({ error: "Failed to mark all as read" });
  }
});

// =============================================
// 📌 DELETE: Remove a Notification
// =============================================
router.delete("/:id", protect, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await db.query(
      `DELETE FROM notifications 
       WHERE id = $1 AND user_id = $2 
       RETURNING id`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.json({
      success: true,
      message: `Notification ${id} deleted`,
    });

  } catch (error) {
    console.error("❌ Delete error:", error);
    res.status(500).json({ error: "Failed to delete notification" });
  }
});

// =============================================
// 📌 Setup: Create Notifications Table
// =============================================
router.get("/setup-table", async (req, res) => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        priority VARCHAR(20) DEFAULT 'medium',
        read BOOLEAN DEFAULT false,
        read_at TIMESTAMP,
        related_entity_type VARCHAR(50),
        related_entity_id INTEGER,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    res.json({
      success: true,
      message: "Notifications table created/verified",
    });

  } catch (error) {
    console.error("❌ Table creation error:", error);
    res.status(500).json({ error: "Failed to create table" });
  }
});

module.exports = router;
