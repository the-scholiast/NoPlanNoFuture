import express from 'express';
import { authenticateUser } from '../middleware/auth.js';
import { errorHandler } from '../middleware/errorHandler.js';
import {
  createCalendarShare,
  getOwnedShares,
  getSharedWithMe,
  getSharedCalendarTasks,
  revokeCalendarShare,
  createEinkDevice,
  getEinkDevices,
  getEinkDeviceData,
  updateEinkDevice,
  deleteEinkDevice
} from '../controllers/calendarShareController.js';

const router = express.Router();

// Create a new calendar share
router.post('/', authenticateUser, async (req, res, next) => {
  try {
    const { email, expiresAt } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const share = await createCalendarShare(req.user.id, email, expiresAt);
    res.json(share);
  } catch (error) {
    next(error);
  }
});

// Get shares user owns (calendars shared with others)
router.get('/owned', authenticateUser, async (req, res, next) => {
  try {
    const shares = await getOwnedShares(req.user.id);
    res.json(shares);
  } catch (error) {
    next(error);
  }
});

// Get calendars shared with me
router.get('/shared-with-me', authenticateUser, async (req, res, next) => {
  try {
    const shares = await getSharedWithMe(req.user.id);
    res.json(shares);
  } catch (error) {
    next(error);
  }
});

// Get tasks from a shared calendar (public endpoint using share token)
router.get('/view/:shareToken', async (req, res, next) => {
  try {
    const { shareToken } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    const tasks = await getSharedCalendarTasks(shareToken, startDate, endDate);
    res.json(tasks);
  } catch (error) {
    next(error);
  }
});

// Revoke a calendar share
router.delete('/:shareId', authenticateUser, async (req, res, next) => {
  try {
    const share = await revokeCalendarShare(req.user.id, req.params.shareId);
    res.json(share);
  } catch (error) {
    next(error);
  }
});

// ===== E-INK DEVICE ROUTES =====

// Create e-ink device (JWT authenticated)
router.post('/devices', authenticateUser, async (req, res, next) => {
  try {
    const { deviceName } = req.body;
    
    if (!deviceName) {
      return res.status(400).json({ error: 'Device name is required' });
    }

    const device = await createEinkDevice(req.user.id, deviceName);
    res.status(201).json(device);
  } catch (error) {
    next(error);
  }
});

// Get user's e-ink devices (JWT authenticated)
router.get('/devices', authenticateUser, async (req, res, next) => {
  try {
    const devices = await getEinkDevices(req.user.id);
    res.json(devices);
  } catch (error) {
    next(error);
  }
});

// Update e-ink device (JWT authenticated) - for changing view_type and display_mode
router.patch('/devices/:id', authenticateUser, async (req, res, next) => {
  try {
    const device = await updateEinkDevice(req.user.id, req.params.id, req.body);
    res.json(device);
  } catch (error) {
    next(error);
  }
});

// Delete e-ink device (JWT authenticated)
router.delete('/devices/:id', authenticateUser, async (req, res, next) => {
  try {
    const device = await deleteEinkDevice(req.user.id, req.params.id);
    res.json(device);
  } catch (error) {
    next(error);
  }
});

// Get e-ink device data (PUBLIC endpoint - for Python)
// Use /devices/view/:deviceToken to avoid conflict with /view/:shareToken
router.get('/devices/view/:deviceToken', async (req, res, next) => {
  try {
    const { deviceToken } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    const data = await getEinkDeviceData(deviceToken, startDate, endDate);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.use(errorHandler);

export default router;