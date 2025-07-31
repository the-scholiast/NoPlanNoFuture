import express from 'express';
import { authenticateUser } from '../middleware/auth.js';
import { errorHandler } from '../middleware/errorHandler.js';
import { getExercises, createExercise } from '../controllers/exerciseController.js'

const router = express.Router();

// GET /exercises - Retrieves exercises with optional search functionality
router.get('/', authenticateUser, async (req, res, next) => {
  try {
    // Get exercises with optional search filtering from query parameters
    const exercises = await getExercises(req.query.search);
    // Return exercises array as JSON response
    res.json(exercises);
  } catch (error) {
    // Pass any errors to the error handling middleware
    next(error);
  }
});

// POST /exercises - Creates a new custom exercise for the authenticated user
router.post('/', authenticateUser, async (req, res, next) => {
  try {
    // Create custom exercise using authenticated user's ID and request body data
    const exercise = await createExercise(req.user.id, req.body);
    // Return the created exercise with 201 status (Created)
    res.status(201).json(exercise);
  } catch (error) {
    // Pass any errors (validation, database, etc.) to the error handling middleware
    next(error);
  }
})

router.use(errorHandler);

export default router;