const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');
const config = require('../config/config');

const rateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    success: false,
    error: 'Too many requests',
    message: `Too many requests from this IP, please try again after ${config.rateLimit.windowMs / 1000} seconds`
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path
    });
    res.status(429).json({
      success: false,
      error: 'Too many requests',
      message: 'Too many requests from this IP'
    });
  },
  skip: (req) => {
    return req.path.startsWith('/socket.io/');
  }
});

module.exports = rateLimiter;
