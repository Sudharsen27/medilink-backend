const pool = require('../config/db');

/**
 * Create a new notification
 */
const createNotification = async (notificationData) => {
  const {
    user_id,
    type,
    title,
    message,
    priority = 'medium',
    related_entity_type,
    related_entity_id,
    expires_at
  } = notificationData;

  const query = `
    INSERT INTO notifications (user_id, type, title, message, priority, related_entity_type, related_entity_id, expires_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `;

  const values = [
    user_id,
    type,
    title,
    message,
    priority,
    related_entity_type,
    related_entity_id,
    expires_at
  ];

  const { rows } = await pool.query(query, values);
  return rows[0];
};

/**
 * Get notifications for a user
 */
const getUserNotifications = async (userId, limit = 50, offset = 0) => {
  const query = `
    SELECT * FROM notifications 
    WHERE user_id = $1 AND (expires_at IS NULL OR expires_at > NOW())
    ORDER BY created_at DESC
    LIMIT $2 OFFSET $3
  `;

  const { rows } = await pool.query(query, [userId, limit, offset]);
  return rows;
};

/**
 * Mark notification as read
 */
const markAsRead = async (notificationId, userId) => {
  const query = `
    UPDATE notifications 
    SET read = true, read_at = CURRENT_TIMESTAMP
    WHERE id = $1 AND user_id = $2
    RETURNING *
  `;

  const { rows } = await pool.query(query, [notificationId, userId]);
  return rows[0];
};

/**
 * Mark all notifications as read for a user
 */
const markAllAsRead = async (userId) => {
  const query = `
    UPDATE notifications 
    SET read = true, read_at = CURRENT_TIMESTAMP
    WHERE user_id = $1 AND read = false
    RETURNING COUNT(*) as updated_count
  `;

  const { rows } = await pool.query(query, [userId]);
  return parseInt(rows[0].updated_count);
};

/**
 * Delete a notification
 */
const deleteNotification = async (notificationId, userId) => {
  const query = `
    DELETE FROM notifications 
    WHERE id = $1 AND user_id = $2
    RETURNING *
  `;

  const { rows } = await pool.query(query, [notificationId, userId]);
  return rows[0];
};

/**
 * Get unread notification count
 */
const getUnreadCount = async (userId) => {
  const query = `
    SELECT COUNT(*) as count 
    FROM notifications 
    WHERE user_id = $1 AND read = false AND (expires_at IS NULL OR expires_at > NOW())
  `;

  const { rows } = await pool.query(query, [userId]);
  return parseInt(rows[0].count);
};

/**
 * Create appointment reminder notification
 */
const createAppointmentReminder = async (appointment) => {
  const notificationData = {
    user_id: appointment.user_id,
    type: 'appointment',
    title: 'Appointment Reminder',
    message: `You have an appointment with ${appointment.doctor_name} in 1 hour`,
    priority: 'high',
    related_entity_type: 'appointment',
    related_entity_id: appointment.id,
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // Expire in 24 hours
  };

  return await createNotification(notificationData);
};

/**
 * Create prescription ready notification
 */
const createPrescriptionReadyNotification = async (prescription) => {
  const notificationData = {
    user_id: prescription.user_id,
    type: 'prescription',
    title: 'Prescription Ready',
    message: 'Your prescription is ready for pickup',
    priority: 'medium',
    related_entity_type: 'prescription',
    related_entity_id: prescription.id,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Expire in 7 days
  };

  return await createNotification(notificationData);
};

module.exports = {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
  createAppointmentReminder,
  createPrescriptionReadyNotification
};