import express from 'express';
import { getTodosForDate, getUpcomingWeekTasks } from '../controllers/index.js';
import { authenticateUser } from '../middleware/auth.js';
import { ensureLocalDate, formatDateString, getTodayString } from '../utils/dateUtils.js';
import supabase from '../supabaseAdmin.js';

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