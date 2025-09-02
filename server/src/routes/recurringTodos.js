import express from 'express';
import { getTodosForDate } from '../controllers/index.js';
import { authenticateUser } from '../middleware/auth.js';
import { getTasksMonth, getRecurringTaskInstances } from '../controllers/index.js';
import { ValidationError } from '../utils/errors.js';
import { localDateToUTC } from '../utils/dateUtils.js';

const router = express.Router();

// Get today's tasks (including recurring instances)
router.get('/today', authenticateUser, async (req, res, next) => {
  try {
    const today = req.query.date

    if (!today) {
      throw new ValidationError("date parameter is required to get today's tasks")
    }

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
      throw new ValidationError("Both year and month are required");
    }

    // Calculate first and last day of month as local date strings
    const startDateLocal = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
    const endDateLocal = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    // Convert to UTC noon timestamps for database queries
    const startDateUTC = localDateToUTC(startDateLocal);
    const endDateUTC = localDateToUTC(endDateLocal);

    const tasks = await getRecurringTaskInstances(req.user.id, startDateUTC, endDateUTC);

    // Also get non-recurring tasks for the month
    const regularTasks = await getTasksMonth(req.user.id, startDateUTC, endDateUTC);

    // Combine recurring instances and regular tasks
    const allTasks = [...tasks, ...(regularTasks || [])];

    res.json(allTasks);
  } catch (error) {
    next(error);
  }
});


export default router;