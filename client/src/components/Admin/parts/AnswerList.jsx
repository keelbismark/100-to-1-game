import React from 'react'
import PropTypes from 'prop-types'

function AnswerList({ round, board, onRevealAnswer }) {
  if (!round || !round.answers) {
    return null
  }

  return (
    <div className="control-panel">
      <h2>Вопрос: {round.question}</h2>
      <div className="answers-list">
        {round.answers.map((answer, index) => {
          const isRevealed = board.revealed && board.revealed.includes(index)
          return (
            <div key={index} className={`answer-item ${isRevealed ? 'revealed' : ''}`}>
              <div className="answer-info">
                <div className="answer-number">{index + 1}</div>
                <div className="answer-text-admin">{answer.text}</div>
                <div className="answer-score-admin">{answer.score}</div>
              </div>
              <button
                className={`answer-btn ${isRevealed ? 'disabled' : ''}`}
                onClick={() => onRevealAnswer(index)}
                disabled={isRevealed}
              >
                {isRevealed ? 'Открыто' : 'Открыть'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

AnswerList.propTypes = {
  round: PropTypes.shape({
    question: PropTypes.string.isRequired,
    answers: PropTypes.arrayOf(
      PropTypes.shape({
        text: PropTypes.string.isRequired,
        score: PropTypes.number.isRequired
      })
    ).isRequired
  }),
  board: PropTypes.shape({
    revealed: PropTypes.arrayOf(PropTypes.number)
  }),
  onRevealAnswer: PropTypes.func.isRequired
}

AnswerList.defaultProps = {
  board: {
    revealed: []
  }
}

export default AnswerList
