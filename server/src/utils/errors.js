class GameError extends Error {
  constructor(message, code, statusCode = 500) {
    super(message);
    this.name = 'GameError';
    this.code = code;
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends GameError {
  constructor(message, details = []) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
    this.details = details;
  }
}

class NotFoundError extends GameError {
  constructor(resource, identifier) {
    const message = resource ? `${resource} not found: ${identifier}` : 'Resource not found';
    super(message, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
    this.resource = resource;
    this.identifier = identifier;
  }
}

class UnauthorizedError extends GameError {
  constructor(message = 'Unauthorized access') {
    super(message, 'UNAUTHORIZED', 401);
    this.name = 'UnauthorizedError';
  }
}

class ConflictError extends GameError {
  constructor(message) {
    super(message, 'CONFLICT', 409);
    this.name = 'ConflictError';
  }
}

class RateLimitError extends GameError {
  constructor(message = 'Rate limit exceeded') {
    super(message, 'RATE_LIMIT', 429);
    this.name = 'RateLimitError';
  }
}

class GameNotFoundError extends NotFoundError {
  constructor(roomId) {
    super('Game room', roomId);
    this.name = 'GameNotFoundError';
  }
}

class PlayerNotFoundError extends NotFoundError {
  constructor(playerId) {
    super('Player', playerId);
    this.name = 'PlayerNotFoundError';
  }
}

class InvalidMoveError extends GameError {
  constructor(message, details = {}) {
    super(message, 'INVALID_MOVE', 400);
    this.name = 'InvalidMoveError';
    this.details = details;
  }
}

function isGameError(error) {
  return error instanceof GameError;
}

function createGameError(error) {
  if (isGameError(error)) {
    return error;
  }

  if (error.name === 'ValidationError') {
    return new ValidationError(error.message, error.details);
  }

  if (error.name === 'NotFoundError') {
    return new NotFoundError(error.resource, error.identifier);
  }

  return new GameError(
    'An unexpected error occurred',
    'INTERNAL_ERROR',
    500
  );
}

module.exports = {
  GameError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ConflictError,
  RateLimitError,
  GameNotFoundError,
  PlayerNotFoundError,
  InvalidMoveError,
  isGameError,
  createGameError
};
