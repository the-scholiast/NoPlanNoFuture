import express from 'express';
import { authenticateUser } from '../middleware/auth.js';
import { errorHandler } from '../middleware/errorHandler.js';
import { getGymStats } from '../controllers/statsGymController.js';

const router = express.Router();

// GET /stats - Get workout statistics
router.get('/', authenticateUser, async (req, res, next) => {
  try {
    const stats = await getGymStats(req.user.id);
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

router.use(errorHandler);

export default router;