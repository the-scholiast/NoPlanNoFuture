import express from 'express';
import { verifyToken } from '../supabaseAdmin.js';
import {
  getNotifications,
  createNotification,
  updateNotification,
  deleteNotification,
  testNotification,
  getNotificationPreview
} from '../controllers/notificationController.js';

const router = express.Router();

// Middleware to verify authentication
const authenticateUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const user = await verifyToken(token);
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Apply authentication middleware to all routes
router.use(authenticateUser);

// GET /api/notifications - Get all notifications for user
router.get('/', async (req, res) => {
  try {
    const notifications = await getNotifications(req.user.id);
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// POST /api/notifications - Create new notification
router.post('/', async (req, res) => {
  try {
    const notification = await createNotification(req.user.id, req.body);
    res.status(201).json(notification);
  } catch (error) {
    console.error('Error creating notification:', error);
    if (error.name === 'ValidationError') {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to create notification' });
    }
  }
});

// PATCH /api/notifications/:id - Update notification
router.patch('/:id', async (req, res) => {
  try {
    const notification = await updateNotification(req.user.id, req.params.id, req.body);
    res.json(notification);
  } catch (error) {
    console.error('Error updating notification:', error);
    if (error.name === 'ValidationError') {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to update notification' });
    }
  }
});

// DELETE /api/notifications/:id - Delete notification
router.delete('/:id', async (req, res) => {
  try {
    await deleteNotification(req.user.id, req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// POST /api/notifications/:id/test - Test notification (send immediately)
router.post('/:id/test', async (req, res) => {
  try {
    const result = await testNotification(req.user.id, req.params.id);
    res.json(result);
  } catch (error) {
    console.error('Error testing notification:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/notifications/preview - Get preview of tasks that would be sent
router.post('/preview', async (req, res) => {
  try {
    const preview = await getNotificationPreview(req.user.id, req.body);
    res.json(preview);
  } catch (error) {
    console.error('Error getting notification preview:', error);
    res.status(500).json({ error: 'Failed to get preview' });
  }
});

export default router;
