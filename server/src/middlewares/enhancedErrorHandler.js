const logger = require('../utils/logger');
const { isGameError, createGameError } = require('../utils/errors');

const errorHandler = (err, req, res, next) => {
  const error = createGameError(err);

  logger.error('Error occurred', {
    name: error.name,
    code: error.code,
    message: error.message,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });

  const isProduction = process.env.NODE_ENV === 'production';

  const errorResponse = {
    success: false,
    error: error.name,
    message: isProduction
      ? getSafeErrorMessage(error)
      : error.message,
    code: error.code,
    timestamp: new Date().toISOString(),
    requestId: req.id
  };

  if (!isProduction) {
    errorResponse.stack = error.stack;
    errorResponse.details = error.details;
  }

  const status = error.statusCode || 500;

  res.status(status).json(errorResponse);
};

const handleAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

const handleValidation = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        type: detail.type
      }));

      const validationError = new ValidationError(
        'Validation failed',
        details
      );

      return res.status(400).json({
        success: false,
        error: validationError.name,
        message: validationError.message,
        code: validationError.code,
        details,
        timestamp: new Date().toISOString()
      });
    }

    req.body = value;
    next();
  };
};

const socketErrorHandler = (socket) => {
  return (error) => {
    const gameError = createGameError(error);

    logger.error('Socket error', {
      socketId: socket.id,
      roomId: socket.data?.roomId,
      error: gameError.name,
      code: gameError.code,
      message: gameError.message,
      stack: gameError.stack
    });

    socket.emit('error', {
      success: false,
      error: gameError.name,
      message: getSafeErrorMessage(gameError),
      code: gameError.code,
      timestamp: new Date().toISOString()
    });
  };
};

const wrapSocketHandler = (handler) => {
  return async (socket, ...args) => {
    try {
      await handler(socket, ...args);
    } catch (error) {
      socketErrorHandler(socket)(error);
    }
  };
};

const notFoundHandler = (req, res) => {
  logger.warn('Route not found', {
    path: req.path,
    method: req.method,
    ip: req.ip
  });

  const notFoundError = new NotFoundError(
    'route',
    `${req.method} ${req.path}`
  );

  res.status(404).json({
    success: false,
    error: notFoundError.name,
    message: notFoundError.message,
    code: notFoundError.code,
    timestamp: new Date().toISOString()
  });
};

const methodNotAllowedHandler = (req, res) => {
  logger.warn('Method not allowed', {
    path: req.path,
    method: req.method,
    allowedMethods: req.route?.validMethods || []
  });

  res.status(405).json({
    success: false,
    error: 'MethodNotAllowed',
    message: `Method ${req.method} not allowed for ${req.path}`,
    timestamp: new Date().toISOString()
  });
};

function getSafeErrorMessage(error) {
  if (isGameError(error)) {
    return error.message;
  }

  return 'An unexpected error occurred. Please try again later.';
}

const sendSuccessResponse = (res, data, message = 'Success', status = 200) => {
  return res.status(status).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

const sendErrorResponse = (res, error, message) => {
  logger.error('API error', {
    error: error.message,
    stack: error.stack
  });

  const statusCode = error.statusCode || 500;
  const safeMessage = message || getSafeErrorMessage(error);

  return res.status(statusCode).json({
    success: false,
    error: error.name || 'Error',
    message: safeMessage,
    timestamp: new Date().toISOString()
  });
};

const validateRoomAccess = (socket, roomId) => {
  if (!roomId) {
    throw new ValidationError('Room ID is required');
  }

  if (!socket.data?.roomId) {
    throw new UnauthorizedError('You must join a room first');
  }

  if (socket.data.roomId !== roomId) {
    throw new UnauthorizedError('You are not authorized to access this room');
  }
};

const validateRole = (socket, allowedRoles) => {
  const role = socket.data?.role;

  if (!role) {
    throw new UnauthorizedError('Role not set');
  }

  if (!allowedRoles.includes(role)) {
    throw new UnauthorizedError(
      `Only ${allowedRoles.join(', ')} roles can perform this action`
    );
  }
};

module.exports = {
  errorHandler,
  handleAsync,
  handleValidation,
  socketErrorHandler,
  wrapSocketHandler,
  notFoundHandler,
  methodNotAllowedHandler,
  sendSuccessResponse,
  sendErrorResponse,
  validateRoomAccess,
  validateRole
};
