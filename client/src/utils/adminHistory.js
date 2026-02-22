class AdminHistoryManager {
  constructor(maxHistoryLength = 5) {
    this.history = []
    this.maxHistoryLength = maxHistoryLength
  }

  addAction(action) {
    this.history.push({
      ...action,
      timestamp: Date.now(),
      time: new Date().toLocaleTimeString('ru-RU', { timeStyle: 'short' })
    })

    if (this.history.length > this.maxHistoryLength) {
      this.history.shift()
    }

    return this
  }

  undo() {
    if (this.history.length === 0) {
      return null
    }

    const lastAction = this.history.pop()
    return lastAction
  }

  peek() {
    return this.history.length > 0 ? this.history[this.history.length - 1] : null
  }

  getHistory() {
    return [...this.history]
  }

  clear() {
    this.history = []
    return this
  }

  canUndo() {
    return this.history.length > 0
  }

  getHistoryLength() {
    return this.history.length
  }

  createAnswerRevealAction(roomId, answerIndex, answer, bank) {
    return {
      type: 'reveal_answer',
      roomId,
      data: { answerIndex, answer, bankBefore: bank },
      undo: () => {
        return {
          type: 'hide_answer',
          roomId,
          answerIndex
        }
      }
    }
  }

  createAddMistakeAction(roomId, mistakes) {
    return {
      type: 'add_mistake',
      roomId,
      data: { mistakes: mistakes - 1 },
      undo: () => {
        return {
          type: 'remove_mistake',
          roomId
        }
      }
    }
  }

  createSwitchTeamAction(roomId, previousTeam) {
    return {
      type: 'switch_team',
      roomId,
      data: { previousTeam },
      undo: () => {
        return {
          type: 'switch_team',
          roomId,
          toTeam: previousTeam
        }
      }
    }
  }

  createAwardPointsAction(roomId, team, points) {
    return {
      type: 'award_points',
      roomId,
      data: { team, points },
      undo: () => {
        return {
          type: 'remove_points',
          roomId,
          team,
          points
        }
      }
    }
  }

  createResetBuzzerAction(roomId, previousState) {
    return {
      type: 'reset_buzzer',
      roomId,
      data: { previousState },
      undo: () => {
        return {
          type: 'restore_buzzer',
          roomId,
          state: previousState
        }
      }
    }
  }

  createLoadRoundAction(roomId, previousRound, currentRound) {
    return {
      type: 'load_round',
      roomId,
      data: { previousRound, currentRound },
      undo: () => {
        return {
          type: 'load_round',
          roomId,
          roundData: previousRound
        }
      }
    }
  }

  replayAction(action, socket) {
    if (!socket) {
      throw new Error('Socket not provided')
    }

    switch (action.type) {
      case 'reveal_answer':
        return socket.revealAnswer(action.roomId, action.data.answerIndex)
      
      case 'add_mistake':
        return socket.addMistake(action.roomId)
      
      case 'switch_team':
        return socket.switchTeam(action.roomId)
      
      case 'award_points':
        return socket.awardPoints(action.roomId, action.data.team, action.data.points)
      
      case 'reset_buzzer':
        return socket.resetBuzzer(action.roomId)
      
      case 'load_round':
        return socket.loadRound(action.roomId, action.data.roundData)
      
      default:
        throw new Error(`Unknown action type: ${action.type}`)
    }
  }
}

export default AdminHistoryManager
