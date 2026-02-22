const helmet = require('helmet');
const logger = require('../utils/logger');

const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'ws:', 'wss:']
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

const socketSecurity = (socket, next) => {
  const handshake = socket.handshake;
  const ip = handshake.headers['x-forwarded-for'] || handshake.address;

  logger.info('New socket connection attempt', {
    ip,
    userAgent: handshake.headers['user-agent'],
    referer: handshake.headers.referer
  });

  if (process.env.NODE_ENV === 'production') {
    const referer = handshake.headers.referer;
    const allowedOrigins = [
      process.env.CLIENT_URL,
      process.env.PRODUCTION_URL
    ].filter(Boolean);

    const isAllowed = allowedOrigins.some(origin => 
      referer && referer.includes(origin.replace(/https?:\/\//, ''))
    );

    if (!isAllowed) {
      logger.warn('Unauthorized socket connection attempt', {
        ip,
        referer,
        allowedOrigins
      });
      return next(new Error('Unauthorized'));
    }
  }

  next();
};

module.exports = {
  securityHeaders,
  socketSecurity
};
