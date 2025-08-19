import express from 'express';
import { authenticateUser } from '../middleware/auth.js';
import { errorHandler } from '../middleware/errorHandler.js';

const router = express.Router();


router.use(errorHandler);

export default router;