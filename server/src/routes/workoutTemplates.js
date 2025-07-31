import express from 'express';
import { authenticateUser } from '../middleware/auth.js';
import { errorHandler } from '../middleware/errorHandler.js';
import {
  getWorkoutTemplates,
  createWorkoutTemplate,
  updateWorkoutTemplate,
  deleteWorkoutTemplate,
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

router.use(errorHandler);

export default router;