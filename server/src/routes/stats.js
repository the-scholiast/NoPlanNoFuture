import express from 'express';
import { authenticateUser } from '../middleware/auth.js';
import { errorHandler } from '../middleware/errorHandler.js';
import { getStats } from '../controllers/statsController.js';

const router = express.Router();

// GET /stats - Get workout statistics
router.get('/', authenticateUser, async (req, res, next) => {
  try {
    const stats = await getStats(req.user.id);
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

router.use(errorHandler);

export default router;