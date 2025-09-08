import express from 'express';
import { getTodosForDate } from '../controllers/index.js';
import { authenticateUser } from '../middleware/auth.js';
import { getUserDateString } from '../utils/dateUtils.js';
import { getTasksMonth, getRecurringTaskInstances } from '../controllers/index.js';
import {
  createOrUpdateTaskOverride,
  getTaskOverride,
  getTaskOverrides,
  deleteTaskOverride
} from '../controllers/index.js';

const router = express.Router();

// Get today's tasks 
router.get('/today', authenticateUser, async (req, res, next) => {
  try {
    const today = req.query.date || await getUserDateString(req.user.id, new Date());
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

// Get all overrides for a parent task
router.get('/:parentTaskId', authenticateUser, async (req, res, next) => {
  try {
    const { parentTaskId } = req.params;
    const overrides = await getTaskOverrides(req.user.id, parentTaskId);
    res.json(overrides);
  } catch (error) {
    next(error);
  }
});

// Get override for a specific task instance
router.get('/:parentTaskId/:instanceDate', authenticateUser, async (req, res, next) => {
  try {
    const { parentTaskId, instanceDate } = req.params;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(instanceDate)) {
      return res.status(400).json({
        error: 'Invalid instance date format. Use YYYY-MM-DD'
      });
    }

    const override = await getTaskOverride(req.user.id, parentTaskId, instanceDate);
    res.json(override);
  } catch (error) {
    next(error);
  }
});

// Create or update an override for a specific task instance
router.put('/:parentTaskId/:instanceData', authenticateUser, async (req, res, next) => {
  try {
    const { parentTaskId, instanceDate } = req.params;
    const overrideData = req.body;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(instanceDate)) {
      return res.status(400).json({
        error: 'Invalid instance date format. Use YYYY-MM-DD'
      });
    }

    const override = await createOrUpdateTaskOverride(
      req.user.id,
      parentTaskId,
      instanceDate,
      overrideData
    );

    res.json(override);
  } catch (error) {
    next(error);
  }
})

// Delete an override for a specific task instance
router.delete('/:parentTaskId/:instanceDate', authenticateUser, async (req, res, next) => {
  try {
    const { parentTaskId, instanceDate } = req.params;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(instanceDate)) {
      return res.status(400).json({
        error: 'Invalid instance date format. Use YYYY-MM-DD'
      });
    }

    await deleteTaskOverride(req.user.id, parentTaskId, instanceDate);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});



export default router;