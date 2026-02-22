const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

class RoomService {
  constructor() {
    this.rooms = {};
    this.loadRoomsFromStorage();
  }

  createRoom(packId) {
    const roomId = uuidv4().substring(0, 4).toUpperCase();
    
    this.rooms[roomId] = {
      id: roomId,
      packId,
      players: [],
      currentRound: 'simple',
      board: {
        answers: [],
        revealed: [],
        mistakes: 0,
        team1Score: 0,
        team2Score: 0,
        bank: 0,
        activeTeam: 1
      },
      buzzer: {
        team1Pressed: false,
        team2Pressed: false,
        winner: null
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    logger.info('Room created', { roomId, packId });
    this.saveRoomsToStorage();
    
    return this.rooms[roomId];
  }

  getRoom(roomId) {
    return this.rooms[roomId] || null;
  }

  getRooms() {
    return this.rooms;
  }

  roomExists(roomId) {
    return roomId in this.rooms;
  }

  addPlayer(roomId, playerId, role, team = null) {
    if (!this.rooms[roomId]) {
      return false;
    }

    this.rooms[roomId].players.push({
      id: playerId,
      role,
      team,
      joinedAt: new Date().toISOString()
    });

    this.rooms[roomId].updatedAt = new Date().toISOString();
    
    logger.info('Player added to room', { roomId, playerId, role, team });
    this.saveRoomsToStorage();
    
    return true;
  }

  updateRoom(roomId, updates) {
    if (!this.rooms[roomId]) {
      return false;
    }

    this.rooms[roomId] = {
      ...this.rooms[roomId],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    logger.debug('Room updated', { roomId, updates });
    this.saveRoomsToStorage();
    
    return this.rooms[roomId];
  }

  revealAnswer(roomId, answerIndex) {
    const room = this.rooms[roomId];
    if (!room || !room.board) {
      return null;
    }

    const board = room.board;

    if (!board.revealed.includes(answerIndex)) {
      board.revealed.push(answerIndex);
      if (board.answers[answerIndex]) {
        board.bank += board.answers[answerIndex].score;
      }
      
      logger.info('Answer revealed', { roomId, answerIndex, newBank: board.bank });
      this.saveRoomsToStorage();
    }

    return board;
  }

  addMistake(roomId) {
    const room = this.rooms[roomId];
    if (!room || !room.board) {
      return null;
    }

    room.board.mistakes++;
    
    logger.info('Mistake added', { roomId, mistakes: room.board.mistakes });
    this.saveRoomsToStorage();
    
    return room.board.mistakes;
  }

  switchTeam(roomId) {
    const room = this.rooms[roomId];
    if (!room || !room.board) {
      return null;
    }

    room.board.activeTeam = room.board.activeTeam === 1 ? 2 : 1;
    
    logger.info('Team switched', { roomId, newActiveTeam: room.board.activeTeam });
    this.saveRoomsToStorage();
    
    return room.board.activeTeam;
  }

  awardPoints(roomId, team, points) {
    const room = this.rooms[roomId];
    if (!room || !room.board) {
      return null;
    }

    if (team === 1) {
      room.board.team1Score += points;
    } else {
      room.board.team2Score += points;
    }
    
    logger.info('Points awarded', { roomId, team, points, scores: {
      team1: room.board.team1Score,
      team2: room.board.team2Score
    }});
    this.saveRoomsToStorage();
    
    return room.board;
  }

  loadRound(roomId, roundData) {
    const room = this.rooms[roomId];
    if (!room) {
      return null;
    }

    room.board.answers = roundData.answers;
    room.board.revealed = [];
    room.board.mistakes = 0;
    room.board.bank = 0;
    room.currentRound = roundData.type;
    
    logger.info('Round loaded', { roomId, roundType: roundData.type });
    this.saveRoomsToStorage();
    
    return room;
  }

  pressBuzzer(roomId, team) {
    const room = this.rooms[roomId];
    if (!room || !room.buzzer) {
      return null;
    }

    const buzzer = room.buzzer;

    if (!buzzer.winner) {
      if (team === 1 && !buzzer.team1Pressed) {
        buzzer.team1Pressed = true;
        buzzer.winner = 1;
      } else if (team === 2 && !buzzer.team2Pressed) {
        buzzer.team2Pressed = true;
        buzzer.winner = 2;
      }
      
      logger.info('Buzzer pressed', { roomId, team, winner: buzzer.winner });
      this.saveRoomsToStorage();
    }

    return buzzer;
  }

  resetBuzzer(roomId) {
    const room = this.rooms[roomId];
    if (!room) {
      return null;
    }

    room.buzzer = {
      team1Pressed: false,
      team2Pressed: false,
      winner: null
    };
    
    logger.info('Buzzer reset', { roomId });
    this.saveRoomsToStorage();
    
    return room;
  }

  deleteRoom(roomId) {
    if (!this.rooms[roomId]) {
      return false;
    }

    delete this.rooms[roomId];
    
    logger.info('Room deleted', { roomId });
    this.saveRoomsToStorage();
    
    return true;
  }

  cleanupInactiveRooms(maxAgeMs = 24 * 60 * 60 * 1000) {
    const now = Date.now();
    const roomsToDelete = [];

    Object.keys(this.rooms).forEach(roomId => {
      const room = this.rooms[roomId];
      const updatedAt = new Date(room.updatedAt).getTime();
      
      if (now - updatedAt > maxAgeMs) {
        roomsToDelete.push(roomId);
      }
    });

    roomsToDelete.forEach(roomId => {
      delete this.rooms[roomId];
    });

    if (roomsToDelete.length > 0) {
      logger.info('Inactive rooms cleaned up', { 
        count: roomsToDelete.length,
        roomIds: roomsToDelete 
      });
      this.saveRoomsToStorage();
    }

    return roomsToDelete.length;
  }

  saveRoomsToStorage() {
    try {
      const fs = require('fs');
      const path = require('path');
      const dataDir = path.join(process.cwd(), 'data');
      const filePath = path.join(dataDir, 'rooms.json');

      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      fs.writeFileSync(filePath, JSON.stringify(this.rooms, null, 2));
    } catch (error) {
      logger.error('Failed to save rooms to storage', { error: error.message });
    }
  }

  loadRoomsFromStorage() {
    try {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(process.cwd(), 'data', 'rooms.json');

      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        this.rooms = JSON.parse(data);
        logger.info('Rooms loaded from storage', { count: Object.keys(this.rooms).length });
      }
    } catch (error) {
      logger.error('Failed to load rooms from storage', { error: error.message });
      this.rooms = {};
    }
  }

  getStats() {
    const stats = {
      totalRooms: Object.keys(this.rooms).length,
      totalPlayers: 0,
      roomsByRound: {},
      activeRooms: 0
    };

    Object.values(this.rooms).forEach(room => {
      stats.totalPlayers += room.players.length;
      stats.roomsByRound[room.currentRound] = (stats.roomsByRound[room.currentRound] || 0) + 1;
      
      const lastActiveTime = new Date(room.updatedAt).getTime();
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      if (lastActiveTime > oneHourAgo) {
        stats.activeRooms++;
      }
    });

    return stats;
  }
}

module.exports = new RoomService();
