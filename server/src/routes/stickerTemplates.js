import express from 'express';
import { authenticateUser } from '../middleware/auth.js';
import {
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from '../controllers/stickerTemplateController.js';

const router = express.Router();

router.get('/', authenticateUser, async (req, res, next) => {
  try {
    const templates = await getTemplates(req.user.id);
    res.json(templates);
  } catch (err) {
    next(err);
  }
});

router.post('/', authenticateUser, async (req, res, next) => {
  try {
    const { emoji, name } = req.body || {};
    const template = await createTemplate(req.user.id, { emoji, name });
    res.status(201).json(template);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', authenticateUser, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { emoji, name } = req.body || {};
    const template = await updateTemplate(req.user.id, id, { emoji, name });
    res.json(template);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authenticateUser, async (req, res, next) => {
  try {
    const { id } = req.params;
    await deleteTemplate(req.user.id, id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
