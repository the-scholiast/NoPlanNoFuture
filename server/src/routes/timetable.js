import express from 'express';
import { getScheduledTasksForDateRange, getScheduledTasksForWeek } from '../controllers/timetableController.js';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

// Get scheduled tasks for a date range
router.get('/tasks', authenticateUser, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const userId = req.user.id;

    if (!start_date || !end_date) {
      return res.status(400).json({ error: 'start_date and end_date are required' });
    }

    const tasks = await getScheduledTasksForDateRange(userId, start_date, end_date);
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching scheduled tasks:', error);
    res.status(500).json({ error: 'Failed to fetch scheduled tasks' });
  }
});

// Get scheduled tasks for a week (starting from Monday)
router.get('/week', authenticateUser, async (req, res) => {
  try {
    const { week_start } = req.query;
    const userId = req.user.id;

    if (!week_start) {
      return res.status(400).json({ error: 'week_start date is required' });
    }

    const tasks = await getScheduledTasksForWeek(userId, week_start);
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching week scheduled tasks:', error);
    res.status(500).json({ error: 'Failed to fetch week scheduled tasks' });
  }
});

export default router;