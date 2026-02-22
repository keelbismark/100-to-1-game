const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const config = require('./config/config');
const logger = require('./utils/logger');
const { securityHeaders, socketSecurity } = require('./middlewares/security');
const rateLimiter = require('./middlewares/rateLimiter');
const { errorHandler, notFoundHandler, socketErrorHandler } = require('./middlewares/errorHandler');
const roomController = require('./controllers/room.controller');
const roomService = require('./services/room.service');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: config.cors,
  pingTimeout: 30000,
  pingInterval: 25000,
  maxHttpBufferSize: 1e6
});

app.use(securityHeaders);
app.use(rateLimiter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  const stats = roomService.getStats();
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.env,
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

app.use(notFoundHandler);
app.use(errorHandler);

io.use(socketSecurity);

io.on('connection', (socket) => {
  const ip = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address;
  
  logger.info('New socket connection', {
    socketId: socket.id,
    ip,
    userAgent: socket.handshake.headers['user-agent']
  });

  socket.on('create_room', (data) => {
    roomController.createRoom(socket, data);
  });

  socket.on('join_room', (data) => {
    roomController.joinRoom(socket, io, data);
  });

  socket.on('set_team', (data) => {
    roomController.setTeam(socket, io, data);
  });

  socket.on('reveal_answer', (data) => {
    roomController.revealAnswer(socket, io, data);
  });

  socket.on('add_mistake', (data) => {
    roomController.addMistake(socket, io, data);
  });

  socket.on('switch_team', (data) => {
    roomController.switchTeam(socket, io, data);
  });

  socket.on('award_points', (data) => {
    roomController.awardPoints(socket, io, data);
  });

  socket.on('load_round', (data) => {
    roomController.loadRound(socket, io, data);
  });

  socket.on('buzzer_press', (data) => {
    roomController.pressBuzzer(socket, io, data);
  });

  socket.on('reset_buzzer', (data) => {
    roomController.resetBuzzer(socket, io, data);
  });

  socket.on('toggle_sound', (data) => {
    roomController.toggleSound(socket, io, data);
  });

  socket.on('disconnect', (reason) => {
    logger.info('Socket disconnected', {
      socketId: socket.id,
      reason,
      ip
    });
  });

  socket.on('error', socketErrorHandler(socket));
});

const PORT = config.port;

server.listen(PORT, () => {
  logger.info('Server started', {
    port: PORT,
    env: config.env,
    clientUrl: config.clientUrl
  });
  
  roomService.cleanupInactiveRooms();
  
  setInterval(() => {
    const cleaned = roomService.cleanupInactiveRooms();
    if (cleaned > 0) {
      logger.info('Periodic cleanup completed', { roomsCleaned: cleaned });
    }
  }, 60 * 60 * 1000);
});

const gracefulShutdown = (signal) => {
  logger.info(`Received ${signal}, starting graceful shutdown...`);
  
  server.close(() => {
    logger.info('HTTP server closed');
    
    io.close(() => {
      logger.info('Socket.io server closed');
      roomService.saveRoomsToStorage();
      logger.info('Rooms saved to storage');
      process.exit(0);
    });
    
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', {
    message: error.message,
    stack: error.stack
  });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', {
    reason,
    promise
  });
});

module.exports = { app, server, io };
