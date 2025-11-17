

// const express = require('express');
// const router = express.Router();

// // Temporary: Import your existing database connection
// // If you don't have this file, we'll create a different solution
// let db;

// try {
//   // Try to import from your existing DB connection
//   db = require('../config/database');
// } catch (error) {
//   // If that fails, we'll create a simple connection
//   console.log('⚠️  Using fallback database connection');
//   const { Pool } = require('pg');
  
//   const pool = new Pool({
//     user: process.env.DB_USER || 'postgres',
//     host: process.env.DB_HOST || 'localhost', 
//     database: process.env.DB_NAME || 'medilink',
//     password: process.env.DB_PASSWORD || 'password',
//     port: process.env.DB_PORT || 5432,
//   });
  
//   db = {
//     query: (text, params) => pool.query(text, params)
//   };
// }

// // GET /api/notifications - Get user's real notifications from database
// router.get('/', async (req, res) => {
//   try {
//     console.log('📡 API: /api/notifications called - fetching REAL data');
    
//     const userId = 1; // TODO: Get from authentication
    
//     // First, let's check if the notifications table exists
//     try {
//       const result = await db.query(
//         `SELECT * FROM notifications 
//          WHERE user_id = $1 
//          ORDER BY created_at DESC 
//          LIMIT 50`,
//         [userId]
//       );
      
//       console.log('✅ API: Returning', result.rows.length, 'REAL notifications from database');
//       res.json(result.rows);
      
//     } catch (dbError) {
//       // If table doesn't exist yet, return empty array
//       if (dbError.code === '42P01') { // table doesn't exist
//         console.log('📋 Notifications table not found, returning empty array');
//         res.json([]);
//       } else {
//         throw dbError;
//       }
//     }
    
//   } catch (error) {
//     console.error('❌ API Error:', error);
//     res.status(500).json({ error: 'Failed to fetch notifications' });
//   }
// });

// // PUT /api/notifications/:id/read - Mark as read in database
// router.put('/:id/read', async (req, res) => {
//   try {
//     const { id } = req.params;
//     const userId = 1;
    
//     console.log('📝 API: Marking notification as read in DB:', id);
    
//     const result = await db.query(
//       `UPDATE notifications 
//        SET read = true, read_at = NOW() 
//        WHERE id = $1 AND user_id = $2 
//        RETURNING *`,
//       [id, userId]
//     );
    
//     if (result.rows.length === 0) {
//       return res.status(404).json({ error: 'Notification not found' });
//     }
    
//     res.json({ 
//       success: true, 
//       message: `Notification ${id} marked as read`,
//       notification: result.rows[0]
//     });
    
//   } catch (error) {
//     console.error('❌ API Error:', error);
//     res.status(500).json({ error: 'Failed to mark as read' });
//   }
// });

// // PUT /api/notifications/read-all - Mark all as read in database
// router.put('/read-all', async (req, res) => {
//   try {
//     const userId = 1;
    
//     console.log('📝 API: Marking all notifications as read in DB');
    
//     const result = await db.query(
//       `UPDATE notifications 
//        SET read = true, read_at = NOW() 
//        WHERE user_id = $1 AND read = false 
//        RETURNING id`,
//       [userId]
//     );
    
//     res.json({ 
//       success: true, 
//       message: 'All notifications marked as read',
//       updatedCount: result.rows.length
//     });
    
//   } catch (error) {
//     console.error('❌ API Error:', error);
//     res.status(500).json({ error: 'Failed to mark all as read' });
//   }
// });

// // DELETE /api/notifications/:id - Delete from database
// router.delete('/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     const userId = 1;
    
//     console.log('🗑️ API: Deleting notification from DB:', id);
    
//     const result = await db.query(
//       `DELETE FROM notifications 
//        WHERE id = $1 AND user_id = $2 
//        RETURNING id`,
//       [id, userId]
//     );
    
//     if (result.rows.length === 0) {
//       return res.status(404).json({ error: 'Notification not found' });
//     }
    
//     res.json({ 
//       success: true, 
//       message: `Notification ${id} deleted` 
//     });
    
//   } catch (error) {
//     console.error('❌ API Error:', error);
//     res.status(500).json({ error: 'Failed to delete notification' });
//   }
// });

// // Create notifications table if it doesn't exist
// router.get('/setup-table', async (req, res) => {
//   try {
//     await db.query(`
//       CREATE TABLE IF NOT EXISTS notifications (
//         id SERIAL PRIMARY KEY,
//         user_id INTEGER NOT NULL,
//         type VARCHAR(50) NOT NULL,
//         title VARCHAR(255) NOT NULL,
//         message TEXT NOT NULL,
//         priority VARCHAR(20) DEFAULT 'medium',
//         read BOOLEAN DEFAULT false,
//         read_at TIMESTAMP,
//         related_entity_type VARCHAR(50),
//         related_entity_id INTEGER,
//         created_at TIMESTAMP DEFAULT NOW()
//       )
//     `);
    
//     res.json({ success: true, message: 'Notifications table created/verified' });
//   } catch (error) {
//     console.error('❌ Table creation error:', error);
//     res.status(500).json({ error: 'Failed to create table' });
//   }
// });

// module.exports = router;

const express = require('express');
const router = express.Router();
const verifyToken = require("../middleware/auth");

// =============================================
// ✅ Database Connection (Primary + Fallback)
// =============================================
let db;

try {
  db = require('../config/db');  // Your main pooled connection
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
router.get("/", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id; // REAL logged-in user

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
router.put("/:id/read", verifyToken, async (req, res) => {
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
router.put("/read-all", verifyToken, async (req, res) => {
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
router.delete("/:id", verifyToken, async (req, res) => {
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
