import express from 'express';
import { getTodosForDate, getUpcomingWeekTasks } from '../controllers/index.js';
import { authenticateUser } from '../middleware/auth.js';
import { getTodayString } from '../utils/dateUtils.js';
import { getTasksMonth, getRecurringTaskInstances } from '../controllers/index.js';

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
    const today = req.query.date;
    const tasks = await getTodosForDate(req.user.id, today);
    res.json(tasks);
  } catch (error) {
    next(error);
  }
});

// Get tasks for a month (including recurring instances)
router.get('/month', authenticateUser, async (req, res, next) => {
  try {
    const { year, month } = req.query;

    if (!year || !month) {
      return res.status(400).json({ error: 'Both year and month are required' });
    }

    // Calculate first and last day of month
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const tasks = await getRecurringTaskInstances(req.user.id, startDate, endDate);

    // Also get non-recurring tasks for the month
    const regularTasks = await getTasksMonth(req.user.id, startDate, endDate);

    // Combine recurring instances and regular tasks
    const allTasks = [...tasks, ...(regularTasks || [])];

    res.json(allTasks);
  } catch (error) {
    next(error);
  }
});


export default router;