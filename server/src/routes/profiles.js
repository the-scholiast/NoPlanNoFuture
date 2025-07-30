import express from 'express';
import { authenticateUser } from '../middleware/auth.js';
import { errorHandler } from '../middleware/errorHandler.js';
import { getProfile, updateProfile } from '../controllers/profileController.js';

const router = express.Router();

// Endpoint retrieves the profile information for the authenticated user
router.get('/profile', authenticateUser, async (req, res, next) => {
  try {
    // Retrieve profile data for the authenticated user
    const profile = await getProfile(req.user.id);
    // Return the profile information as JSON response
    res.json(profile);
  } catch (error) {
    // Pass any errors to the error handling middleware
    next(error);
  }
});

// Endpoint updates the profile information for the authenticated user
router.patch('/profile', authenticateUser, async (req, res, next) => {
  try {
    // Update the user's profile using their authenticated ID and the provided update data
    const profile = await updateProfile(req.user.id, req.body);
    // Return the updated profile object
    res.json(profile);
  } catch (error) {
    // Pass any errors (validation, not found, database, etc.) to the error handling middleware
    next(error);
  }
});

// Apply error handling middleware to all routes in this router
router.use(errorHandler);

export default router;