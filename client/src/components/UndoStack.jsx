import React from 'react'
import PropTypes from 'prop-types'
import AdminHistoryManager from '../utils/adminHistory'
import toaster from '../utils/toaster'

function UndoStack({ 
  history = [], 
  onUndo, 
  maxHistory = 5 
}) {
  const getActionLabel = (action) => {
    switch (action.type) {
      case 'reveal_answer':
        return `Открыт ответ #${action.data.answerIndex + 1}`
      case 'add_mistake':
        return `Добавлен промах (${action.data.mistakes} / 3)`
      case 'switch_team':
        return `Смена хода на Команду ${action.data.previousTeam === 1 ? 2 : 1}`
      case 'award_points':
        return `Начислено ${action.data.points} очков Команде ${action.data.team}`
      case 'reset_buzzer':
        return 'Сброс кнопки'
      case 'load_round':
        return `Загружен раунд: ${action.data.currentRound?.type || 'unknown'}`
      default:
        return action.type
    }
  }

  const getActionIcon = (action) => {
    switch (action.type) {
      case 'reveal_answer':
        return '👁️'
      case 'add_mistake':
        return '❌'
      case 'switch_team':
        return '🔄'
      case 'award_points':
        return '⭐'
      case 'reset_buzzer':
        return '🔘'
      case 'load_round':
        return '📋'
      default:
        return '•'
    }
  }

  const handleUndo = () => {
    if (onUndo) {
      onUndo()
    }
  }

  const canUndo = history.length > 0

  if (history.length === 0) {
    return null
  }

  return (
    <div className="undo-stack">
      <div className="undo-header">
        <h4>История действий ({history.length}/{maxHistory})</h4>
        {canUndo && (
          <button 
            className="undo-all-btn"
            onClick={handleUndo}
            title="Отменить последнее действие"
          >
            ↩ Отменить
          </button>
        )}
      </div>
      
      <div className="undo-list">
        {history.slice().reverse().map((action, index) => (
          <div key={action.timestamp || index} className="undo-item">
            <span className="undo-icon">{getActionIcon(action)}</span>
            <span className="undo-label">{getActionLabel(action)}</span>
            <span className="undo-time">{action.time || ''}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

UndoStack.propTypes = {
  history: PropTypes.arrayOf(
    PropTypes.shape({
      type: PropTypes.string.isRequired,
      roomId: PropTypes.string,
      data: PropTypes.object,
      timestamp: PropTypes.number,
      time: PropTypes.string
    })
  ).isRequired,
  onUndo: PropTypes.func.isRequired,
  maxHistory: PropTypes.number
}

export default UndoStack
