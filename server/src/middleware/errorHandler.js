import { ValidationError, NotFoundError, BusinessRuleError } from '../utils/errors.js';

export const errorHandler = (error, req, res, next) => {
  console.error('Error:', error);

  if (error instanceof ValidationError) {
    return res.status(400).json({ error: error.message });
  }

  if (error instanceof NotFoundError) {
    return res.status(404).json({ error: error.message });
  }

  if (error instanceof BusinessRuleError) {
    return res.status(422).json({ error: error.message });
  }

  res.status(500).json({ error: 'Internal server error' });
};