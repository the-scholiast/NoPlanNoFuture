import express from 'express';
import { authenticateUser } from '../middleware/auth.js';
import { errorHandler } from '../middleware/errorHandler.js';
import {
  getAllTodos,
  createTodo,
  updateTodo,
  deleteTodo,
  bulkDeleteTodos
} from '../controllers/todoController.js';

const router = express.Router();

// Endpoint fetches all todo items belonging to the currently authenticated user
router.get('/', authenticateUser, async (req, res, next) => {
  try {
    // Extract user ID from the authenticated user object (set by authenticateUser middleware)
    const todos = await getAllTodos(req.user.id);
    res.json(todos);
  } catch (error) {
    next(error); // Passes the error to error handling middleware
  }
});

// Endpoint creates a new todo for the authenticated user
router.post('/', authenticateUser, async (req, res, next) => {
  try {
    // Create new todo using authenticated user's ID and request body data
    const todo = await createTodo(req.user.id, req.body);

    // Return the created todo with 201 status (succesfully created a new resource)
    res.status(201).json(todo);
  } catch (error) {
    next(error); // Pass any errors to the error handling middleware
  }
});

// Endpoint allows partial updates to a todo item
router.patch('/:id', authenticateUser, async (req, res, next) => {
  try {
    // Update the todo using authenticated user's ID, todo ID from URL params, and update data from body
    const todo = await updateTodo(req.user.id, req.params.id, req.body);
    
    res.json(todo);
  } catch (error) {
    next(error); // Pass any errors to the error handling middleware
  }
});

// Endpoint deletes a todo item from the database
router.delete('/:id', authenticateUser, async (req, res, next) => {
  try {
    // Delete the todo using authenticated user's ID and todo ID from URL params
    const result = await deleteTodo(req.user.id, req.params.id);
    
    // Return success confirmation object { success: true }
    res.json(result);
  } catch (error) {
    // Pass any errors to the error handling middleware
    next(error);
  }
});

// Endpoint allows deletion of multiple todo items in a single request
router.post('/bulk-delete', authenticateUser, async (req, res, next) => {
  try {
    // Perform bulk deletion using authenticated user's ID and deletion criteria from request body
    const result = await bulkDeleteTodos(req.user.id, req.body);
    
    // Return bulk deletion results (success message and deletion count)
    res.json(result);
  } catch (error) {
    // Pass any errors (validation, unauthorized, database, etc.) to the error handling middleware
    next(error);
  }
});

// Apply error handling middleware to all routes in this router
router.use(errorHandler);

export default router;