const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error('Unhandled error', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  const isProduction = process.env.NODE_ENV === 'production';

  const errorResponse = {
    success: false,
    error: err.name || 'Error',
    message: err.message
  };

  if (!isProduction) {
    errorResponse.stack = err.stack;
  }

  const status = err.status || err.statusCode || 500;

  res.status(status).json(errorResponse);
};

const socketErrorHandler = (socket) => {
  return (error) => {
    logger.error('Socket error', {
      socketId: socket.id,
      message: error.message,
      stack: error.stack
    });

    socket.emit('error', {
      success: false,
      message: error.message || 'Произошла ошибка'
    });
  };
};

const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

const notFoundHandler = (req, res) => {
  logger.warn('Route not found', {
    path: req.path,
    method: req.method
  });

  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
};

module.exports = {
  errorHandler,
  socketErrorHandler,
  asyncHandler,
  notFoundHandler
};
