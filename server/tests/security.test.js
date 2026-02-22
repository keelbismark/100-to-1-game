const security = require('../src/middlewares/security');
const logger = require('../src/utils/logger');

jest.mock('../src/utils/logger');

describe('Security Middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      setHeader: jest.fn()
    };
    mockNext = jest.fn();

    jest.clearAllMocks();
  });

  describe('securityHeaders', () => {
    it('should set security headers', () => {
      security.securityHeaders(mockReq, mockRes, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should set Content-Security-Policy header', () => {
      security.securityHeaders(mockReq, mockRes, mockNext);

      const cspCalls = mockRes.setHeader.mock.calls.find(call => call[0] === 'Content-Security-Policy');
      expect(cspCalls).toBeDefined();
      expect(cspCalls[1]).toContain('default-src');
      expect(cspCalls[1]).toContain("'self'");
    });

    it('should set X-Content-Type-Options header', () => {
      security.securityHeaders(mockReq, mockRes, mockNext);

      const xContentTypeOptions = mockRes.setHeader.mock.calls.find(
        call => call[0] === 'X-Content-Type-Options'
      );
      expect(xContentTypeOptions).toBeDefined();
      expect(xContentTypeOptions[1]).toBe('nosniff');
    });

    it('should set X-Frame-Options header', () => {
      security.securityHeaders(mockReq, mockRes, mockNext);

      const xFrameOptions = mockRes.setHeader.mock.calls.find(
        call => call[0] === 'X-Frame-Options'
      );
      expect(xFrameOptions).toBeDefined();
      expect(xFrameOptions[1]).toBe('DENY');
    });

    it('should set X-XSS-Protection header', () => {
      security.securityHeaders(mockReq, mockRes, mockNext);

      const xXssProtection = mockRes.setHeader.mock.calls.find(
        call => call[0] === 'X-XSS-Protection'
      );
      expect(xXssProtection).toBeDefined();
      expect(xXssProtection[1]).toBe('1; mode=block');
    });

    it('should set Strict-Transport-Security header in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      security.securityHeaders(mockReq, mockRes, mockNext);

      const hsts = mockRes.setHeader.mock.calls.find(
        call => call[0] === 'Strict-Transport-Security'
      );
      expect(hsts).toBeDefined();
      expect(hsts[1]).toContain('max-age=');

      process.env.NODE_ENV = originalEnv;
    });

    it('should allow style-src from inline', () => {
      security.securityHeaders(mockReq, mockRes, mockNext);

      const cspCalls = mockRes.setHeader.mock.calls.find(call => call[0] === 'Content-Security-Policy');
      expect(cspCalls[1]).toContain("style-src");
      expect(cspCalls[1]).toContain("'unsafe-inline'");
    });

    it('should allow img-src from data and https', () => {
      security.securityHeaders(mockReq, mockRes, mockNext);

      const cspCalls = mockRes.setHeader.mock.calls.find(call => call[0] === 'Content-Security-Policy');
      expect(cspCalls[1]).toContain("img-src");
      expect(cspCalls[1]).toContain('data:');
      expect(cspCalls[1]).toContain('https:');
    });

    it('should allow WebSocket connections', () => {
      security.securityHeaders(mockReq, mockRes, mockNext);

      const cspCalls = mockRes.setHeader.mock.calls.find(call => call[0] === 'Content-Security-Policy');
      expect(cspCalls[1]).toContain("connect-src");
      expect(cspCalls[1]).toContain('ws:');
      expect(cspCalls[1]).toContain('wss:');
    });

    it('should not fail when headers already set', () => {
      mockRes.setHeader.mockImplementation((name, value) => {
        throw new Error('Header already set');
      });

      expect(() => {
        security.securityHeaders(mockReq, mockRes, mockNext);
      }).not.toThrow();

      mockRes.setHeader.mockRestore();
    });
  });

  describe('socketSecurity', () => {
    let mockSocket;
    let mockNext;

    beforeEach(() => {
      mockNext = jest.fn();

      jest.clearAllMocks();
    });

    it('should allow connection in non-production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      mockSocket = {
        id: 'testSocket',
        handshake: {
          headers: {
            'user-agent': 'Test Agent',
            'x-forwarded-for': '127.0.0.1'
          },
          address: '127.0.0.1'
        }
      };

      security.socketSecurity(mockSocket, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(
        'New socket connection attempt',
        expect.objectContaining({
          ip: '127.0.0.1',
          userAgent: 'Test Agent'
        })
      );

      process.env.NODE_ENV = originalEnv;
    });

    it('should allow connection in production with valid referer', () => {
      const originalEnv = process.env.NODE_ENV;
      const originalClientUrl = process.env.CLIENT_URL;
      const originalProductionUrl = process.env.PRODUCTION_URL;

      process.env.NODE_ENV = 'production';
      process.env.CLIENT_URL = 'https://example.com';
      process.env.PRODUCTION_URL = 'https://prod.example.com';

      mockSocket = {
        id: 'testSocket',
        handshake: {
          headers: {
            'user-agent': 'Test Agent',
            referer: 'https://example.com/game/test'
          },
          address: '127.0.0.1'
        }
      };

      security.socketSecurity(mockSocket, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(
        'New socket connection attempt',
        expect.objectContaining({
          ip: '127.0.0.1',
          userAgent: 'Test Agent',
          referer: 'https://example.com/game/test'
        })
      );

      process.env.NODE_ENV = originalEnv;
      process.env.CLIENT_URL = originalClientUrl;
      process.env.PRODUCTION_URL = originalProductionUrl;
    });

    it('should reject connection in production without referer', () => {
      const originalEnv = process.env.NODE_ENV;
      const originalClientUrl = process.env.CLIENT_URL;
      const originalProductionUrl = process.env.PRODUCTION_URL;

      process.env.NODE_ENV = 'production';
      process.env.CLIENT_URL = 'https://example.com';
      process.env.PRODUCTION_URL = 'https://prod.example.com';

      mockSocket = {
        id: 'testSocket',
        handshake: {
          headers: {
            'user-agent': 'Test Agent'
          },
          address: '127.0.0.1'
        }
      };

      security.socketSecurity(mockSocket, mockNext);

      expect(mockNext).toHaveBeenCalledWith(new Error('Unauthorized'));
      expect(logger.warn).toHaveBeenCalledWith(
        'Unauthorized socket connection attempt',
        expect.objectContaining({
          ip: '127.0.0.1'
        })
      );

      process.env.NODE_ENV = originalEnv;
      process.env.CLIENT_URL = originalClientUrl;
      process.env.PRODUCTION_URL = originalProductionUrl;
    });

    it('should reject connection in production with invalid referer', () => {
      const originalEnv = process.env.NODE_ENV;
      const originalClientUrl = process.env.CLIENT_URL;
      const originalProductionUrl = process.env.PRODUCTION_URL;

      process.env.NODE_ENV = 'production';
      process.env.CLIENT_URL = 'https://example.com';
      process.env.PRODUCTION_URL = 'https://prod.example.com';

      mockSocket = {
        id: 'testSocket',
        handshake: {
          headers: {
            'user-agent': 'Test Agent',
            referer: 'https://malicious.com/attack'
          },
          address: '192.168.1.100'
        }
      };

      security.socketSecurity(mockSocket, mockNext);

      expect(mockNext).toHaveBeenCalledWith(new Error('Unauthorized'));
      expect(logger.warn).toHaveBeenCalledWith(
        'Unauthorized socket connection attempt',
        expect.objectContaining({
          ip: '192.168.1.100',
          referer: 'https://malicious.com/attack'
        })
      );

      process.env.NODE_ENV = originalEnv;
      process.env.CLIENT_URL = originalClientUrl;
      process.env.PRODUCTION_URL = originalProductionUrl;
    });

    it('should use x-forwarded-for header when available', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      mockSocket = {
        id: 'testSocket',
        handshake: {
          headers: {
            'user-agent': 'Test Agent',
            'x-forwarded-for': '203.0.113.1'
          },
          address: '127.0.0.1'
        }
      };

      security.socketSecurity(mockSocket, mockNext);

      expect(logger.info).toHaveBeenCalledWith(
        'New socket connection attempt',
        expect.objectContaining({
          ip: '203.0.113.1'
        })
      );

      process.env.NODE_ENV = originalEnv;
    });

    it('should handle missing referer in production gracefully', () => {
      const originalEnv = process.env.NODE_ENV;
      const originalClientUrl = process.env.CLIENT_URL;

      process.env.NODE_ENV = 'production';
      process.env.CLIENT_URL = 'https://example.com';

      mockSocket = {
        id: 'testSocket',
        handshake: {
          headers: {
            'user-agent': 'Test Agent'
          },
          address: '127.0.0.1'
        }
      };

      security.socketSecurity(mockSocket, mockNext);

      expect(mockNext).toHaveBeenCalledWith(new Error('Unauthorized'));

      process.env.NODE_ENV = originalEnv;
      process.env.CLIENT_URL = originalClientUrl;
    });

    it('should handle production environment with one allowed origin', () => {
      const originalEnv = process.env.NODE_ENV;
      const originalClientUrl = process.env.CLIENT_URL;

      process.env.NODE_ENV = 'production';
      process.env.CLIENT_URL = 'https://example.com';

      mockSocket = {
        id: 'testSocket',
        handshake: {
          headers: {
            'user-agent': 'Test Agent',
            referer: 'https://example.com/game/TEST1'
          },
          address: '127.0.0.1'
        }
      };

      security.socketSecurity(mockSocket, mockNext);

      expect(mockNext).toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
      process.env.CLIENT_URL = originalClientUrl;
    });

    it('should log user agent on connection attempt', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      mockSocket = {
        id: 'testSocket',
        handshake: {
          headers: {
            'user-agent': 'Mozilla/5.0 (Test Browser)'
          },
          address: '127.0.0.1'
        }
      };

      security.socketSecurity(mockSocket, mockNext);

      expect(logger.info).toHaveBeenCalledWith(
        'New socket connection attempt',
        expect.objectContaining({
          userAgent: 'Mozilla/5.0 (Test Browser)'
        })
      );

      process.env.NODE_ENV = originalEnv;
    });

    it('should allow connection from production URL', () => {
      const originalEnv = process.env.NODE_ENV;
      const originalClientUrl = process.env.CLIENT_URL;
      const originalProductionUrl = process.env.PRODUCTION_URL;

      process.env.NODE_ENV = 'production';
      process.env.CLIENT_URL = 'https://example.com';
      process.env.PRODUCTION_URL = 'https://prod.example.com';

      mockSocket = {
        id: 'testSocket',
        handshake: {
          headers: {
            'user-agent': 'Test Agent',
            referer: 'https://prod.example.com/game/TEST'
          },
          address: '127.0.0.1'
        }
      };

      security.socketSecurity(mockSocket, mockNext);

      expect(mockNext).toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
      process.env.CLIENT_URL = originalClientUrl;
      process.env.PRODUCTION_URL = originalProductionUrl;
    });
  });
});
