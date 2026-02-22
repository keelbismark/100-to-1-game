import React from 'react'
import PropTypes from 'prop-types'

function RoundSelector({ selectedRound, onSelectRound }) {
  const rounds = [
    { type: 'simple', label: 'Простой раунд' },
    { type: 'double', label: 'Двойной раунд' },
    { type: 'triple', label: 'Тройной раунд' },
    { type: 'reverse', label: 'Игра наоборот' },
    { type: 'big_game', label: 'Большая игра' }
  ]

  return (
    <div className="control-panel">
      <h2>Раунды</h2>
      <div className="round-buttons">
        {rounds.map(round => (
          <button
            key={round.type}
            className={`round-btn ${selectedRound === round.type ? 'active' : ''}`}
            onClick={() => onSelectRound(round.type)}
          >
            {round.label}
          </button>
        ))}
      </div>
    </div>
  )
}

RoundSelector.propTypes = {
  selectedRound: PropTypes.oneOf([
    'simple',
    'double',
    'triple',
    'reverse',
    'big_game'
  ]).isRequired,
  onSelectRound: PropTypes.func.isRequired
}

export default RoundSelector
