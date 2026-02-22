const roomValidators = require('../src/validators/room.validator');

describe('RoomValidators', () => {
  describe('validateCreateRoom', () => {
    it('should validate valid packId', () => {
      const result = roomValidators.validateCreateRoom({ packId: 'pack1' });

      expect(result.success).toBe(true);
      expect(result.data.packId).toBe('pack1');
    });

    it('should fail when packId is missing', () => {
      const result = roomValidators.validateCreateRoom({});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Validation error');
    });

    it('should fail when packId is empty', () => {
      const result = roomValidators.validateCreateRoom({ packId: '' });

      expect(result.success).toBe(false);
    });

    it('should fail when packId is too long', () => {
      const result = roomValidators.validateCreateRoom({ packId: 'a'.repeat(51) });

      expect(result.success).toBe(false);
    });
  });

  describe('validateJoinRoom', () => {
    it('should validate valid room data', () => {
      const result = roomValidators.validateJoinRoom({
        roomId: 'ABCD',
        role: 'board'
      });

      expect(result.success).toBe(true);
      expect(result.data.roomId).toBe('ABCD');
      expect(result.data.role).toBe('board');
    });

    it('should accept all valid roles', () => {
      ['board', 'admin', 'buzzer'].forEach(role => {
        const result = roomValidators.validateJoinRoom({
          roomId: 'ABCD',
          role
        });

        expect(result.success).toBe(true);
      });
    });

    it('should fail with invalid roleId format', () => {
      const result = roomValidators.validateJoinRoom({
        roomId: 'abc',
        role: 'board'
      });

      expect(result.success).toBe(false);
    });

    it('should fail with invalid role', () => {
      const result = roomValidators.validateJoinRoom({
        roomId: 'ABCD',
        role: 'invalid'
      });

      expect(result.success).toBe(false);
    });
  });

  describe('validateSetTeam', () => {
    it('should validate valid team data', () => {
      const result = roomValidators.validateSetTeam({
        roomId: 'ABCD',
        team: 1
      });

      expect(result.success).toBe(true);
      expect(result.data.team).toBe(1);
    });

    it('should accept both team values', () => {
      [1, 2].forEach(team => {
        const result = roomValidators.validateSetTeam({
          roomId: 'ABCD',
          team
        });

        expect(result.success).toBe(true);
      });
    });

    it('should fail with invalid team value', () => {
      const result = roomValidators.validateSetTeam({
        roomId: 'ABCD',
        team: 3
      });

      expect(result.success).toBe(false);
    });
  });

  describe('validateRevealAnswer', () => {
    it('should validate valid reveal data', () => {
      const result = roomValidators.validateRevealAnswer({
        roomId: 'ABCD',
        answerIndex: 0
      });

      expect(result.success).toBe(true);
      expect(result.data.answerIndex).toBe(0);
    });

    it('should fail with negative answerIndex', () => {
      const result = roomValidators.validateRevealAnswer({
        roomId: 'ABCD',
        answerIndex: -1
      });

      expect(result.success).toBe(false);
    });

    it('should fail with too large answerIndex', () => {
      const result = roomValidators.validateRevealAnswer({
        roomId: 'ABCD',
        answerIndex: 101
      });

      expect(result.success).toBe(false);
    });
  });

  describe('validateAddMistake', () => {
    it('should validate valid mistake data', () => {
      const result = roomValidators.validateAddMistake({
        roomId: 'ABCD'
      });

      expect(result.success).toBe(true);
    });

    it('should fail when roomId is missing', () => {
      const result = roomValidators.validateAddMistake({});

      expect(result.success).toBe(false);
    });
  });

  describe('validateSwitchTeam', () => {
    it('should validate valid switch team data', () => {
      const result = roomValidators.validateSwitchTeam({
        roomId: 'ABCD'
      });

      expect(result.success).toBe(true);
    });
  });

  describe('validateAwardPoints', () => {
    it('should validate valid award points data', () => {
      const result = roomValidators.validateAwardPoints({
        roomId: 'ABCD',
        team: 1,
        points: 50
      });

      expect(result.success).toBe(true);
      expect(result.data.points).toBe(50);
    });

    it('should fail with negative points', () => {
      const result = roomValidators.validateAwardPoints({
        roomId: 'ABCD',
        team: 1,
        points: -10
      });

      expect(result.success).toBe(false);
    });
  });

  describe('validateLoadRound', () => {
    it('should validate valid round data', () => {
      const result = roomValidators.validateLoadRound({
        roomId: 'ABCD',
        roundData: {
          question: 'Test question?',
          answers: [
            { text: 'Answer 1', score: 30 },
            { text: 'Answer 2', score: 25 }
          ],
          type: 'simple'
        }
      });

      expect(result.success).toBe(true);
    });

    it('should accept all valid round types', () => {
      ['simple', 'double', 'triple', 'reverse'].forEach(type => {
        const result = roomValidators.validateLoadRound({
          roomId: 'ABCD',
          roundData: {
            question: 'Test?',
            answers: [{ text: 'Answer', score: 10 }],
            type
          }
        });

        expect(result.success).toBe(true);
      });
    });

    it('should fail with invalid round type', () => {
      const result = roomValidators.validateLoadRound({
        roomId: 'ABCD',
        roundData: {
          question: 'Test?',
          answers: [],
          type: 'invalid'
        }
      });

      expect(result.success).toBe(false);
    });
  });

  describe('validateBuzzerPress', () => {
    it('should validate valid buzzer press data', () => {
      const result = roomValidators.validateBuzzerPress({
        roomId: 'ABCD',
        team: 1,
        timestamp: 1234567890
      });

      expect(result.success).toBe(true);
    });

    it('should accept data without timestamp', () => {
      const result = roomValidators.validateBuzzerPress({
        roomId: 'ABCD',
        team: 1
      });

      expect(result.success).toBe(true);
    });

    it('should fail with invalid team', () => {
      const result = roomValidators.validateBuzzerPress({
        roomId: 'ABCD',
        team: 3
      });

      expect(result.success).toBe(false);
    });
  });

  describe('validateResetBuzzer', () => {
    it('should validate valid reset buzzer data', () => {
      const result = roomValidators.validateResetBuzzer({
        roomId: 'ABCD'
      });

      expect(result.success).toBe(true);
    });
  });

  describe('validateToggleSound', () => {
    it('should validate valid toggle sound data', () => {
      const result = roomValidators.validateToggleSound({
        roomId: 'ABCD',
        enabled: true
      });

      expect(result.success).toBe(true);
      expect(result.data.enabled).toBe(true);
    });

    it('should accept both boolean values', () => {
      [true, false].forEach(enabled => {
        const result = roomValidators.validateToggleSound({
          roomId: 'ABCD',
          enabled
        });

        expect(result.success).toBe(true);
      });
    });

    it('should fail without enabled field', () => {
      const result = roomValidators.validateToggleSound({
        roomId: 'ABCD'
      });

      expect(result.success).toBe(false);
    });
  });
});
