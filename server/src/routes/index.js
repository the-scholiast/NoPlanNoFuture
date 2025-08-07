import express from 'express';
import todoRoutes from './todos.js';
import profileRoutes from './profiles.js';
import workoutRoutes from './workouts.js';
import exerciseRoutes from './exercises.js';
import statsRoutes from './stats.js';
import workoutTemplatesRoutes from './workoutTemplates.js'
import recurringTodoRoutes from './recurringTodos.js';

const router = express.Router();

// Mount all route modules
router.use('/todos', todoRoutes);
router.use('/profile', profileRoutes);
router.use('/workouts', workoutRoutes);
router.use('/workout-templates', workoutTemplatesRoutes);
router.use('/exercises', exerciseRoutes);
router.use('/stats', statsRoutes);
router.use('/recurring-todos', recurringTodoRoutes);

export default router;