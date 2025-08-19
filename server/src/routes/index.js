import express from 'express';
import todoRoutes from './todos.js';
import profileRoutes from './profiles.js';
import workoutRoutes from './workouts.js';
import exerciseRoutes from './exercises.js';
import statsRoutes from './stats.js';
import workoutTemplatesRoutes from './workoutTemplates.js'
import recurringTodoRoutes from './recurringTodos.js';
import timetableRoutes from './timetable.js'
import notificationRoutes from './notifications.js'

const router = express.Router();

// Mount all route modules
router.use('/todos', todoRoutes);
router.use('/profile', profileRoutes);
router.use('/workouts', workoutRoutes);
router.use('/workout-templates', workoutTemplatesRoutes);
router.use('/exercises', exerciseRoutes);
router.use('/stats', statsRoutes);
router.use('/recurring-todos', recurringTodoRoutes);
router.use('/timetable', timetableRoutes);
router.use('/notifications', notificationRoutes);

export default router;