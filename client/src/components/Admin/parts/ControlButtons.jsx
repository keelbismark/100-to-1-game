import React from 'react'
import PropTypes from 'prop-types'

function ControlButtons({ board, onAddMistake, onSwitchTeam, onAwardPoints, onResetBuzzer, onToggleSound, soundEnabled }) {
  return (
    <div className="control-panel">
      <h2>Управление</h2>
      <div className="action-buttons">
        <button className="action-btn mistake-btn" onClick={onAddMistake}>
          Промах ({board.mistakes}/3)
        </button>
        
        <button className="action-btn team-btn" onClick={onSwitchTeam}>
          Передать ход (Сейчас: Команда {board.activeTeam})
        </button>
        
        <button className="action-btn award-btn" onClick={onAwardPoints}>
          Начислить очки ({board.bank})
        </button>
        
        <button 
          className="action-btn team-btn"
          onClick={onResetBuzzer}
        >
          Сброс кнопки
        </button>
        
        <button 
          className="action-btn team-btn"
          onClick={onToggleSound}
        >
          {soundEnabled ? 'Выключить звук' : 'Включить звук'}
        </button>
      </div>
    </div>
  )
}

ControlButtons.propTypes = {
  board: PropTypes.shape({
    mistakes: PropTypes.number.isRequired,
    activeTeam: PropTypes.number.isRequired,
    bank: PropTypes.number.isRequired
  }).isRequired,
  onAddMistake: PropTypes.func.isRequired,
  onSwitchTeam: PropTypes.func.isRequired,
  onAwardPoints: PropTypes.func.isRequired,
  onResetBuzzer: PropTypes.func.isRequired,
  onToggleSound: PropTypes.func.isRequired,
  soundEnabled: PropTypes.bool.isRequired
}

export default ControlButtons
