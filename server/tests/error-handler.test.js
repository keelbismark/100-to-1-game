const { errorHandler, socketErrorHandler, asyncHandler, notFoundHandler } = require('../src/middlewares/errorHandler');
const logger = require('../src/utils/logger');

jest.mock('../src/utils/logger');

describe('Error Handler Middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      path: '/test',
      method: 'GET'
    };
    mockRes = {
      status: jest.fn(() => mockRes),
      json: jest.fn()
    };
    mockNext = jest.fn();

    jest.clearAllMocks();
  });

  describe('errorHandler', () => {
    it('should handle error with status code', () => {
      const mockError = {
        status: 400,
        name: 'BadRequest',
        message: 'Bad Request'
      };

      errorHandler(mockError, mockReq, mockRes, mockNext);

      expect(logger.error).toHaveBeenCalledWith('Unhandled error', {
        message: 'Bad Request',
        stack: mockError.stack,
        path: '/test',
        method: 'GET'
      });

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'BadRequest',
        message: 'Bad Request'
      });
    });

    it('should handle error with statusCode', () => {
      const mockError = {
        statusCode: 404,
        name: 'NotFound',
        message: 'Not Found'
      };

      errorHandler(mockError, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'NotFound',
        message: 'Not Found'
      });
    });

    it('should handle error without status code - default 500', () => {
      const mockError = new Error('Internal Server Error');

      errorHandler(mockError, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Error',
          message: 'Internal Server Error'
        })
      );
    });

    it('should include stack trace in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const mockError = new Error('Test error');
      mockError.stack = 'Error: Test error\n    at test.js:10:1';

      errorHandler(mockError, mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          stack: mockError.stack
        })
      );

      process.env.NODE_ENV = originalEnv;
    });

    it('should not include stack trace in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const mockError = new Error('Test error');
      mockError.stack = 'Error: Test error\n    at test.js:10:1';

      errorHandler(mockError, mockReq, mockRes, mockNext);

      const response = mockRes.json.mock.calls[0][0];
      expect(response.stack).toBeUndefined();

      process.env.NODE_ENV = originalEnv;
    });

    it('should handle error without name', () => {
      const mockError = {
        message: 'Some error',
        status: 400
      };

      errorHandler(mockError, mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Error'
        })
      );
    });

    it('should handle error without message', () => {
      const mockError = {
        name: 'CustomError',
        status: 400
      };

      errorHandler(mockError, mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: undefined
        })
      );
    });

    it('should log error details', () => {
      const mockError = {
        message: 'Test error',
        stack: 'Test stack',
        status: 500
      };

      errorHandler(mockError, mockReq, mockRes, mockNext);

      expect(logger.error).toHaveBeenCalledWith('Unhandled error', {
        message: 'Test error',
        stack: 'Test stack',
        path: '/test',
        method: 'GET'
      });
    });
  });

  describe('socketErrorHandler', () => {
    it('should return error handler function', () => {
      const mockSocket = {
        id: 'testSocket',
        emit: jest.fn()
      };

      const handler = socketErrorHandler(mockSocket);

      expect(typeof handler).toBe('function');
    });

    it('should handle socket error and emit error event', () => {
      const mockSocket = {
        id: 'testSocket',
        emit: jest.fn()
      };

      const handler = socketErrorHandler(mockSocket);
      const mockError = new Error('Socket error');

      handler(mockError);

      expect(logger.error).toHaveBeenCalledWith('Socket error', {
        socketId: 'testSocket',
        message: 'Socket error',
        stack: mockError.stack
      });

      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        success: false,
        message: 'Socket error'
      });
    });

    it('should handle socket error without message', () => {
      const mockSocket = {
        id: 'testSocket',
        emit: jest.fn()
      };

      const handler = socketErrorHandler(mockSocket);
      const mockError = {};

      handler(mockError);

      expect(logger.error).toHaveBeenCalledWith('Socket error', {
        socketId: 'testSocket',
        message: undefined,
        stack: undefined
      });

      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        success: false,
        message: 'Произошла ошибка'
      });
    });

    it('should log socket error details', () => {
      const mockSocket = {
        id: 'socket456',
        emit: jest.fn()
      };

      const handler = socketErrorHandler(mockSocket);
      const mockError = {
        message: 'Connection lost',
        stack: 'Error line 1\nError line 2'
      };

      handler(mockError);

      expect(logger.error).toHaveBeenCalledWith('Socket error', {
        socketId: 'socket456',
        message: 'Connection lost',
        stack: 'Error line 1\nError line 2'
      });
    });

    it('should use default message when error has no message', () => {
      const mockSocket = {
        id: 'testSocket',
        emit: jest.fn()
      };

      const handler = socketErrorHandler(mockSocket);
      const mockError = {
        status: 500
      };

      handler(mockError);

      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        success: false,
        message: 'Произошла ошибка'
      });
    });
  });

  describe('asyncHandler', () => {
    it('should resolve async function successfully', async () => {
      const asyncFn = jest.fn().mockResolvedValue({ data: 'success' });

      const wrapped = asyncHandler(asyncFn);

      await wrapped(mockReq, mockRes, mockNext);

      expect(asyncFn).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should catch errors from async functions', async () => {
      const asyncFn = jest.fn().mockRejectedValue(new Error('Async error'));

      const wrapped = asyncHandler(asyncFn);

      await wrapped(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Async error'
        })
      );
    });

    it('should handle sync functions that return promises', async () => {
      const promiseFn = jest.fn(() => Promise.resolve({ data: 'done' }));

      const wrapped = asyncHandler(promiseFn);

      await wrapped(mockReq, mockRes, mockNext);

      expect(promiseFn).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should propagate errors thrown in async functions', async () => {
      const throwingAsyncFn = jest.fn(async () => {
        throw new Error('Thrown error');
      });

      const wrapped = asyncHandler(throwingAsyncFn);

      await wrapped(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Thrown error'
        })
      );
    });

    it('should handle functions that pass data through res.json', async () => {
      const responseFn = jest.fn(async (req, res) => {
        res.status(200).json({ success: true });
      });

      const wrapped = asyncHandler(responseFn);

      await wrapped(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true });
    });
  });

  describe('notFoundHandler', () => {
    it('should return 404 for unknown routes', () => {
      notFoundHandler(mockReq, mockRes);

      expect(logger.warn).toHaveBeenCalledWith('Route not found', {
        path: '/test',
        method: 'GET'
      });

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Not Found',
        message: 'Route GET /test not found'
      });
    });

    it('should include route information in message', () => {
      mockReq.path = '/api/users';
      mockReq.method = 'POST';

      notFoundHandler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Route POST /api/users not found'
        })
      );
    });

    it('should log warning with path and method', () => {
      mockReq.path = '/missing/route';
      mockReq.method = 'DELETE';

      notFoundHandler(mockReq, mockRes);

      expect(logger.warn).toHaveBeenCalledWith('Route not found', {
        path: '/missing/route',
        method: 'DELETE'
      });
    });

    it('should handle different HTTP methods', () => {
      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

      methods.forEach(method => {
        mockReq.method = method;
        notFoundHandler(mockReq, mockRes);

        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            message: `Route ${method} /test not found`
          })
        );
      });
    });
  });

  describe('Integration', () => {
    it('should handle async request with asyncHandler', async () => {
      const mockAsyncController = jest.fn(async () => {
        return { success: true };
      });

      const wrappedController = asyncHandler(mockAsyncController);

      await wrappedController(mockReq, mockRes, mockNext);

      expect(mockAsyncController).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle async request error with asyncHandler', async () => {
      const mockAsyncController = jest.fn(async () => {
        throw new Error('Controller error');
      });

      const wrappedController = asyncHandler(mockAsyncController);

      await wrappedController(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Controller error'
        })
      );
    });

    it('should route to notFoundHandler for unknown paths', () => {
      notFoundHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });
});
