const roomController = require('../src/controllers/room.controller');
const roomService = require('../src/services/room.service');
const roomValidators = require('../src/validators/room.validator');
const logger = require('../src/utils/logger');

jest.mock('../src/services/room.service');
jest.mock('../src/validators/room.validator');
jest.mock('../src/utils/logger');

describe('RoomController', () => {
  let mockSocket;
  let mockIo;

  beforeEach(() => {
    mockSocket = {
      id: 'socket123',
      emit: jest.fn(),
      join: jest.fn()
    };

    mockIo = {
      to: jest.fn(() => ({
        emit: jest.fn()
      }))
    };

    jest.clearAllMocks();
  });

  describe('createRoom', () => {
    it('should create a room successfully', () => {
      const mockPackId = 'pack1';
      const mockRoom = {
        id: 'TEST',
        packId: mockPackId,
        players: []
      };

      roomValidators.validateCreateRoom.mockReturnValue({
        success: true,
        data: { packId: mockPackId }
      });

      roomService.createRoom.mockReturnValue(mockRoom);

      roomController.createRoom(mockSocket, { packId: mockPackId });

      expect(roomValidators.validateCreateRoom).toHaveBeenCalledWith({ packId: mockPackId });
      expect(roomService.createRoom).toHaveBeenCalledWith(mockPackId);
      expect(mockSocket.join).toHaveBeenCalledWith(mockRoom.id);
      expect(mockSocket.emit).toHaveBeenCalledWith('room_created', {
        roomId: mockRoom.id,
        room: mockRoom
      });
    });

    it('should emit error when validation fails', () => {
      const mockPackId = '';

      roomValidators.validateCreateRoom.mockReturnValue({
        success: false,
        message: 'packId обязателен'
      });

      roomController.createRoom(mockSocket, { packId: mockPackId });

      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        message: 'packId обязателен'
      });
      expect(roomService.createRoom).not.toHaveBeenCalled();
    });

    it('should emit error when room creation fails', async () => {
      const mockPackId = 'pack1';

      roomValidators.validateCreateRoom.mockReturnValue({
        success: true,
        data: { packId: mockPackId }
      });

      roomService.createRoom.mockImplementation(() => {
        throw new Error('Database error');
      });

      roomController.createRoom(mockSocket, { packId: mockPackId });

      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        message: 'Failed to create room'
      });
    });
  });

  describe('joinRoom', () => {
    it('should join room successfully as buzzer player', () => {
      const mockRoomId = 'TEST';
      const mockRole = 'buzzer';
      const mockRoom = {
        id: mockRoomId,
        players: []
      };

      roomValidators.validateJoinRoom.mockReturnValue({
        success: true,
        data: { roomId: mockRoomId, role: mockRole }
      });

      roomService.getRoom.mockReturnValue(mockRoom);
      roomService.addPlayer.mockReturnValue(true);

      roomController.joinRoom(mockSocket, mockIo, { roomId: mockRoomId, role: mockRole });

      expect(mockSocket.join).toHaveBeenCalledWith(mockRoomId);
      expect(roomService.addPlayer).toHaveBeenCalledWith(mockRoomId, mockSocket.id, mockRole);
      expect(mockSocket.emit).toHaveBeenCalledWith('joined_room', {
        roomId: mockRoomId,
        playerId: mockSocket.id
      });
    });

    it('should join room successfully as board or admin', () => {
      const mockRoomId = 'TEST';
      const mockRole = 'board';
      const mockRoom = {
        id: mockRoomId,
        players: []
      };

      roomValidators.validateJoinRoom.mockReturnValue({
        success: true,
        data: { roomId: mockRoomId, role: mockRole }
      });

      roomService.getRoom.mockReturnValue(mockRoom);

      roomController.joinRoom(mockSocket, mockIo, { roomId: mockRoomId, role: mockRole });

      expect(mockSocket.join).toHaveBeenCalledWith(mockRoomId);
      expect(roomService.addPlayer).not.toHaveBeenCalled();
      expect(mockSocket.emit).toHaveBeenCalledWith('joined_room', {
        roomId: mockRoomId
      });
    });

    it('should emit error when validation fails', () => {
      const mockRoomId = 'INVALID';
      const mockRole = 'invalid';

      roomValidators.validateJoinRoom.mockReturnValue({
        success: false,
        message: 'Invalid role'
      });

      roomController.joinRoom(mockSocket, mockIo, { roomId: mockRoomId, role: mockRole });

      expect(mockSocket.emit).toHaveBeenCalledWith('error', { message: 'Invalid role' });
      expect(roomService.getRoom).not.toHaveBeenCalled();
    });

    it('should emit error when room not found', () => {
      const mockRoomId = 'MISSING';
      const mockRole = 'buzzer';

      roomValidators.validateJoinRoom.mockReturnValue({
        success: true,
        data: { roomId: mockRoomId, role: mockRole }
      });

      roomService.getRoom.mockReturnValue(null);

      roomController.joinRoom(mockSocket, mockIo, { roomId: mockRoomId, role: mockRole });

      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        message: 'Комната не найдена'
      });
      expect(mockSocket.join).not.toHaveBeenCalled();
    });

    it('should emit error when join fails', () => {
      const mockRoomId = 'TEST';
      const mockRole = 'buzzer';
      const mockRoom = { id: mockRoomId, players: [] };

      roomValidators.validateJoinRoom.mockReturnValue({
        success: true,
        data: { roomId: mockRoomId, role: mockRole }
      });

      roomService.getRoom.mockReturnValue(mockRoom);
      roomService.addPlayer.mockImplementation(() => {
        throw new Error('Player add failed');
      });

      roomController.joinRoom(mockSocket, mockIo, { roomId: mockRoomId, role: mockRole });

      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        message: 'Failed to join room'
      });
    });
  });

  describe('setTeam', () => {
    it('should set team successfully', () => {
      const mockRoomId = 'TEST';
      const mockTeam = 1;
      const mockRoom = {
        id: mockRoomId,
        players: [
          { id: mockSocket.id, role: 'buzzer', team: null }
        ]
      };

      roomValidators.validateSetTeam.mockReturnValue({
        success: true,
        data: { roomId: mockRoomId, team: mockTeam }
      });

      roomService.getRoom.mockReturnValue(mockRoom);
      roomService.updateRoom.mockReturnValue(mockRoom);

      roomController.setTeam(mockSocket, mockIo, { roomId: mockRoomId, team: mockTeam });

      expect(roomService.updateRoom).toHaveBeenCalledWith(mockRoomId, {
        players: expect.arrayContaining([
          expect.objectContaining({ team: mockTeam })
        ])
      });
    });

    it('should emit error when validation fails', () => {
      const mockRoomId = 'TEST';
      const mockTeam = 3;

      roomValidators.validateSetTeam.mockReturnValue({
        success: false,
        message: 'Invalid team'
      });

      roomController.setTeam(mockSocket, mockIo, { roomId: mockRoomId, team: mockTeam });

      expect(mockSocket.emit).toHaveBeenCalledWith('error', { message: 'Invalid team' });
    });

    it('should handle case where player not found', () => {
      const mockRoomId = 'TEST';
      const mockTeam = 1;
      const mockRoom = {
        id: mockRoomId,
        players: [
          { id: 'otherSocket', role: 'buzzer', team: null }
        ]
      };

      roomValidators.validateSetTeam.mockReturnValue({
        success: true,
        data: { roomId: mockRoomId, team: mockTeam }
      });

      roomService.getRoom.mockReturnValue(mockRoom);

      roomController.setTeam(mockSocket, mockIo, { roomId: mockRoomId, team: mockTeam });

      expect(roomService.updateRoom).not.toHaveBeenCalled();
    });
  });

  describe('revealAnswer', () => {
    it('should reveal answer successfully', () => {
      const mockRoomId = 'TEST';
      const mockAnswerIndex = 0;
      const mockBoard = {
        answers: [
          { text: 'Answer 1', score: 30 },
          { text: 'Answer 2', score: 25 }
        ],
        revealed: [0],
        bank: 30
      };
      const mockRoom = { id: mockRoomId, board: mockBoard };

      roomValidators.validateRevealAnswer.mockReturnValue({
        success: true,
        data: { roomId: mockRoomId, answerIndex: mockAnswerIndex }
      });

      roomService.revealAnswer.mockReturnValue(mockBoard);
      roomService.getRoom.mockReturnValue(mockRoom);

      roomController.revealAnswer(mockSocket, mockIo, {
        roomId: mockRoomId,
        answerIndex: mockAnswerIndex
      });

      expect(roomService.revealAnswer).toHaveBeenCalledWith(mockRoomId, mockAnswerIndex);
      expect(mockIo.to).toHaveBeenCalledWith(mockRoomId);
    });

    it('should emit error when validation fails', () => {
      const mockAnswerIndex = -1;

      roomValidators.validateRevealAnswer.mockReturnValue({
        success: false,
        message: 'Invalid index'
      });

      roomController.revealAnswer(mockSocket, mockIo, {
        roomId: 'TEST',
        answerIndex: mockAnswerIndex
      });

      expect(mockSocket.emit).toHaveBeenCalledWith('error', { message: 'Invalid index' });
    });
  });

  describe('addMistake', () => {
    it('should add mistake successfully', () => {
      const mockRoomId = 'TEST';
      const mockMistakes = 3;
      const mockBoard = { mistakes: mockMistakes };
      const mockRoom = { id: mockRoomId, board: mockBoard };

      roomValidators.validateAddMistake.mockReturnValue({
        success: true,
        data: { roomId: mockRoomId }
      });

      roomService.addMistake.mockReturnValue(mockMistakes);
      roomService.getRoom.mockReturnValue(mockRoom);

      roomController.addMistake(mockSocket, mockIo, { roomId: mockRoomId });

      expect(roomService.addMistake).toHaveBeenCalledWith(mockRoomId);
      expect(mockIo.to).toHaveBeenCalledWith(mockRoomId);
    });

    it('should emit error when validation fails', () => {
      roomValidators.validateAddMistake.mockReturnValue({
        success: false,
        message: 'Validation error'
      });

      roomController.addMistake(mockSocket, mockIo, { roomId: 'TEST' });

      expect(mockSocket.emit).toHaveBeenCalledWith('error', { message: 'Validation error' });
    });
  });

  describe('switchTeam', () => {
    it('should switch team successfully', () => {
      const mockRoomId = 'TEST';
      const mockActiveTeam = 2;
      const mockBoard = { activeTeam: mockActiveTeam };
      const mockRoom = { id: mockRoomId, board: mockBoard };

      roomValidators.validateSwitchTeam.mockReturnValue({
        success: true,
        data: { roomId: mockRoomId }
      });

      roomService.switchTeam.mockReturnValue(mockActiveTeam);
      roomService.getRoom.mockReturnValue(mockRoom);

      roomController.switchTeam(mockSocket, mockIo, { roomId: mockRoomId });

      expect(roomService.switchTeam).toHaveBeenCalledWith(mockRoomId);
      expect(mockIo.to).toHaveBeenCalledWith(mockRoomId);
    });

    it('should emit error when validation fails', () => {
      roomValidators.validateSwitchTeam.mockReturnValue({
        success: false,
        message: 'Validation error'
      });

      roomController.switchTeam(mockSocket, mockIo, { roomId: 'TEST' });

      expect(mockSocket.emit).toHaveBeenCalledWith('error', { message: 'Validation error' });
    });
  });

  describe('awardPoints', () => {
    it('should award points successfully', () => {
      const mockRoomId = 'TEST';
      const mockTeam = 1;
      const mockPoints = 50;
      const mockBoard = { team1Score: mockPoints, team2Score: 0 };
      const mockRoom = { id: mockRoomId, board: mockBoard };

      roomValidators.validateAwardPoints.mockReturnValue({
        success: true,
        data: { roomId: mockRoomId, team: mockTeam, points: mockPoints }
      });

      roomService.awardPoints.mockReturnValue(mockBoard);
      roomService.getRoom.mockReturnValue(mockRoom);

      roomController.awardPoints(mockSocket, mockIo, {
        roomId: mockRoomId,
        team: mockTeam,
        points: mockPoints
      });

      expect(roomService.awardPoints).toHaveBeenCalledWith(mockRoomId, mockTeam, mockPoints);
      expect(mockIo.to).toHaveBeenCalledWith(mockRoomId);
    });

    it('should emit error when validation fails', () => {
      roomValidators.validateAwardPoints.mockReturnValue({
        success: false,
        message: 'Invalid points'
      });

      roomController.awardPoints(mockSocket, mockIo, {
        roomId: 'TEST',
        team: 1,
        points: -10
      });

      expect(mockSocket.emit).toHaveBeenCalledWith('error', { message: 'Invalid points' });
    });
  });

  describe('loadRound', () => {
    it('should load round successfully', () => {
      const mockRoomId = 'TEST';
      const mockRoundData = {
        question: 'Test question',
        answers: [{ text: 'Answer', score: 30 }],
        type: 'simple'
      };
      const mockRoom = {
        id: mockRoomId,
        board: mockRoundData
      };

      roomValidators.validateLoadRound.mockReturnValue({
        success: true,
        data: { roomId: mockRoomId, roundData: mockRoundData }
      });

      roomService.loadRound.mockReturnValue(mockRoom);

      roomController.loadRound(mockSocket, mockIo, {
        roomId: mockRoomId,
        roundData: mockRoundData
      });

      expect(roomService.loadRound).toHaveBeenCalledWith(mockRoomId, mockRoundData);
      expect(mockIo.to).toHaveBeenCalledWith(mockRoomId);
    });

    it('should emit error when validation fails', () => {
      roomValidators.validateLoadRound.mockReturnValue({
        success: false,
        message: 'Invalid round data'
      });

      roomController.loadRound(mockSocket, mockIo, {
        roomId: 'TEST',
        roundData: {}
      });

      expect(mockSocket.emit).toHaveBeenCalledWith('error', { message: 'Invalid round data' });
    });
  });

  describe('pressBuzzer', () => {
    it('should press buzzer successfully', () => {
      const mockRoomId = 'TEST';
      const mockTeam = 1;
      const mockBuzzer = {
        team1Pressed: true,
        team2Pressed: false,
        winner: mockTeam
      };
      const mockRoom = { id: mockRoomId, buzzer: mockBuzzer };

      roomValidators.validateBuzzerPress.mockReturnValue({
        success: true,
        data: { roomId: mockRoomId, team: mockTeam }
      });

      roomService.pressBuzzer.mockReturnValue(mockBuzzer);
      roomService.getRoom.mockReturnValue(mockRoom);

      roomController.pressBuzzer(mockSocket, mockIo, {
        roomId: mockRoomId,
        team: mockTeam
      });

      expect(roomService.pressBuzzer).toHaveBeenCalledWith(mockRoomId, mockTeam);
      expect(mockIo.to).toHaveBeenCalledWith(mockRoomId);
    });

    it('should emit error when validation fails', () => {
      roomValidators.validateBuzzerPress.mockReturnValue({
        success: false,
        message: 'Invalid team'
      });

      roomController.pressBuzzer(mockSocket, mockIo, {
        roomId: 'TEST',
        team: 3
      });

      expect(mockSocket.emit).toHaveBeenCalledWith('error', { message: 'Invalid team' });
    });
  });

  describe('resetBuzzer', () => {
    it('should reset buzzer successfully', () => {
      const mockRoomId = 'TEST';
      const mockBuzzer = {
        team1Pressed: false,
        team2Pressed: false,
        winner: null
      };
      const mockRoom = { id: mockRoomId, buzzer: mockBuzzer };

      roomValidators.validateResetBuzzer.mockReturnValue({
        success: true,
        data: { roomId: mockRoomId }
      });

      roomService.resetBuzzer.mockReturnValue(mockRoom);

      roomController.resetBuzzer(mockSocket, mockIo, { roomId: mockRoomId });

      expect(roomService.resetBuzzer).toHaveBeenCalledWith(mockRoomId);
      expect(mockIo.to).toHaveBeenCalledWith(mockRoomId);
    });

    it('should emit error when validation fails', () => {
      roomValidators.validateResetBuzzer.mockReturnValue({
        success: false,
        message: 'Invalid roomId'
      });

      roomController.resetBuzzer(mockSocket, mockIo, { roomId: '' });

      expect(mockSocket.emit).toHaveBeenCalledWith('error', { message: 'Invalid roomId' });
    });
  });

  describe('toggleSound', () => {
    it('should toggle sound successfully', () => {
      const mockRoomId = 'TEST';
      const mockEnabled = true;

      roomValidators.validateToggleSound.mockReturnValue({
        success: true,
        data: { roomId: mockRoomId, enabled: mockEnabled }
      });

      roomController.toggleSound(mockSocket, mockIo, {
        roomId: mockRoomId,
        enabled: mockEnabled
      });

      expect(mockIo.to).toHaveBeenCalledWith(mockRoomId);
      expect(mockIo.to().emit).toHaveBeenCalledWith('sound_toggled', { enabled: mockEnabled });
    });

    it('should emit error when validation fails', () => {
      roomValidators.validateToggleSound.mockReturnValue({
        success: false,
        message: 'Invalid enabled'
      });

      roomController.toggleSound(mockSocket, mockIo, {
        roomId: 'TEST',
        enabled: 'yes'
      });

      expect(mockSocket.emit).toHaveBeenCalledWith('error', { message: 'Invalid enabled' });
    });
  });
});
