import express from 'express';
import { authenticateUser } from '../middleware/auth.js';
import {
  getMonthStickers,
  createSticker,
  updateSticker,
  deleteSticker,
} from '../controllers/dayStickerController.js';

const router = express.Router();

router.get('/month', authenticateUser, async (req, res, next) => {
  try {
    const { year, month } = req.query;
    if (!year || !month) {
      return res.status(400).json({ error: 'year and month are required' });
    }
    const stickers = await getMonthStickers(
      req.user.id,
      parseInt(year, 10),
      parseInt(month, 10)
    );
    res.json(stickers);
  } catch (err) {
    next(err);
  }
});

router.post('/', authenticateUser, async (req, res, next) => {
  try {
    const { date, emoji, name } = req.body || {};
    if (!date) {
      return res.status(400).json({ error: 'date is required' });
    }
    const sticker = await createSticker(req.user.id, date, { emoji, name });
    res.status(201).json(sticker);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', authenticateUser, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { emoji, name } = req.body || {};
    const sticker = await updateSticker(req.user.id, id, { emoji, name });
    res.json(sticker);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authenticateUser, async (req, res, next) => {
  try {
    const { id } = req.params;
    await deleteSticker(req.user.id, id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
