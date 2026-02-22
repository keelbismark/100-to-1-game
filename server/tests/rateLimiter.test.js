const rateLimit = require('express-rate-limit');
const logger = require('../src/utils/logger');

jest.mock('../src/utils/logger');
jest.mock('express-rate-limit');

describe('Rate Limiter Middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;
  let rateLimiterConfig;

  beforeEach(() => {
    mockReq = {
      ip: '127.0.0.1',
      path: '/api/test',
      method: 'GET'
    };

    mockRes = {
      status: jest.fn(() => mockRes),
      json: jest.fn()
    };

    mockNext = jest.fn();

    jest.clearAllMocks();

    rateLimitConfig = {
      windowMs: 15 * 60 * 1000,
      max: 100,
      message: {
        success: false,
        error: 'Too many requests',
        message: 'Too many requests from this IP, please try again after 900 seconds'
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: expect.any(Function),
      skip: expect.any(Function)
    };

    rateLimit.mockReturnValue(() => {
      return jest.fn((req, res, next) => next());
    });
  });

  describe('Express Rate Limit Configuration', () => {
    it('should call express-rate-limit with correct config', () => {
      require('../src/middlewares/rateLimiter');

      expect(rateLimit).toHaveBeenCalledWith(
        expect.objectContaining({
          windowMs: expect.any(Number),
          max: expect.any(Number),
          message: expect.objectContaining({
            success: false,
            error: 'Too many requests'
          }),
          standardHeaders: true,
          legacyHeaders: false,
          handler: expect.any(Function),
          skip: expect.any(Function)
        })
      );
    });

    it('should enable standard headers', () => {
      require('../src/middlewares/rateLimiter');

      expect(rateLimit).toHaveBeenCalledWith(
        expect.objectContaining({
          standardHeaders: true
        })
      );
    });

    it('should disable legacy headers', () => {
      require('../src/middlewares/rateLimiter');

      expect(rateLimit).toHaveBeenCalledWith(
        expect.objectContaining({
          legacyHeaders: false
        })
      );
    });

    it('should have proper error message', () => {
      require('../src/middlewares/rateLimiter');

      const call = rateLimit.mock.calls[0];
      const message = call[0].message;

      expect(message).toMatchObject({
        success: false,
        error: 'Too many requests',
        message: expect.stringContaining('Too many requests from this IP')
      });
    });
  });

  describe('Skip Function', () => {
    it('should have skip function that works', () => {
      require('../src/middlewares/rateLimiter');

      const call = rateLimit.mock.calls[0];
      const skipFn = call[0].skip;

      expect(typeof skipFn).toBe('function');
    });

    it('should skip WebSocket requests', () => {
      require('../src/middlewares/rateLimiter');

      const call = rateLimit.mock.calls[0];
      const skipFn = call[0].skip;

      const socketIoReq = { path: '/socket.io/' };
      expect(skipFn(socketIoReq)).toBe(true);
    });

    it('should not skip regular API requests', () => {
      require('../src/middlewares/rateLimiter');

      const call = rateLimit.mock.calls[0];
      const skipFn = call[0].skip;

      const apiReq = { path: '/api/test' };
      expect(skipFn(apiReq)).toBe(false);
    });

    it('should skip Socket.IO namespace paths', () => {
      require('../src/middlewares/rateLimiter');

      const call = rateLimit.mock.calls[0];
      const skipFn = call[0].skip;

      const socketIoNamespace = { path: '/socket.io/test' };
      expect(skipFn(socketIoNamespace)).toBe(true);
    });
  });

  describe('Handler Function', () => {
    it('should have handler function', () => {
      require('../src/middlewares/rateLimiter');

      const call = rateLimit.mock.calls[0];
      const handlerFn = call[0].handler;

      expect(typeof handlerFn).toBe('function');
    });

    it('should log rate limit warning when called', () => {
      require('../src/middlewares/rateLimiter');

      const call = rateLimit.mock.calls[0];
      const handlerFn = call[0].handler;

      handlerFn(mockReq, mockRes);

      expect(logger.warn).toHaveBeenCalledWith('Rate limit exceeded', {
        ip: mockReq.ip,
        path: mockReq.path
      });
    });

    it('should return 429 status', () => {
      require('../src/middlewares/rateLimiter');

      const call = rateLimit.mock.calls[0];
      const handlerFn = call[0].handler;

      handlerFn(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(429);
    });

    it('should return JSON error response', () => {
      require('../src/middlewares/rateLimiter');

      const call = rateLimit.mock.calls[0];
      const handlerFn = call[0].handler;

      handlerFn(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Too many requests',
        message: 'Too many requests from this IP'
      });
    });
  });

  describe('Integration', () => {
    it('should be exportable', () => {
      const rateLimiterModule = require('../src/middlewares/rateLimiter');

      expect(rateLimiterModule).toBeDefined();
    });
  });
});
