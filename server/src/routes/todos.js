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
  bulkDeleteTodos,
  // New functions
  softDeleteTodo,
  restoreTodo,
  getDeletedTodos,
  permanentlyDeleteOldTodos,
  deleteCompletedTodos,
  deleteAllTodos,
  getDailyTaskStats,
  resetDailyTasks,
  getCompletedDailyTasks
} from '../controllers/todoController.js';
import { supabase } from '../utils/supabase.js';

const router = express.Router();

// ===== IMPORTANT: SPECIFIC ROUTES MUST COME BEFORE PARAMETERIZED ROUTES =====

// Base route - for backward compatibility with /api/todos
router.get('/', authenticateUser, async (req, res, next) => {
  try {
    const todos = await getAllTodos(req.user.id);
    res.json(todos);
  } catch (error) {
    next(error);
  }
});

// Endpoint fetches all todo items belonging to the currently authenticated user
router.get('/all', authenticateUser, async (req, res, next) => {
  try {
    const todos = await getAllTodos(req.user.id);
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

// ===== DAILY TASK SPECIFIC ROUTES =====

// Endpoint fetches completed daily tasks
router.get('/daily/completed', authenticateUser, async (req, res, next) => {
  try {
    const completedDailyTasks = await getCompletedDailyTasks(req.user.id);
    res.json(completedDailyTasks);
  } catch (error) {
    next(error);
  }
});

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

// Endpoint allows deletion of multiple todo items in a single request
router.post('/bulk-delete', authenticateUser, async (req, res, next) => {
  try {
    const result = await bulkDeleteTodos(req.user.id, req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Endpoint soft deletes all completed tasks from a specific section
router.delete('/section/:section/completed', authenticateUser, async (req, res, next) => {
  try {
    const section = req.params.section;
    const todos = await deleteCompletedTodos(req.user.id, section);
    res.json({
      message: `Moved ${todos.length} completed ${section} tasks to trash`,
      deletedCount: todos.length,
      deletedTodos: todos
    });
  } catch (error) {
    next(error);
  }
});

// Endpoint soft deletes all tasks from a specific section
router.delete('/section/:section/all', authenticateUser, async (req, res, next) => {
  try {
    const section = req.params.section;
    const todos = await deleteAllTodos(req.user.id, section);
    res.json({
      message: `Moved ${todos.length} ${section} tasks to trash`,
      deletedCount: todos.length,
      deletedTodos: todos
    });
  } catch (error) {
    next(error);
  }
});

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

// Create completion record
router.post('/completions', authenticateUser, async (req, res, next) => {
  try {
    const { task_id, instance_date } = req.body;

    if (!task_id || !instance_date) {
      return res.status(400).json({ error: 'Task ID and instance date are required' });
    }

    // Create the completion record
    const { data, error } = await supabase
      .from('todo_completions')
      .insert({
        user_id: req.user.id,
        task_id: task_id,
        instance_date: instance_date,
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating completion:', error);
      return res.status(500).json({ error: 'Failed to create completion' });
    }

    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

// ===== PARAMETERIZED ROUTES (MUST COME LAST) =====

// Endpoint gets a single todo by ID
router.get('/:id', authenticateUser, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Todo not found' });

    // Filter out deleted tasks if column exists
    if (data.hasOwnProperty('deleted_at') && data.deleted_at !== null) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    res.json(data);
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

// Endpoint soft deletes a todo item (moves to trash)
router.delete('/:id', authenticateUser, async (req, res, next) => {
  try {
    // Use soft delete if available, otherwise fall back to hard delete
    try {
      const todo = await softDeleteTodo(req.user.id, req.params.id);
      res.json(todo);
    } catch (softDeleteError) {
      // If soft delete isn't available, use regular delete
      if (softDeleteError.message.includes('requires database migration')) {
        const result = await deleteTodo(req.user.id, req.params.id);
        res.json(result);
      } else {
        throw softDeleteError;
      }
    }
  } catch (error) {
    next(error);
  }
});

// Endpoint permanently deletes a single todo from trash
router.delete('/:id/permanent', authenticateUser, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('todos')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Todo not found' });

    res.json({ message: 'Todo permanently deleted', deletedTodo: data });
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
    const { error } = await supabase
      .from('todo_completions')
      .delete()
      .eq('task_id', taskId)
      .eq('instance_date', instanceDate)
      .eq('user_id', req.user.id);

    if (error) {
      console.error('Error deleting completion:', error);
      return res.status(500).json({ error: 'Failed to delete completion' });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Apply error handling middleware to all routes in this router
router.use(errorHandler);

export default router;