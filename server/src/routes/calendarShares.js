import express from 'express';
import { authenticateUser } from '../middleware/auth.js';
import { errorHandler } from '../middleware/errorHandler.js';
import {
  createCalendarShare,
  getOwnedShares,
  getSharedWithMe,
  getSharedCalendarTasks,
  revokeCalendarShare
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

router.use(errorHandler);

export default router;