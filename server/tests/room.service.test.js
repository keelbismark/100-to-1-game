const { v4: uuidv4 } = require('uuid');

let mockUuidCounter = 0;
jest.mock('uuid', () => ({
  v4: jest.fn(() => {
    mockUuidCounter++;
    const code = mockUuidCounter.toString().padStart(4, '0');
    return `${code}-0000-0000-0000-000000000000`;
  })
}));

const roomService = require('../src/services/room.service');

describe('RoomService', () => {
  beforeEach(() => {
    try {
      const fs = require('fs');
      const path = require('path');
      const dataPath = path.join(__dirname, '..', 'data', 'rooms.json');
      if (fs.existsSync(dataPath)) {
        fs.unlinkSync(dataPath);
      }
      const dataDir = path.join(__dirname, '..', 'data');
      if (fs.existsSync(dataDir)) {
        fs.rmdirSync(dataDir, { recursive: true });
      }
    } catch (e) {
    }
    
    roomService.rooms = {};
  });

  describe('createRoom', () => {
    it('should create a new room with valid packId', () => {
      const room = roomService.createRoom('pack1');

      expect(room).toBeDefined();
      expect(room.id).toBe('0001');
      expect(room.packId).toBe('pack1');
      expect(room.players).toEqual([]);
      expect(room.board.activeTeam).toBe(1);
      expect(room.board.mistakes).toBe(0);
      expect(room.buzzer.winner).toBeNull();
    });

    it('should generate unique room IDs', () => {
      const room1 = roomService.createRoom('pack1');
      const room2 = roomService.createRoom('pack2');

      expect(room1.id).toBeDefined();
      expect(room2.id).toBeDefined();
    });
  });

  describe('getRoom', () => {
    it('should return room for existing roomId', () => {
      const createdRoom = roomService.createRoom('pack1');
      const retrievedRoom = roomService.getRoom(createdRoom.id);

      expect(retrievedRoom).toEqual(createdRoom);
    });

    it('should return null for non-existent roomId', () => {
      const room = roomService.getRoom('NONEXISTENT');

      expect(room).toBeNull();
    });
  });

  describe('addPlayer', () => {
    it('should add player to existing room', () => {
      const room = roomService.createRoom('pack1');
      const playerId = 'socket123';

      const result = roomService.addPlayer(room.id, playerId, 'buzzer', 1);

      expect(result).toBe(true);
      expect(room.players).toHaveLength(1);
      expect(room.players[0].id).toBe(playerId);
      expect(room.players[0].role).toBe('buzzer');
      expect(room.players[0].team).toBe(1);
    });

    it('should not add player to non-existent room', () => {
      const result = roomService.addPlayer('NONEXISTENT', 'socket123', 'buzzer', 1);

      expect(result).toBe(false);
    });
  });

  describe('revealAnswer', () => {
    it('should reveal answer and update bank', () => {
      const room = roomService.createRoom('pack1');
      room.board.answers = [
        { text: 'Answer 1', score: 30 },
        { text: 'Answer 2', score: 25 }
      ];

      const board = roomService.revealAnswer(room.id, 0);

      expect(board.revealed).toContain(0);
      expect(board.bank).toBe(30);
    });

    it('should not reveal same answer twice', () => {
      const room = roomService.createRoom('pack1');
      room.board.answers = [{ text: 'Answer 1', score: 30 }];

      roomService.revealAnswer(room.id, 0);
      roomService.revealAnswer(room.id, 0);

      expect(room.board.revealed).toHaveLength(1);
      expect(room.board.bank).toBe(30);
    });
  });

  describe('addMistake', () => {
    it('should increment mistake count', () => {
      const room = roomService.createRoom('pack1');

      const mistakes = roomService.addMistake(room.id);
      expect(mistakes).toBe(1);
      expect(room.board.mistakes).toBe(1);

      roomService.addMistake(room.id);
      expect(room.board.mistakes).toBe(2);
    });
  });

  describe('switchTeam', () => {
    it('should switch active team from 1 to 2', () => {
      const room = roomService.createRoom('pack1');

      const newTeam = roomService.switchTeam(room.id);
      expect(newTeam).toBe(2);
      expect(room.board.activeTeam).toBe(2);
    });

    it('should switch active team from 2 to 1', () => {
      const room = roomService.createRoom('pack1');
      room.board.activeTeam = 2;

      const newTeam = roomService.switchTeam(room.id);
      expect(newTeam).toBe(1);
      expect(room.board.activeTeam).toBe(1);
    });
  });

  describe('awardPoints', () => {
    it('should award points to team 1', () => {
      const room = roomService.createRoom('pack1');
      const points = 50;

      const board = roomService.awardPoints(room.id, 1, points);
      expect(board.team1Score).toBe(points);
      expect(board.team2Score).toBe(0);
    });

    it('should award points to team 2', () => {
      const room = roomService.createRoom('pack1');
      const points = 30;

      const board = roomService.awardPoints(room.id, 2, points);
      expect(board.team1Score).toBe(0);
      expect(board.team2Score).toBe(points);
    });

    it('should accumulate points for each team', () => {
      const room = roomService.createRoom('pack1');

      roomService.awardPoints(room.id, 1, 50);
      roomService.awardPoints(room.id, 2, 30);
      roomService.awardPoints(room.id, 1, 20);

      expect(room.board.team1Score).toBe(70);
      expect(room.board.team2Score).toBe(30);
    });
  });

  describe('pressBuzzer', () => {
    it('should set team 1 as winner first to press', () => {
      const room = roomService.createRoom('pack1');

      const buzzer = roomService.pressBuzzer(room.id, 1);
      expect(buzzer.winner).toBe(1);
      expect(buzzer.team1Pressed).toBe(true);
      expect(buzzer.team2Pressed).toBe(false);
    });

    it('should not change winner after first press', () => {
      const room = roomService.createRoom('pack1');

      roomService.pressBuzzer(room.id, 1);
      const buzzer = roomService.pressBuzzer(room.id, 2);

      expect(buzzer.winner).toBe(1);
      expect(buzzer.team1Pressed).toBe(true);
      expect(buzzer.team2Pressed).toBe(false);
    });
  });

  describe('resetBuzzer', () => {
    it('should reset buzzer state', () => {
      const room = roomService.createRoom('pack1');
      roomService.pressBuzzer(room.id, 1);

      const updatedRoom = roomService.resetBuzzer(room.id);

      expect(updatedRoom.buzzer.winner).toBeNull();
      expect(updatedRoom.buzzer.team1Pressed).toBe(false);
      expect(updatedRoom.buzzer.team2Pressed).toBe(false);
    });
  });

  describe('deleteRoom', () => {
    it('should delete existing room', () => {
      const room = roomService.createRoom('pack1');
      const roomId = room.id;

      const result = roomService.deleteRoom(roomId);
      expect(result).toBe(true);
      expect(roomService.getRoom(roomId)).toBeNull();
    });

    it('should return false for non-existent room', () => {
      const result = roomService.deleteRoom('NONEXISTENT');
      expect(result).toBe(false);
    });
  });

  describe('cleanupInactiveRooms', () => {
    it('should clean up inactive rooms', () => {
      const veryOldTimestamp = Date.now() - (25 * 60 * 60 * 1000);
      
      const oldRoom = roomService.createRoom('pack1');
      roomService.rooms[oldRoom.id].updatedAt = new Date(veryOldTimestamp).toISOString();
      
      const recentTimestamp = Date.now() - 5000;
      const newRoom = roomService.createRoom('pack2');
      roomService.rooms[newRoom.id].updatedAt = new Date(recentTimestamp).toISOString();

      const cleaned = roomService.cleanupInactiveRooms(24 * 60 * 60 * 1000);

      expect(cleaned).toBe(1);
      expect(roomService.getRoom(oldRoom.id)).toBeNull();
      expect(roomService.getRoom(newRoom.id)).toBeDefined();
    });

    it('should not clean up active rooms', () => {
      const room = roomService.createRoom('pack1');

      const cleaned = roomService.cleanupInactiveRooms(60 * 60 * 1000);

      expect(cleaned).toBe(0);
      expect(roomService.getRoom(room.id)).toBeDefined();
    });
  });

  describe('getStats', () => {
    it('should return correct stats for no rooms', () => {
      const stats = roomService.getStats();

      expect(stats.totalRooms).toBe(0);
      expect(stats.totalPlayers).toBe(0);
      expect(stats.activeRooms).toBe(0);
    });

    it('should return correct stats for multiple rooms', () => {
      const room1 = roomService.createRoom('pack1');
      roomService.addPlayer(room1.id, 'player1', 'buzzer', 1);
      roomService.addPlayer(room1.id, 'player2', 'buzzer', 2);
      roomService.rooms[room1.id].currentRound = 'simple';

      const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000);
      const room2 = roomService.createRoom('pack2');
      roomService.rooms[room2.id].currentRound = 'double';
      roomService.rooms[room2.id].updatedAt = new Date(twoHoursAgo).toISOString();

      const stats = roomService.getStats();

      expect(stats.totalRooms).toBe(2);
      expect(stats.totalPlayers).toBe(2);
      expect(stats.activeRooms).toBe(1);
      expect(stats.roomsByRound.simple).toBe(1);
      expect(stats.roomsByRound.double).toBe(1);
    });
  });
});
