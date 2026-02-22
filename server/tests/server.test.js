const request = require('supertest');
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const roomService = require('../src/services/room.service');
const logger = require('../src/utils/logger');

jest.mock('../src/utils/logger');
jest.mock('../src/services/room.service');

describe('Server Tests', () => {
  let app;
  let server;
  let io;
  let testPort;

  beforeAll(() => {
    app = express();
    server = http.createServer(app);

    io = new Server(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });

    // Setup routes like server.js does
    app.get('/health', (req, res) => {
      const stats = roomService.getStats();
      res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: 'test',
        version: '1.1.0',
        stats
      });
    });

    app.get('/api/stats', (req, res) => {
      try {
        const stats = roomService.getStats();
        res.status(200).json({
          success: true,
          data: stats
        });
      } catch (error) {
        logger.error('Error getting stats', { error: error.message });
        res.status(500).json({
          success: false,
          error: 'Failed to get stats'
        });
      }
    });

    // 404 handler
    app.use((req, res) => {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`
      });
    });

    return new Promise((resolve) => {
      server.listen(0, () => {
        testPort = server.address().port;
        io.on('connection', (socket) => {
          logger.info('New socket connection', {
            socketId: socket.id,
            ip: socket.handshake.address
          });

          socket.on('create_room', (data) => {
            const roomController = require('../src/controllers/room.controller');
            roomController.createRoom(socket, data);
          });

          socket.on('join_room', (data) => {
            const roomController = require('../src/controllers/room.controller');
            roomController.joinRoom(socket, io, data);
          });

          socket.on('disconnect', () => {
            logger.info('Socket disconnected', { socketId: socket.id });
          });

          socket.use((error, next) => {
            const errorHandler = require('../src/middlewares/errorHandler');
            errorHandler.socketErrorHandler(socket)(error);
          });
        });
        resolve();
      });
    });
  });

  afterAll((done) => {
    io.close(() => {
      server.close(() => {
        done();
      });
    });
  });

  describe('HTTP Endpoints', () => {
    describe('GET /health', () => {
      it('should return health status with correct structure', async () => {
        roomService.getStats.mockReturnValue({
          totalRooms: 5,
          totalPlayers: 20,
          activeRooms: 3
        });

        const response = await request(app).get('/health');

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
          status: 'ok',
          timestamp: expect.any(String),
          uptime: expect.any(Number),
          environment: 'test',
          version: '1.1.0',
          stats: {
            totalRooms: 5,
            totalPlayers: 20,
            activeRooms: 3
          }
        });
      });

      it('should call roomService.getStats', async () => {
        await request(app).get('/health');

        expect(roomService.getStats).toHaveBeenCalled();
      });

      it('should handle errors in stats gracefully', async () => {
        roomService.getStats.mockImplementation(() => {
          throw new Error('Service error');
        });

        const response = await request(app).get('/health');

        expect(response.status).toBe(200);
      });
    });

    describe('GET /api/stats', () => {
      it('should return stats with success flag', async () => {
        roomService.getStats.mockReturnValue({
          totalRooms: 10,
          totalPlayers: 50,
          roomsByRound: { simple: 5, double: 3, triple: 2 },
          activeRooms: 8
        });

        const response = await request(app).get('/api/stats');

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
          success: true,
          data: {
            totalRooms: 10,
            totalPlayers: 50,
            roomsByRound: { simple: 5, double: 3, triple: 2 },
            activeRooms: 8
          }
        });
      });

      it('should return 500 when roomService throws error', async () => {
        roomService.getStats.mockImplementation(() => {
          throw new Error('Service unavailable');
        });

        const response = await request(app).get('/api/stats');

        expect(response.status).toBe(500);
        expect(response.body).toEqual({
          success: false,
          error: 'Failed to get stats'
        });
      });

      it('should log error when getStats fails', async () => {
        roomService.getStats.mockImplementation(() => {
          throw new Error('Service unavailable');
        });

        await request(app).get('/api/stats');

        expect(logger.error).toHaveBeenCalledWith(
          'Error getting stats',
          { error: 'Service unavailable' }
        );
      });
    });

    describe('404 Handler', () => {
      it('should return 404 for non-existent routes', async () => {
        const response = await request(app).get('/nonexistent');

        expect(response.status).toBe(404);
        expect(response.body).toMatchObject({
          success: false,
          error: 'Not Found'
        });
      });

      it('should include route information in 404', async () => {
        const response = await request(app).get('/api/nonexistent/route');

        expect(response.body.message).toContain('GET');
        expect(response.body.message).toContain('/api/nonexistent/route');
      });

      it('should handle POST to non-existent routes', async () => {
        const response = await request(app)
          .post('/api/unknown')
          .send({ data: 'test' });

        expect(response.status).toBe(404);
      });

      it('should handle PUT to non-existent routes', async () => {
        const response = await request(app)
          .put('/api/update')
          .send({ value: 123 });

        expect(response.status).toBe(404);
      });

      it('should handle DELETE to non-existent routes', async () => {
        const response = await request(app).delete('/api/delete/123');

        expect(response.status).toBe(404);
      });
    });
  });

  describe('Socket.io Configuration', () => {
    it('should have Socket.io instance initialized', () => {
      expect(io).toBeDefined();
      expect(io.sockets).toBeDefined();
    });

    it('should have CORS configured', () => {
      expect(io.opts.cors).toBeDefined();
      expect(io.opts.cors.origin).toBe('*');
    });

    it('should have proper ping configuration', () => {
      expect(io.opts.pingTimeout).toBe(30000);
      expect(io.opts.pingInterval).toBe(25000);
    });

    it('should have maxHttpBufferSize configured', () => {
      expect(io.opts.maxHttpBufferSize).toBe(1e6);
    });
  });

  describe('Socket.io Connections', () => {
    it('should accept new socket connections', (done) => {
      const socketIoClient = require('socket.io-client');

      const clientSocket = socketIoClient(`http://localhost:${testPort}`);

      clientSocket.on('connect', () => {
        expect(clientSocket.connected).toBe(true);
        expect(logger.info).toHaveBeenCalledWith(
          'New socket connection',
          expect.objectContaining({
            socketId: expect.any(String)
          })
        );
        clientSocket.disconnect();
        done();
      });

      clientSocket.on('connect_error', (error) => {
        done(error);
      });
    });

    it('should disconnect socket on explicit disconnect', (done) => {
      const socketIoClient = require('socket.io-client');

      const clientSocket = socketIoClient(`http://localhost:${testPort}`);

      clientSocket.on('connect', () => {
        clientSocket.disconnect();
      });

      clientSocket.on('disconnect', () => {
        expect(logger.info).toHaveBeenCalledWith(
          'Socket disconnected',
          expect.objectContaining({
            socketId: expect.any(String)
          })
        );
        done();
      });

      clientSocket.on('connect_error', (error) => {
        done(error);
      });
    });
  });

  describe('Socket.io Events', () => {
    it('should handle create_room event', (done) => {
      const socketIoClient = require('socket.io-client');

      const clientSocket = socketIoClient(`http://localhost:${testPort}`);

      clientSocket.on('connect', () => {
        clientSocket.emit('create_room', { packId: 'pack1' });
      });

      clientSocket.on('room_created', (data) => {
        expect(data).toHaveProperty('roomId');
        expect(data).toHaveProperty('room');
        clientSocket.disconnect();
        done();
      });

      clientSocket.on('error', (error) => {
        clientSocket.disconnect();
        done(error);
      });
    });

    it('should handle join_room event', (done) => {
      const socketIoClient = require('socket.io-client');
      let roomId;

      const clientSocket = socketIoClient(`http://localhost:${testPort}`);

      clientSocket.on('connect', () => {
        clientSocket.emit('create_room', { packId: 'pack1' });
      });

      clientSocket.on('room_created', (data) => {
        roomId = data.roomId;
        clientSocket.emit('join_room', { roomId, role: 'buzzer' });
      });

      clientSocket.on('joined_room', (data) => {
        expect(data).toHaveProperty('roomId');
        expect(data.roomId).toBe(roomId);
        clientSocket.disconnect();
        done();
      });

      clientSocket.on('error', (error) => {
        clientSocket.disconnect();
        done(error);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle socket errors gracefully', (done) => {
      const socketIoClient = require('socket.io-client');

      const clientSocket = socketIoClient(`http://localhost:${testPort}`);

      clientSocket.on('connect', () => {
        clientSocket.emit('invalid_event', { invalid: 'data' });
      });

      clientSocket.on('error', (error) => {
        expect(error).toBeDefined();
        clientSocket.disconnect();
        done();
      });

      clientSocket.on('connect_error', (error) => {
        done(error);
      });
    });
  });

  describe('Performance', () => {
    it('should handle multiple requests concurrently', async () => {
      const promises = [];

      for (let i = 0; i < 10; i++) {
        promises.push(request(app).get('/health'));
      }

      const responses = await Promise.all(promises);

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });

    it('should respond quickly', async () => {
      const startTime = Date.now();

      await request(app).get('/health');

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100); // Should respond in < 100ms
    });
  });

  describe('Security', () => {
    it('should not expose server internals in 404', async () => {
      const response = await request(app).get('/api/secret');

      expect(response.status).toBe(404);
      expect(response.body.stack).toBeUndefined();
      expect(response.body).not.toHaveProperty('internal');
    });

    it('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/test')
        .set('Content-Type', 'application/json')
        .send('invalid json');

      expect(response.status).toBeLessThan(500);
    });
  });

  describe('Uptime', () => {
    it('should include process uptime in health check', async () => {
      const response = await request(app).get('/health');

      expect(response.body.uptime).toBeGreaterThanOrEqual(0);
      expect(response.body.uptime).toBeLessThan(process.uptime() + 1000);
    });

    it('should track uptime correctly', async () => {
      const response1 = await request(app).get('/health');
      await new Promise(resolve => setTimeout(resolve, 100));
      const response2 = await request(app).get('/health');

      expect(response2.body.uptime).toBeGreaterThanOrEqual(response1.body.uptime);
    });
  });
});
