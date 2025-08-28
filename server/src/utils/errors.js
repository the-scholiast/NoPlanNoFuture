// Thrown when input validation fails (maps to HTTP 400)
export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Thrown when a requested resource cannot be found (maps to HTTP 404)
export class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
  }
}

// Thrown when business logic rules are violated (maps to HTTP 422)
export class BusinessRuleError extends Error {
  constructor(message) {
    super(message);
    this.name = 'BusinessRuleError';
  }
}