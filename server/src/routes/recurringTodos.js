import express from 'express';
import { getTodosForDate, getUpcomingWeekTasks } from '../controllers/index.js';
import { authenticateUser } from '../middleware/auth.js';
import { getTodayString } from '../utils/dateUtils.js';

const router = express.Router();

// Get upcoming week tasks (including recurring instances)
router.get('/upcoming-week', authenticateUser, async (req, res, next) => {
  try {
    const tasks = await getUpcomingWeekTasks(req.user.id);
    res.json(tasks);
  } catch (error) {
    next(error);
  }
});

// Get today's tasks (including recurring instances)
router.get('/today', authenticateUser, async (req, res, next) => {
  try {
    const today = getTodayString();
    const tasks = await getTodosForDate(req.user.id, today);
    res.json(tasks);
  } catch (error) {
    next(error);
  }
});

export default router;