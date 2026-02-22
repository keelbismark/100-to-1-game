export const GameManager = {
  STORAGE_KEY: '100_to_1_game',

  saveGameState(gameState) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(gameState))
      return true
    } catch (error) {
      console.error('Error saving game state:', error)
      return false
    }
  },

  loadGameState() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY)
      return saved ? JSON.parse(saved) : null
    } catch (error) {
      console.error('Error loading game state:', error)
      return null
    }
  },

  clearGameState() {
    try {
      localStorage.removeItem(this.STORAGE_KEY)
      return true
    } catch (error) {
      console.error('Error clearing game state:', error)
      return false
    }
  },

  saveCustomPacks(packs) {
    try {
      localStorage.setItem('custom_packs', JSON.stringify(packs))
      return true
    } catch (error) {
      console.error('Error saving custom packs:', error)
      return false
    }
  },

  loadCustomPacks() {
    try {
      const saved = localStorage.getItem('custom_packs')
      return saved ? JSON.parse(saved) : []
    } catch (error) {
      console.error('Error loading custom packs:', error)
      return []
    }
  },

  saveRecentRoom(roomId) {
    try {
      let recent = this.loadRecentRooms()
      recent = recent.filter(r => r !== roomId)
      recent.unshift(roomId)
      recent = recent.slice(0, 10)
      localStorage.setItem('recent_rooms', JSON.stringify(recent))
      return true
    } catch (error) {
      console.error('Error saving recent room:', error)
      return false
    }
  },

  loadRecentRooms() {
    try {
      const saved = localStorage.getItem('recent_rooms')
      return saved ? JSON.parse(saved) : []
    } catch (error) {
      console.error('Error loading recent rooms:', error)
      return []
    }
  },

  saveVolumeSettings(volume) {
    try {
      localStorage.setItem('volume_settings', JSON.stringify(volume))
      return true
    } catch (error) {
      console.error('Error saving volume settings:', error)
      return false
    }
  },

  loadVolumeSettings() {
    try {
      const saved = localStorage.getItem('volume_settings')
      return saved ? JSON.parse(saved) : { master: 0.7, effects: 0.7, music: 0.5 }
    } catch (error) {
      console.error('Error loading volume settings:', error)
      return { master: 0.7, effects: 0.7, music: 0.5 }
    }
  },

  savePlayerSettings(settings) {
    try {
      localStorage.setItem('player_settings', JSON.stringify(settings))
      return true
    } catch (error) {
      console.error('Error saving player settings:', error)
      return false
    }
  },

  loadPlayerSettings() {
    try {
      const saved = localStorage.getItem('player_settings')
      return saved ? JSON.parse(saved) : {
        theme: 'dark',
        language: 'ru',
        autoConnect: true,
        showHints: true
      }
    } catch (error) {
      console.error('Error loading player settings:', error)
      return {
        theme: 'dark',
        language: 'ru',
        autoConnect: true,
        showHints: true
      }
    }
  }
}

export const validatePack = (pack) => {
  const errors = []

  if (!pack.pack_id || typeof pack.pack_id !== 'string') {
    errors.push('Missing or invalid pack_id')
  }

  if (!pack.title || typeof pack.title !== 'string') {
    errors.push('Missing or invalid title')
  }

  if (!pack.rounds || typeof pack.rounds !== 'object') {
    errors.push('Missing or invalid rounds')
  } else {
    const requiredRounds = ['simple', 'double', 'triple', 'reverse', 'big_game']
    
    requiredRounds.forEach(roundType => {
      if (!pack.rounds[roundType]) {
        errors.push(`Missing round: ${roundType}`)
      } else {
        if (roundType !== 'big_game') {
          if (!pack.rounds[roundType].question) {
            errors.push(`Missing question in ${roundType} round`)
          }
          if (!Array.isArray(pack.rounds[roundType].answers) || pack.rounds[roundType].answers.length !== 6) {
            errors.push(`${roundType} round must have exactly 6 answers`)
          }
        } else {
          if (!Array.isArray(pack.rounds.big_game) || pack.rounds.big_game.length !== 5) {
            errors.push('Big game must have exactly 5 questions')
          }
        }
      }
    })
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export const calculateTotalScore = (answers, revealedAnswers, packAnswers) => {
  let total = 0
  
  revealedAnswers.forEach(index => {
    if (packAnswers[index]) {
      total += packAnswers[index].score
    }
  })
  
  return total
}

export const formatScore = (score) => {
  return score.toLocaleString('ru-RU')
}

export const getAnswerStatus = (index, revealedAnswers, mistakes, maxMistakes) => {
  if (revealedAnswers.includes(index)) {
    return 'revealed'
  }
  
  if (mistakes >= maxMistakes) {
    return 'locked'
  }
  
  return 'hidden'
}

export const getNextRevealableAnswerIndex = (answers, revealedAnswers) => {
  for (let i = 0; i < answers.length; i++) {
    if (!revealedAnswers.includes(i)) {
      return i
    }
  }
  return -1
}
