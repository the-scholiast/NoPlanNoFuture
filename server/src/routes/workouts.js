import express from 'express';
import { authenticateUser } from '../middleware/auth.js';
import { errorHandler } from '../middleware/errorHandler.js';
import {
  getWorkoutTemplates,
  createWorkoutTemplate,
  updateWorkoutTemplate,
  deleteWorkoutTemplate,
  getWorkouts,
  getWorkoutById,
  createWorkout,
  updateWorkout,
  deleteWorkout
} from '../controllers/workoutController.js';

const router = express.Router();

// GET endpoint to retrieve workout templates for the authenticated user
router.get('/', authenticateUser, async (req, res, next) => {
  try {
    // Call the database function to fetch workout templates specific to the current user
    // req.user.id is populated by the authenticateUser middleware
    const templates = await getWorkoutTemplates(req.user.id);
    // Return the templates as JSON response
    res.json(templates);
  } catch (error) {
    // Pass any errors to Express error handling middleware
    next(error);
  }
});

// POST endpoint to create a new workout template for the authenticated user
router.post('/', authenticateUser, async (req, res, next) => {
  try {
    // Create a new workout template using the user's ID and the request body data
    // req.body contains the template data sent by the client
    const template = await createWorkoutTemplate(req.user.id, req.body);
    // Return the created template with 201 status (Created)
    res.status(201).json(template);
  } catch (error) {
    // Pass any errors to Express error handling middleware
    next(error);
  }
});

// PATCH endpoint to update an existing workout template for the authenticated user
router.patch('/:id', authenticateUser, async (req, res, next) => {
  try {
    // Update a specific workout template using:
    // - req.user.id: ensures user can only update their own templates
    // - req.params.id: the template ID from the URL parameter
    // - req.body: the fields to update
    const template = await updateWorkoutTemplate(req.user.id, req.params.id, req.body);
    // Return the updated template as JSON
    res.json(template);
  } catch (error) {
    // Pass any errors to Express error handling middleware
    next(error);
  }
});

// DELETE endpoint to remove a workout template for the authenticated user
router.delete('/:id', authenticateUser, async (req, res, next) => {
  try {
    // Delete a specific workout template using:
    // - req.user.id: ensures user can only delete their own templates
    // - req.params.id: the template ID from the URL parameter
    const result = await deleteWorkoutTemplate(req.user.id, req.params.id);
    // Return the deletion result (success message)
    res.json(result);
  } catch (error) {
    // Pass any errors to Express error handling middleware
    next(error);
  }
});

// Completed workouts routes

// GET endpoint to retrieve all completed workouts for the authenticated user
router.get('/', authenticateUser, async (req, res, next) => {
  try {
    // Fetch completed workouts with optional query parameters for filtering/pagination
    // req.query may contain filters
    const workouts = await getWorkouts(req.user.id, req.query);
    // Return the workouts as JSON response
    res.json(workouts);
  } catch (error) {
    // Pass any errors to Express error handling middleware
    next(error);
  }
});

// GET endpoint to retrieve a specific completed workout by ID
router.get('/:id', authenticateUser, async (req, res, next) => {
  try {
    // Fetch a single workout using:
    // - req.user.id: ensures user can only access their own workouts
    // - req.params.id: the workout ID from the URL parameter
    const workout = await getWorkoutById(req.user.id, req.params.id);
    // Return the specific workout as JSON
    res.json(workout);
  } catch (error) {
    // Pass any errors to Express error handling middleware
    next(error);
  }
});

// POST endpoint to create a new completed workout record
router.post('/', authenticateUser, async (req, res, next) => {
  try {
    // Create a new workout record using the user's ID and workout data
    // req.body contains workout details 
    const workout = await createWorkout(req.user.id, req.body);
    // Return the created workout with 201 status (Created)
    res.status(201).json(workout);
  } catch (error) {
    // Pass any errors to Express error handling middleware
    next(error);
  }
});

// PATCH endpoint to update an existing completed workout
router.patch('/:id', authenticateUser, async (req, res, next) => {
  try {
    // Update a specific workout using:
    // - req.user.id: ensures user can only update their own workouts
    // - req.params.id: the workout ID from the URL parameter
    // - req.body: the fields to update (partial update)
    const workout = await updateWorkout(req.user.id, req.params.id, req.body);
    // Return the updated workout as JSON
    res.json(workout);
  } catch (error) {
    // Pass any errors to Express error handling middleware
    next(error);
  }
});

// DELETE endpoint to remove a completed workout record
router.delete('/:id', authenticateUser, async (req, res, next) => {
  try {
    // Delete a specific workout using:
    // - req.user.id: ensures user can only delete their own workouts
    // - req.params.id: the workout ID from the URL parameter
    const result = await deleteWorkout(req.user.id, req.params.id);
    // Return the deletion result (success message)
    res.json(result);
  } catch (error) {
    // Pass any errors to Express error handling middleware
    next(error);
  }
});

// Apply error handling middleware to all routes
router.use(errorHandler);

export default router;