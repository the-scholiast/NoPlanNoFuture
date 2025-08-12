import express from 'express';
import { getTodosForDate, getRecurringTaskInstances, updateRecurringDays, getUpcomingWeekTasks } from '../controllers/todoController.js';
import { authenticateUser } from '../middleware/auth.js';
import { ensureLocalDate, formatDateString, getTodayString } from '../utils/dateUtils.js';
import supabase from '../supabaseAdmin.js';

const router = express.Router();

// Get tasks for a specific date (including recurring instances)
router.get('/date/:date', authenticateUser, async (req, res, next) => {
  try {
    const { date } = req.params;

    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        error: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    const tasks = await getTodosForDate(req.user.id, date);
    res.json(tasks);
  } catch (error) {
    next(error);
  }
});

// Get recurring task instances for a date range
router.get('/instances', authenticateUser, async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'Both start date and end date are required'
      });
    }

    // Validate date formats
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      return res.status(400).json({
        error: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    const instances = await getRecurringTaskInstances(req.user.id, startDate, endDate);
    res.json(instances);
  } catch (error) {
    next(error);
  }
});

// Update recurring days for a task
router.patch('/:id/recurring-days', authenticateUser, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { recurringDays } = req.body;

    if (!Array.isArray(recurringDays)) {
      return res.status(400).json({
        error: 'recurringDays must be an array'
      });
    }

    const validDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

    // Validate day names
    const invalidDays = recurringDays.filter(day =>
      !validDays.includes(day.toLowerCase())
    );

    if (invalidDays.length > 0) {
      return res.status(400).json({
        error: `Invalid day names: ${invalidDays.join(', ')}. Valid days: ${validDays.join(', ')}`
      });
    }

    const updatedTask = await updateRecurringDays(id, req.user.id, recurringDays);
    res.json(updatedTask);
  } catch (error) {
    next(error);
  }
});

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

// Bulk create recurring task instances
router.post('/generate-instances', authenticateUser, async (req, res, next) => {
  try {
    const { taskId, startDate, endDate } = req.body;

    if (!taskId || !startDate || !endDate) {
      return res.status(400).json({
        error: 'taskId, startDate, and endDate are required'
      });
    }

    const instances = await getRecurringTaskInstances(req.user.id, startDate, endDate);
    const taskInstances = instances.filter(instance =>
      instance.parent_task_id === taskId || instance.id.startsWith(taskId + '_')
    );

    res.json(taskInstances);
  } catch (error) {
    next(error);
  }
});

// Get recurring pattern statistics
router.get('/stats/:id', authenticateUser, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    // Get task details
    const { data: task, error: taskError } = await supabase
      .from('todos')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (taskError || !task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (!task.is_recurring) {
      return res.status(400).json({ error: 'Task is not recurring' });
    }

    // Calculate statistics
    const start = startDate ? ensureLocalDate(startDate) : new Date(task.created_at);
    const end = endDate ? ensureLocalDate(endDate) : new Date();

    let totalPossibleOccurrences = 0;
    let completedOccurrences = task.completion_count || 0;

    // Count possible occurrences in date range
    const currentDate = new Date(start);
    while (currentDate <= end) {
      const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][currentDate.getDay()];

      if (task.recurring_days && task.recurring_days.includes(dayName)) {
        // Check if within task's date range
        if ((!task.start_date || currentDate >= ensureLocalDate(task.start_date)) &&
          (!task.end_date || currentDate <= ensureLocalDate(task.end_date))) {
          totalPossibleOccurrences++;
        }
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const completionRate = totalPossibleOccurrences > 0
      ? Math.min((completedOccurrences / totalPossibleOccurrences) * 100, 100)
      : 0;

    res.json({
      taskId: id,
      taskTitle: task.title,
      recurringDays: task.recurring_days,
      dateRange: {
        start: startDate || formatDateString(task.created_at),
        end: endDate || getTodayString()
      },
      statistics: {
        totalPossibleOccurrences,
        completedOccurrences,
        completionRate: Math.round(completionRate * 100) / 100,
        averagePerWeek: totalPossibleOccurrences > 0
          ? Math.round((completedOccurrences / totalPossibleOccurrences) * task.recurring_days.length * 100) / 100
          : 0
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;