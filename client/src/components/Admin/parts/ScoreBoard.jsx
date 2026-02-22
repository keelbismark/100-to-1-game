import React from 'react'
import PropTypes from 'prop-types'

function ScoreBoard({ board }) {
  return (
    <div className="control-panel">
      <h2>Счет</h2>
      <div className="scores">
        <div className="score-box">
          <h3>Команда 1: {board.team1Score}</h3>
        </div>
        <div className="score-box">
          <h3>Команда 2: {board.team2Score}</h3>
        </div>
      </div>
      <div className="bank-display">
        <div className="bank-label">Банк раунда</div>
        <div className="bank-value">{board.bank} очков</div>
      </div>
    </div>
  )
}

ScoreBoard.propTypes = {
  board: PropTypes.shape({
    team1Score: PropTypes.number.isRequired,
    team2Score: PropTypes.number.isRequired,
    bank: PropTypes.number.isRequired
  }).isRequired
}

export default ScoreBoard
