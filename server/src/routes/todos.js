import express from 'express';
import { authenticateUser } from '../middleware/auth.js';
import { errorHandler } from '../middleware/errorHandler.js';
import {
  getAllTodos,
  getIncompletedTodos,
  getCompletedTodos,
  createTodo,
  updateTodo,
  deleteTodo,
  softDeleteTodo,
  restoreTodo,
  getDeletedTodos,
  permanentlyDeleteOldTodos,
  getTaskById,
  getDailyTaskStats,
  resetDailyTasks,
  deleteCompletionByDate,
  getCompletionTasksByOriginalTask,
  createTodoCompletion,
  getUpcomingTodos,
  getCalendarTodos
} from '../controllers/index.js';

const router = express.Router();

// Endpoint fetches all todo items belonging to the currently authenticated user
router.get('/all', authenticateUser, async (req, res, next) => {
  try {
    const todos = await getAllTodos(req.user.id);
    res.json(todos);
  } catch (error) {
    next(error);
  }
});

// Endpoint fetches todos for calendar view
router.get('/calendar', authenticateUser, async (req, res, next) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const todos = await getCalendarTodos(req.user.id, year);
    res.json(todos);
  } catch (error) {
    next(error);
  }
});

// Endpoint fetches upcoming todos based on tomorrow's date
router.get('/upcoming', authenticateUser, async (req, res, next) => {
  try {
    const todos = await getUpcomingTodos(req.user.id);
    res.json(todos);
  } catch (error) {
    next(error);
  }
});

// Endpoint fetches all incomplete todo items
router.get('/incomplete', authenticateUser, async (req, res, next) => {
  try {
    const todos = await getIncompletedTodos(req.user.id);
    res.json(todos);
  } catch (error) {
    next(error);
  }
});

// Endpoint fetches all complete todo items (can filter by date range)
router.get('/complete', authenticateUser, async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const dateRange = startDate && endDate ? { start: startDate, end: endDate } : null;
    const todos = await getCompletedTodos(req.user.id, dateRange);
    res.json(todos);
  } catch (error) {
    next(error);
  }
});

// Endpoint fetches deleted todos (trash functionality)
router.get('/deleted', authenticateUser, async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const deletedTodos = await getDeletedTodos(req.user.id, limit);
    res.json(deletedTodos);
  } catch (error) {
    next(error);
  }
});

// Endpoint creates a new todo for the authenticated user
router.post('/', authenticateUser, async (req, res, next) => {
  try {
    const todo = await createTodo(req.user.id, req.body);
    res.status(201).json(todo);
  } catch (error) {
    next(error);
  }
});

// Create completion record
router.post('/completions', authenticateUser, async (req, res, next) => {
  try {
    const { task_id, instance_date } = req.body;
    const completion = await createTodoCompletion(req.user.id, task_id, instance_date);
    res.status(201).json(completion);
  } catch (error) {
    next(error);
  }
});

// Get completion records with associated task data (for CompletedTasks component)
router.get('/completions', authenticateUser, async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const result = await getCompletionTasksByOriginalTask(req.user.id, startDate, endDate)

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// ===== DAILY TASK SPECIFIC ROUTES =====

// Endpoint resets daily tasks for a new day
router.post('/daily/reset', authenticateUser, async (req, res, next) => {
  try {
    const resetTasks = await resetDailyTasks(req.user.id);
    res.json({
      message: `Reset ${resetTasks.length} daily tasks for new day`,
      resetCount: resetTasks.length,
      resetTasks
    });
  } catch (error) {
    next(error);
  }
});

// Endpoint fetches daily task completion statistics
router.get('/daily/stats', authenticateUser, async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const stats = await getDailyTaskStats(req.user.id, startDate, endDate);
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

// ===== BULK OPERATIONS =====

// Endpoint cleans up old deleted todos
router.delete('/cleanup/old', authenticateUser, async (req, res, next) => {
  try {
    const daysOld = parseInt(req.query.days) || 30;
    const deletedTodos = await permanentlyDeleteOldTodos(req.user.id, daysOld);
    res.json({
      message: `Permanently deleted ${deletedTodos.length} old todos`,
      deletedCount: deletedTodos.length,
      deletedTodos
    });
  } catch (error) {
    next(error);
  }
});

// ===== PARAMETERIZED ROUTES =====

// Endpoint gets a single todo by ID
router.get('/:id', authenticateUser, async (req, res, next) => {
  try {
    const data = await getTaskById(req.user.id, req.params.id)
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// Endpoint allows partial updates to a todo item
router.patch('/:id', authenticateUser, async (req, res, next) => {
  try {
    const todo = await updateTodo(req.user.id, req.params.id, req.body);
    res.json(todo);
  } catch (error) {
    next(error);
  }
});

// Endpoint restores a soft deleted todo
router.patch('/:id/restore', authenticateUser, async (req, res, next) => {
  try {
    const todo = await restoreTodo(req.user.id, req.params.id);
    res.json(todo);
  } catch (error) {
    next(error);
  }
});

// Endpoint soft deletes a task (moves to trash)
router.delete('/:id/soft-delete', authenticateUser, async (req, res, next) => {
  try {
    const todo = await softDeleteTodo(req.user.id, req.params.id);
    res.json(todo)
  } catch (error) {
    next(error);
  }
})

// Endpoint permanently deletes a single todo from trash
router.delete('/:id/permanent', authenticateUser, async (req, res, next) => {
  try {
    const result = await deleteTodo(req.user.id, req.params.id);

    if (!result.deletedTodo) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    res.json({ message: 'Todo permanently deleted', deletedTodo: result.deletedTodo });
  } catch (error) {
    next(error);
  }
});

// Delete completion by task and date
router.delete('/completions/task/:taskId/date/:instanceDate', authenticateUser, async (req, res, next) => {
  try {
    const { taskId, instanceDate } = req.params;

    if (!taskId || !instanceDate) {
      return res.status(400).json({ error: 'Task ID and instance date are required' });
    }

    // Delete the completion record for this task and date
    const result = await deleteCompletionByDate(req.user.id, taskId, instanceDate);

    res.status(200).json({ success: true, message: 'Completion deleted' });
  } catch (error) {
    next(error);
  }
});

// Apply error handling middleware to all routes in this router
router.use(errorHandler);

export default router;