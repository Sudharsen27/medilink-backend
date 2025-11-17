// const express = require('express');
// const { param, query } = require('express-validator');
// const pool = require('../config/db');
// const { protect } = require('../middleware/auth');
// const asyncHandler = require('../middleware/asyncHandler');
// const handleValidationErrors = require('../middleware/validation');
// const {
//   getUserNotifications,
//   markAsRead,
//   markAllAsRead,
//   deleteNotification,
//   getUnreadCount
// } = require('../models/notifications');

// const router = express.Router();

// // All routes protected
// router.use(protect);

// // @desc    Get user notifications
// // @route   GET /api/notifications
// // @access  Private
// router.get('/', [
//   query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
//   query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be a positive integer')
// ], handleValidationErrors, asyncHandler(async (req, res) => {
//   const { limit = 50, offset = 0 } = req.query;
//   const userId = req.user.id;

//   const notifications = await getUserNotifications(userId, parseInt(limit), parseInt(offset));
//   const unreadCount = await getUnreadCount(userId);

//   res.status(200).json({
//     success: true,
//     count: notifications.length,
//     unreadCount,
//     data: notifications
//   });
// }));

// // @desc    Mark notification as read
// // @route   PUT /api/notifications/:id/read
// // @access  Private
// router.put('/:id/read', [
//   param('id').isInt({ min: 1 }).withMessage('Valid notification ID is required')
// ], handleValidationErrors, asyncHandler(async (req, res) => {
//   const notificationId = req.params.id;
//   const userId = req.user.id;

//   const updatedNotification = await markAsRead(notificationId, userId);

//   if (!updatedNotification) {
//     return res.status(404).json({
//       success: false,
//       error: 'Notification not found'
//     });
//   }

//   const unreadCount = await getUnreadCount(userId);

//   res.status(200).json({
//     success: true,
//     data: updatedNotification,
//     unreadCount
//   });
// }));

// // @desc    Mark all notifications as read
// // @route   PUT /api/notifications/read-all
// // @access  Private
// router.put('/read-all', asyncHandler(async (req, res) => {
//   const userId = req.user.id;

//   const updatedCount = await markAllAsRead(userId);
//   const unreadCount = await getUnreadCount(userId);

//   res.status(200).json({
//     success: true,
//     message: `Marked ${updatedCount} notifications as read`,
//     unreadCount
//   });
// }));

// // @desc    Delete notification
// // @route   DELETE /api/notifications/:id
// // @access  Private
// router.delete('/:id', [
//   param('id').isInt({ min: 1 }).withMessage('Valid notification ID is required')
// ], handleValidationErrors, asyncHandler(async (req, res) => {
//   const notificationId = req.params.id;
//   const userId = req.user.id;

//   const deletedNotification = await deleteNotification(notificationId, userId);

//   if (!deletedNotification) {
//     return res.status(404).json({
//       success: false,
//       error: 'Notification not found'
//     });
//   }

//   const unreadCount = await getUnreadCount(userId);

//   res.status(200).json({
//     success: true,
//     message: 'Notification deleted successfully',
//     unreadCount
//   });
// }));

// // @desc    Get unread notification count
// // @route   GET /api/notifications/unread-count
// // @access  Private
// router.get('/unread-count', asyncHandler(async (req, res) => {
//   const userId = req.user.id;

//   const unreadCount = await getUnreadCount(userId);

//   res.status(200).json({
//     success: true,
//     unreadCount
//   });
// }));

// module.exports = router;

// // backend/routes/notifications.js
// const express = require('express');
// const router = express.Router();
// const db = require('../config/database'); // Your database connection

// // GET /api/notifications - Get user's notifications
// router.get('/', async (req, res) => {
//   try {
//     const userId = req.user.id; // From authentication middleware
    
//     const result = await db.query(
//       `SELECT * FROM notifications 
//        WHERE user_id = $1 
//        ORDER BY created_at DESC 
//        LIMIT 100`,
//       [userId]
//     );
    
//     res.json(result.rows);
//   } catch (error) {
//     console.error('Error fetching notifications:', error);
//     res.status(500).json({ error: 'Failed to fetch notifications' });
//   }
// });

// // PUT /api/notifications/:id/read - Mark as read
// router.put('/:id/read', async (req, res) => {
//   try {
//     const { id } = req.params;
//     const userId = req.user.id;
    
//     await db.query(
//       'UPDATE notifications SET read = true, read_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2',
//       [id, userId]
//     );
    
//     res.json({ success: true });
//   } catch (error) {
//     console.error('Error marking notification as read:', error);
//     res.status(500).json({ error: 'Failed to mark as read' });
//   }
// });

// // PUT /api/notifications/read-all - Mark all as read
// router.put('/read-all', async (req, res) => {
//   try {
//     const userId = req.user.id;
    
//     await db.query(
//       'UPDATE notifications SET read = true, read_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND read = false',
//       [userId]
//     );
    
//     res.json({ success: true });
//   } catch (error) {
//     console.error('Error marking all as read:', error);
//     res.status(500).json({ error: 'Failed to mark all as read' });
//   }
// });

// // DELETE /api/notifications/:id - Delete notification
// router.delete('/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     const userId = req.user.id;
    
//     await db.query(
//       'DELETE FROM notifications WHERE id = $1 AND user_id = $2',
//       [id, userId]
//     );
    
//     res.json({ success: true });
//   } catch (error) {
//     console.error('Error deleting notification:', error);
//     res.status(500).json({ error: 'Failed to delete notification' });
//   }
// });

// module.exports = router;

// // backend/routes/notifications.js
// const express = require('express');
// const router = express.Router();
// const db = require('../config/database'); // Your database connection

// // GET /api/notifications - Get user's notifications
// router.get('/', async (req, res) => {
//   try {
//     // For now, hardcode user_id 1 until authentication is set up
//     const userId = 1; // Replace with req.user.id when you have auth middleware
    
//     console.log('📡 API: Fetching notifications for user:', userId);
    
//     const result = await db.query(
//       `SELECT * FROM notifications 
//        WHERE user_id = $1 
//        ORDER BY created_at DESC 
//        LIMIT 100`,
//       [userId]
//     );
    
//     console.log('✅ API: Found', result.rows.length, 'notifications');
//     res.json(result.rows);
    
//   } catch (error) {
//     console.error('❌ API Error fetching notifications:', error);
//     res.status(500).json({ error: 'Failed to fetch notifications' });
//   }
// });

// // PUT /api/notifications/:id/read - Mark as read
// router.put('/:id/read', async (req, res) => {
//   try {
//     const { id } = req.params;
//     const userId = 1; // Replace with req.user.id when you have auth
    
//     console.log('📝 API: Marking notification as read:', id, 'for user:', userId);
    
//     const result = await db.query(
//       'UPDATE notifications SET read = true, read_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2 RETURNING *',
//       [id, userId]
//     );
    
//     if (result.rows.length === 0) {
//       return res.status(404).json({ error: 'Notification not found' });
//     }
    
//     console.log('✅ API: Notification marked as read');
//     res.json({ success: true, notification: result.rows[0] });
    
//   } catch (error) {
//     console.error('❌ API Error marking notification as read:', error);
//     res.status(500).json({ error: 'Failed to mark as read' });
//   }
// });

// // PUT /api/notifications/read-all - Mark all as read
// router.put('/read-all', async (req, res) => {
//   try {
//     const userId = 1; // Replace with req.user.id when you have auth
    
//     console.log('📝 API: Marking all notifications as read for user:', userId);
    
//     const result = await db.query(
//       'UPDATE notifications SET read = true, read_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND read = false RETURNING *',
//       [userId]
//     );
    
//     console.log('✅ API: Marked', result.rows.length, 'notifications as read');
//     res.json({ success: true, updatedCount: result.rows.length });
    
//   } catch (error) {
//     console.error('❌ API Error marking all as read:', error);
//     res.status(500).json({ error: 'Failed to mark all as read' });
//   }
// });

// // DELETE /api/notifications/:id - Delete notification
// router.delete('/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     const userId = 1; // Replace with req.user.id when you have auth
    
//     console.log('🗑️ API: Deleting notification:', id, 'for user:', userId);
    
//     const result = await db.query(
//       'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING *',
//       [id, userId]
//     );
    
//     if (result.rows.length === 0) {
//       return res.status(404).json({ error: 'Notification not found' });
//     }
    
//     console.log('✅ API: Notification deleted');
//     res.json({ success: true, deletedNotification: result.rows[0] });
    
//   } catch (error) {
//     console.error('❌ API Error deleting notification:', error);
//     res.status(500).json({ error: 'Failed to delete notification' });
//   }
// });

// // Test endpoint - to verify API is working
// router.get('/test', async (req, res) => {
//   try {
//     console.log('🧪 TEST API: Notifications endpoint is working');
//     res.json({ 
//       message: 'Notifications API is working!',
//       timestamp: new Date().toISOString()
//     });
//   } catch (error) {
//     console.error('❌ TEST API Error:', error);
//     res.status(500).json({ error: 'Test failed' });
//   }
// });

// module.exports = router;

// // backend/routes/notifications.js
// const express = require('express');
// const router = express.Router();

// // GET /api/notifications - Get user's notifications
// router.get('/', async (req, res) => {
//   try {
//     console.log('📡 API: /api/notifications called successfully!');
    
//     // Return mock data for immediate testing
//     const mockNotifications = [
//       {
//         id: 2,
//         user_id: 1,
//         type: 'appointment',
//         title: 'Test Appointment',
//         message: 'System test',
//         priority: 'medium',
//         read: false,
//         read_at: null,
//         related_entity_type: 'appointment',
//         related_entity_id: null,
//         created_at: '2025-11-13T18:21:06.296Z'
//       },
//       {
//         id: 3,
//         user_id: 1,
//         type: 'appointment',
//         title: 'New Appointment',
//         message: 'Your appointment has been scheduled',
//         priority: 'medium',
//         read: false,
//         read_at: null,
//         related_entity_type: 'appointment',
//         related_entity_id: 106,
//         created_at: '2025-11-13T18:26:22.541Z'
//       },
//       {
//         id: 11,
//         user_id: 1,
//         type: 'appointment',
//         title: 'New Appointment',
//         message: 'Your appointment has been scheduled',
//         priority: 'medium',
//         read: false,
//         read_at: null,
//         related_entity_type: 'appointment',
//         related_entity_id: 114,
//         created_at: '2025-11-13T18:45:55.132Z'
//       }
//     ];
    
//     console.log('✅ API: Returning', mockNotifications.length, 'mock notifications');
//     res.json(mockNotifications);
    
//   } catch (error) {
//     console.error('❌ API Error:', error);
//     res.status(500).json({ error: 'Failed to fetch notifications' });
//   }
// });

// // PUT /api/notifications/:id/read - Mark as read
// router.put('/:id/read', async (req, res) => {
//   try {
//     const { id } = req.params;
//     console.log('📝 API: Marking notification as read:', id);
    
//     // Mock success response
//     res.json({ 
//       success: true, 
//       message: `Notification ${id} marked as read` 
//     });
    
//   } catch (error) {
//     console.error('❌ API Error:', error);
//     res.status(500).json({ error: 'Failed to mark as read' });
//   }
// });

// // PUT /api/notifications/read-all - Mark all as read
// router.put('/read-all', async (req, res) => {
//   try {
//     console.log('📝 API: Marking all notifications as read');
    
//     // Mock success response
//     res.json({ 
//       success: true, 
//       message: 'All notifications marked as read',
//       updatedCount: 3
//     });
    
//   } catch (error) {
//     console.error('❌ API Error:', error);
//     res.status(500).json({ error: 'Failed to mark all as read' });
//   }
// });

// // DELETE /api/notifications/:id - Delete notification
// router.delete('/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     console.log('🗑️ API: Deleting notification:', id);
    
//     // Mock success response
//     res.json({ 
//       success: true, 
//       message: `Notification ${id} deleted` 
//     });
    
//   } catch (error) {
//     console.error('❌ API Error:', error);
//     res.status(500).json({ error: 'Failed to delete notification' });
//   }
// });

// // Test endpoint
// router.get('/test', (req, res) => {
//   res.json({ 
//     message: 'Notifications API is working!',
//     timestamp: new Date().toISOString(),
//     status: 'OK'
//   });
// });

// module.exports = router;

// // backend/routes/notifications.js
// const express = require('express');
// const router = express.Router();
// const db = require('../config/database'); // Adjust path to your DB connection

// // GET /api/notifications - Get user's real notifications from database
// router.get('/', async (req, res) => {
//   try {
//     console.log('📡 API: /api/notifications called - fetching REAL data');
    
//     // TODO: Replace with actual user ID from authentication
//     const userId = 1; // This should come from req.user or session
    
//     // Fetch real notifications from database
//     const result = await db.query(
//       `SELECT * FROM notifications 
//        WHERE user_id = $1 
//        ORDER BY created_at DESC 
//        LIMIT 50`,
//       [userId]
//     );
    
//     const realNotifications = result.rows;
    
//     console.log('✅ API: Returning', realNotifications.length, 'REAL notifications from database');
//     res.json(realNotifications);
    
//   } catch (error) {
//     console.error('❌ API Error:', error);
//     res.status(500).json({ error: 'Failed to fetch notifications' });
//   }
// });

// // PUT /api/notifications/:id/read - Mark as read in database
// router.put('/:id/read', async (req, res) => {
//   try {
//     const { id } = req.params;
//     const userId = 1; // From authentication
    
//     console.log('📝 API: Marking notification as read in DB:', id);
    
//     // Update in database
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
//     const userId = 1; // From authentication
    
//     console.log('📝 API: Marking all notifications as read in DB');
    
//     // Update all in database
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
//     const userId = 1; // From authentication
    
//     console.log('🗑️ API: Deleting notification from DB:', id);
    
//     // Delete from database
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

// module.exports = router;

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
