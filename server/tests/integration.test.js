const request = require('supertest');
const http = require('http');
const { Server } = require('socket.io');
const express = require('express');
const roomService = require('../src/services/room.service');
const logger = require('../src/utils/logger');

jest.mock('../src/utils/logger');

describe('Integration Tests', () => {
  let app;
  let server;
  let io;
  let ioClient;

  beforeAll((done) => {
    app = express();
    server = http.createServer(app);

    io = new Server(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });

    const roomController = require('../src/controllers/room.controller');

    io.on('connection', (socket) => {
      socket.on('create_room', (data) => {
        roomController.createRoom(socket, data);
      });

      socket.on('join_room', (data) => {
        roomController.joinRoom(socket, io, data);
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
    });

    server.listen(0, () => {
      ioClient = require('socket.io-client')(`http://localhost:${server.address().port}`);

      ioClient.on('connect', () => {
        done();
      });

      ioClient.on('connect_error', (error) => {
        done(error);
      });
    });
  });

  afterAll((done) => {
    if (ioClient) {
      ioClient.disconnect();
    }

    io.close(() => {
      server.close(() => {
        done();
      });
    });

    roomService.rooms = {};
  });

  describe('Room Lifecycle', () => {
    it('should create, join, and interact with a room', (done) => {
      let createdRoomId;

      ioClient.on('room_created', (data) => {
        createdRoomId = data.roomId;
        expect(createdRoomId).toBeDefined();
        expect(data.room).toBeDefined();
        expect(data.room.packId).toBe('pack1');

        ioClient.emit('join_room', {
          roomId: createdRoomId,
          role: 'buzzer'
        });
      });

      ioClient.on('joined_room', (data) => {
        expect(data.roomId).toBe(createdRoomId);

        ioClient.emit('set_team', {
          roomId: createdRoomId,
          team: 1
        });
      });

      ioClient.on('room_updated', (data) => {
        expect(data.id).toBe(createdRoomId);

        if (data.players && data.players.length > 0) {
          ioClient.emit('load_round', {
            roomId: createdRoomId,
            roundData: {
              question: 'Test question',
              answers: [
                { text: 'Answer 1', score: 30 },
                { text: 'Answer 2', score: 25 }
              ],
              type: 'simple'
            }
          });
        }

        if (data.board && data.board.revealed && data.board.revealed.length > 0) {
          ioClient.emit('add_mistake', { roomId: createdRoomId });
        }

        if (data.board && data.board.mistakes > 0) {
          ioClient.emit('switch_team', { roomId: createdRoomId });
        }

        if (data.board && data.board.activeTeam === 2) {
          ioClient.emit('award_points', {
            roomId: createdRoomId,
            team: 2,
            points: 50
          });
        }

        if (data.board && (data.board.team1Score > 0 || data.board.team2Score > 0)) {
          done();
        }
      });

      ioClient.on('mistake_added', () => {
        ioClient.emit('reveal_answer', {
          roomId: createdRoomId,
          answerIndex: 0
        });
      });

      ioClient.emit('create_room', { packId: 'pack1' });
    }, 10000);

    it('should handle error when joining non-existent room', (done) => {
      ioClient.on('error', (data) => {
        expect(data.message).toContain('не найдена');
        done();
      });

      ioClient.emit('join_room', {
        roomId: 'NONEXISTENT',
        role: 'buzzer'
      });
    });

    it('should handle buzzer press and reset', (done) => {
      let roomId;

      ioClient.on('room_created', (data) => {
        roomId = data.roomId;
        ioClient.emit('join_room', { roomId, role: 'buzzer' });
      });

      ioClient.on('joined_room', () => {
        ioClient.emit('set_team', { roomId, team: 1 });
        ioClient.emit('press_buzzer', { roomId, team: 1, timestamp: Date.now() });
      });

      ioClient.on('buzzer_pressed', (data) => {
        expect(data.winner).toBe(1);

        setTimeout(() => {
          ioClient.emit('reset_buzzer', { roomId });
        }, 100);
      });

      ioClient.on('buzzer_reset', () => {
        done();
      });

      ioClient.emit('create_room', { packId: 'pack1' });
    }, 5000);
  });

  describe('HTTP Endpoints', () => {
    it('should return health check status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        status: 'ok',
        timestamp: expect.any(String)
      });
    });

    it('should return 404 for non-existent routes', async () => {
      const response = await request(app).get('/api/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body).toMatchObject({
        success: false,
        error: 'Not Found'
      });
    });
  });

  describe('Multiple Clients', () => {
    it('should handle multiple clients in same room', (done) => {
      let roomId;
      const client2 = require('socket.io-client')(`http://localhost:${server.address().port}`);
      let messagesReceived = 0;
      const expectedMessages = 3;

      const checkCompletion = () => {
        messagesReceived++;
        if (messagesReceived >= expectedMessages) {
          client2.disconnect();
          done();
        }
      };

      ioClient.on('room_created', (data) => {
        roomId = data.roomId;
        ioClient.emit('join_room', { roomId, role: 'buzzer' });
      });

      client2.on('connect', () => {
        if (roomId) {
          client2.emit('join_room', { roomId, role: 'buzzer' });
        }
      });

      ioClient.on('room_updated', () => {
        checkCompletion();
      });

      client2.on('room_updated', () => {
        checkCompletion();
      });

      client2.on('joined_room', () => {
        checkCompletion();
      });

      setTimeout(() => {
        ioClient.emit('create_room', { packId: 'pack1' });
      }, 100);
    }, 10000);

    it('should sync state across clients', (done) => {
      let roomId;
      const client2 = require('socket.io-client')(`http://localhost:${server.address().port}`);

      ioClient.on('room_created', (data) => {
        roomId = data.roomId;
        ioClient.emit('join_room', { roomId, role: 'buzzer' });

        setTimeout(() => {
          client2.emit('join_room', { roomId, role: 'buzzer' });
        }, 100);
      });

      let client1ReceivedUpdate = false;
      let client2ReceivedUpdate = false;

      ioClient.on('room_updated', (data) => {
        if (data.board && data.board.activeTeam) {
          client1ReceivedUpdate = true;

          if (client2ReceivedUpdate) {
            client2.disconnect();
            done();
          }
        }
      });

      client2.on('room_updated', (data) => {
        if (data.board && data.board.activeTeam) {
          client2ReceivedUpdate = true;

          if (client1ReceivedUpdate) {
            client2.disconnect();
            done();
          }
        }
      });

      ioClient.on('joined_room', () => {
        ioClient.emit('switch_team', { roomId });
      });

      ioClient.emit('create_room', { packId: 'pack1' });
    }, 10000);
  });

  describe('Error Handling', () => {
    it('should handle invalid data gracefully', (done) => {
      const errorsReceived = [];

      ioClient.on('error', (data) => {
        errorsReceived.push(data.message);
      });

      setTimeout(() => {
        ioClient.emit('create_room', { packId: '' });

        setTimeout(() => {
          ioClient.emit('join_room', { roomId: 'INVALID' });

          setTimeout(() => {
            expect(errorsReceived.length).toBeGreaterThan(0);
            done();
          }, 100);
        }, 100);
      }, 100);
    }, 5000);

    it('should handle multiple validation errors', (done) => {
      let errorsReceived = 0;

      ioClient.on('error', (data) => {
        errorsReceived++;

        if (errorsReceived >= 3) {
          done();
        }
      });

      ioClient.emit('create_room', {});

      ioClient.emit('join_room', {});

      ioClient.emit('reveal_answer', {});
    }, 5000);
  });

  describe('Room Cleanup', () => {
    it('should cleanup inactive rooms', () => {
      const oldRoom = roomService.createRoom('pack1');
      roomService.rooms[oldRoom.id].updatedAt = new Date(Date.now() - (25 * 60 * 60 * 1000)).toISOString();

      const veryOldRoom = roomService.createRoom('pack2');
      roomService.rooms[veryOldRoom.id].updatedAt = new Date(Date.now() - (25 * 60 * 60 * 1000)).toISOString();

      const recentRoom = roomService.createRoom('pack3');

      const cleaned = roomService.cleanupInactiveRooms(24 * 60 * 60 * 1000);

      expect(cleaned).toBe(2);
      expect(roomService.getRoom(oldRoom.id)).toBeNull();
      expect(roomService.getRoom(veryOldRoom.id)).toBeNull();
      expect(roomService.getRoom(recentRoom.id)).toBeDefined();
    });

    it('should not cleanup active rooms', () => {
      const room = roomService.createRoom('pack1');

      const cleaned = roomService.cleanupInactiveRooms(60 * 60 * 1000);

      expect(cleaned).toBe(0);
      expect(roomService.getRoom(room.id)).toBeDefined();
    });
  });
});
