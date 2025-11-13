const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

class NotificationWebSocketServer {
  constructor(server) {
    this.wss = new WebSocket.Server({ server });
    this.clients = new Map(); // userId -> WebSocket connection
    
    this.setupWebSocket();
  }

  setupWebSocket() {
    this.wss.on('connection', (ws, req) => {
      console.log('🔌 New WebSocket connection');

      // Authenticate connection
      this.authenticateConnection(ws, req);
      
      ws.on('message', (message) => {
        this.handleMessage(ws, message);
      });

      ws.on('close', () => {
        this.handleDisconnection(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });
  }

  authenticateConnection(ws, req) {
    // Extract token from query string or headers
    const token = this.extractToken(req);
    
    if (!token) {
      ws.close(1008, 'Authentication required');
      return;
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Verify user exists and is active
      this.verifyUser(decoded.id)
        .then(user => {
          if (user) {
            ws.userId = user.id;
            this.clients.set(user.id, ws);
            console.log(`✅ User ${user.id} connected to WebSocket`);
            
            // Send welcome message
            this.sendToUser(user.id, {
              type: 'connection_established',
              message: 'WebSocket connection established'
            });
          } else {
            ws.close(1008, 'User not found');
          }
        })
        .catch(error => {
          console.error('User verification error:', error);
          ws.close(1008, 'Authentication failed');
        });
    } catch (error) {
      console.error('JWT verification error:', error);
      ws.close(1008, 'Invalid token');
    }
  }

  extractToken(req) {
    // Check query string
    if (req.url) {
      const urlParams = new URLSearchParams(req.url.split('?')[1]);
      const token = urlParams.get('token');
      if (token) return token;
    }

    // Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return null;
  }

  async verifyUser(userId) {
    const query = 'SELECT id, name, email FROM users WHERE id = $1 AND is_active = true';
    const { rows } = await pool.query(query, [userId]);
    return rows[0] || null;
  }

  handleMessage(ws, message) {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'ping':
          this.sendToSocket(ws, { type: 'pong', timestamp: Date.now() });
          break;
        case 'subscribe':
          // Handle subscription to specific notification types
          this.handleSubscription(ws, data);
          break;
        default:
          console.log('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
      this.sendToSocket(ws, {
        type: 'error',
        message: 'Invalid message format'
      });
    }
  }

  handleDisconnection(ws) {
    if (ws.userId) {
      this.clients.delete(ws.userId);
      console.log(`❌ User ${ws.userId} disconnected from WebSocket`);
    }
  }

  // Send notification to specific user
  sendToUser(userId, notification) {
    const client = this.clients.get(userId);
    if (client && client.readyState === WebSocket.OPEN) {
      this.sendToSocket(client, notification);
    }
  }

  // Send notification to all connected users (for system-wide notifications)
  broadcast(notification) {
    this.clients.forEach((client, userId) => {
      if (client.readyState === WebSocket.OPEN) {
        this.sendToSocket(client, notification);
      }
    });
  }

  sendToSocket(ws, data) {
    try {
      ws.send(JSON.stringify(data));
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
    }
  }

  // Send appointment reminder via WebSocket
  sendAppointmentReminder(appointment) {
    const notification = {
      type: 'appointment_reminder',
      data: {
        appointmentId: appointment.id,
        doctorName: appointment.doctor_name,
        date: appointment.date,
        time: appointment.time,
        message: `Reminder: Appointment with ${appointment.doctor_name} in 1 hour`
      }
    };

    this.sendToUser(appointment.user_id, notification);
  }

  // Send prescription ready notification
  sendPrescriptionReady(prescription) {
    const notification = {
      type: 'prescription_ready',
      data: {
        prescriptionId: prescription.id,
        message: 'Your prescription is ready for pickup'
      }
    };

    this.sendToUser(prescription.user_id, notification);
  }

  // Send general notification
  sendNotification(userId, notificationData) {
    const notification = {
      type: 'new_notification',
      data: notificationData
    };

    this.sendToUser(userId, notification);
  }
}

module.exports = NotificationWebSocketServer;