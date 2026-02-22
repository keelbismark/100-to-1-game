const roomService = require('../services/room.service');
const roomValidators = require('../validators/room.validator');
const logger = require('../utils/logger');

class RoomController {
  createRoom(socket, { packId }) {
    try {
      const validation = roomValidators.validateCreateRoom({ packId });
      if (!validation.success) {
        socket.emit('error', { message: validation.message });
        return;
      }

      const room = roomService.createRoom(validation.data.packId);
      socket.join(room.id);
      
      socket.emit('room_created', { roomId: room.id, room });
      logger.info('Room created successfully', { roomId: room.id, socketId: socket.id });
      
    } catch (error) {
      logger.error('Error creating room', { error: error.message, socketId: socket.id });
      socket.emit('error', { message: 'Failed to create room' });
    }
  }

  joinRoom(socket, io, { roomId, role }) {
    try {
      const validation = roomValidators.validateJoinRoom({ roomId, role });
      if (!validation.success) {
        socket.emit('error', { message: validation.message });
        return;
      }

      const { roomId: validRoomId, role: validRole } = validation.data;
      const room = roomService.getRoom(validRoomId);

      if (!room) {
        socket.emit('error', { message: 'Комната не найдена' });
        logger.warn('Room not found', { roomId: validRoomId, socketId: socket.id });
        return;
      }

      socket.join(validRoomId);
      
      if (validRole === 'buzzer') {
        const playerId = socket.id;
        roomService.addPlayer(validRoomId, playerId, validRole);
        socket.emit('joined_room', { roomId: validRoomId, playerId });
      } else {
        socket.emit('joined_room', { roomId: validRoomId });
      }

      io.to(validRoomId).emit('room_updated', room);
      logger.info('Player joined room', { roomId: validRoomId, role: validRole, socketId: socket.id });
      
    } catch (error) {
      logger.error('Error joining room', { error: error.message, socketId: socket.id });
      socket.emit('error', { message: 'Failed to join room' });
    }
  }

  setTeam(socket, io, { roomId, team }) {
    try {
      const validation = roomValidators.validateSetTeam({ roomId, team });
      if (!validation.success) {
        socket.emit('error', { message: validation.message });
        return;
      }

      const room = roomService.getRoom(validation.data.roomId);
      if (!room) return;

      const player = room.players.find(p => p.id === socket.id);
      if (player) {
        player.team = validation.data.team;
        roomService.updateRoom(validation.data.roomId, { players: room.players });
      }

      io.to(validation.data.roomId).emit('room_updated', room);
      logger.info('Team set for player', { roomId: validation.data.roomId, team: validation.data.team, socketId: socket.id });
      
    } catch (error) {
      logger.error('Error setting team', { error: error.message, socketId: socket.id });
      socket.emit('error', { message: 'Failed to set team' });
    }
  }

  revealAnswer(socket, io, { roomId, answerIndex }) {
    try {
      const validation = roomValidators.validateRevealAnswer({ roomId, answerIndex });
      if (!validation.success) {
        socket.emit('error', { message: validation.message });
        return;
      }

      const board = roomService.revealAnswer(validation.data.roomId, validation.data.answerIndex);
      if (!board) return;

      const room = roomService.getRoom(validation.data.roomId);
      
      io.to(validation.data.roomId).emit('answer_revealed', {
        answerIndex: validation.data.answerIndex,
        answer: board.answers[validation.data.answerIndex],
        bank: board.bank
      });

      io.to(validation.data.roomId).emit('room_updated', room);
      logger.info('Answer revealed', { roomId: validation.data.roomId, answerIndex: validation.data.answerIndex });
      
    } catch (error) {
      logger.error('Error revealing answer', { error: error.message, socketId: socket.id });
      socket.emit('error', { message: 'Failed to reveal answer' });
    }
  }

  addMistake(socket, io, { roomId }) {
    try {
      const validation = roomValidators.validateAddMistake({ roomId });
      if (!validation.success) {
        socket.emit('error', { message: validation.message });
        return;
      }

      const mistakes = roomService.addMistake(validation.data.roomId);
      if (mistakes === null) return;

      const room = roomService.getRoom(validation.data.roomId);
      
      io.to(validation.data.roomId).emit('mistake_added', { mistakes });
      io.to(validation.data.roomId).emit('room_updated', room);
      logger.info('Mistake added', { roomId: validation.data.roomId, mistakes });
      
    } catch (error) {
      logger.error('Error adding mistake', { error: error.message, socketId: socket.id });
      socket.emit('error', { message: 'Failed to add mistake' });
    }
  }

  switchTeam(socket, io, { roomId }) {
    try {
      const validation = roomValidators.validateSwitchTeam({ roomId });
      if (!validation.success) {
        socket.emit('error', { message: validation.message });
        return;
      }

      const activeTeam = roomService.switchTeam(validation.data.roomId);
      if (activeTeam === null) return;

      const room = roomService.getRoom(validation.data.roomId);
      
      io.to(validation.data.roomId).emit('team_switched', { activeTeam });
      io.to(validation.data.roomId).emit('room_updated', room);
      logger.info('Team switched', { roomId: validation.data.roomId, newActiveTeam: activeTeam });
      
    } catch (error) {
      logger.error('Error switching team', { error: error.message, socketId: socket.id });
      socket.emit('error', { message: 'Failed to switch team' });
    }
  }

  awardPoints(socket, io, { roomId, team, points }) {
    try {
      const validation = roomValidators.validateAwardPoints({ roomId, team, points });
      if (!validation.success) {
        socket.emit('error', { message: validation.message });
        return;
      }

      const board = roomService.awardPoints(validation.data.roomId, validation.data.team, validation.data.points);
      if (!board) return;

      const room = roomService.getRoom(validation.data.roomId);
      
      io.to(validation.data.roomId).emit('points_awarded', { 
        team: validation.data.team, 
        points: validation.data.points 
      });
      io.to(validation.data.roomId).emit('room_updated', room);
      logger.info('Points awarded', { roomId: validation.data.roomId, team: validation.data.team, points: validation.data.points });
      
    } catch (error) {
      logger.error('Error awarding points', { error: error.message, socketId: socket.id });
      socket.emit('error', { message: 'Failed to award points' });
    }
  }

  loadRound(socket, io, { roomId, roundData }) {
    try {
      const validation = roomValidators.validateLoadRound({ roomId, roundData });
      if (!validation.success) {
        socket.emit('error', { message: validation.message });
        return;
      }

      const room = roomService.loadRound(validation.data.roomId, validation.data.roundData);
      if (!room) return;

      io.to(validation.data.roomId).emit('round_loaded', validation.data.roundData);
      io.to(validation.data.roomId).emit('room_updated', room);
      logger.info('Round loaded', { roomId: validation.data.roomId, roundType: validation.data.roundData.type });
      
    } catch (error) {
      logger.error('Error loading round', { error: error.message, socketId: socket.id });
      socket.emit('error', { message: 'Failed to load round' });
    }
  }

  pressBuzzer(socket, io, { roomId, team, timestamp }) {
    try {
      const validation = roomValidators.validateBuzzerPress({ roomId, team, timestamp });
      if (!validation.success) {
        socket.emit('error', { message: validation.message });
        return;
      }

      const buzzer = roomService.pressBuzzer(validation.data.roomId, validation.data.team);
      if (!buzzer) return;

      const room = roomService.getRoom(validation.data.roomId);
      
      io.to(validation.data.roomId).emit('buzzer_pressed', { winner: buzzer.winner });
      io.to(validation.data.roomId).emit('room_updated', room);
      logger.info('Buzzer pressed', { roomId: validation.data.roomId, team: validation.data.team, winner: buzzer.winner });
      
    } catch (error) {
      logger.error('Error pressing buzzer', { error: error.message, socketId: socket.id });
      socket.emit('error', { message: 'Failed to press buzzer' });
    }
  }

  resetBuzzer(socket, io, { roomId }) {
    try {
      const validation = roomValidators.validateResetBuzzer({ roomId });
      if (!validation.success) {
        socket.emit('error', { message: validation.message });
        return;
      }

      const room = roomService.resetBuzzer(validation.data.roomId);
      if (!room) return;

      io.to(validation.data.roomId).emit('buzzer_reset');
      io.to(validation.data.roomId).emit('room_updated', room);
      logger.info('Buzzer reset', { roomId: validation.data.roomId });
      
    } catch (error) {
      logger.error('Error resetting buzzer', { error: error.message, socketId: socket.id });
      socket.emit('error', { message: 'Failed to reset buzzer' });
    }
  }

  toggleSound(socket, io, { roomId, enabled }) {
    try {
      const validation = roomValidators.validateToggleSound({ roomId, enabled });
      if (!validation.success) {
        socket.emit('error', { message: validation.message });
        return;
      }

      io.to(validation.data.roomId).emit('sound_toggled', { enabled: validation.data.enabled });
      logger.info('Sound toggled', { roomId: validation.data.roomId, enabled: validation.data.enabled });
      
    } catch (error) {
      logger.error('Error toggling sound', { error: error.message, socketId: socket.id });
      socket.emit('error', { message: 'Failed to toggle sound' });
    }
  }
}

module.exports = new RoomController();
