import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Howl } from 'howler'
import { Tooltip } from 'react-tooltip'
import toaster from '../../utils/toaster'
import 'react-tooltip/dist/react-tooltip.css'

function Board({ socket, gameState }) {
  const [soundEnabled, setSoundEnabled] = useState(false)
  const [showStartOverlay, setShowStartOverlay] = useState(true)
  const [mistakes, setMistakes] = useState(0)
  const [loading, setLoading] = useState(true)

  const sounds = {
    reveal: new Howl({
      src: ['/sounds/reveal.mp3'],
      volume: 0.7
    }),
    mistake: new Howl({
      src: ['/sounds/mistake.mp3'],
      volume: 0.7
    }),
    wrong: new Howl({
      src: ['/sounds/wrong.mp3'],
      volume: 0.7
    }),
    winner: new Howl({
      src: ['/sounds/winner.mp3'],
      volume: 0.7
    })
  }

  useEffect(() => {
    if (!socket) return

    const handleRoomUpdated = (room) => {
      if (room && room.board) {
        setLoading(false)
      }
    }

    const handleAnswerRevealed = ({ answerIndex }) => {
      if (soundEnabled) {
        sounds.reveal.play()
      }
    }

    const handleMistakeAdded = ({ mistakes: newMistakes }) => {
      setMistakes(newMistakes)
      if (soundEnabled) {
        if (newMistakes === 3) {
          sounds.wrong.play()
        } else {
          sounds.mistake.play()
        }
      }
      
      if (newMistakes >= 3) {
        toaster.warning('Максимум промахов! Смена хода.')
      }
    }

    const handleBuzzerPressed = ({ winner }) => {
      if (soundEnabled && winner) {
        sounds.winner.play()
      }
    }

    const handleSoundToggled = ({ enabled }) => {
      setSoundEnabled(enabled)
    }

    socket.on('room_updated', handleRoomUpdated)
    socket.on('answer_revealed', handleAnswerRevealed)
    socket.on('mistake_added', handleMistakeAdded)
    socket.on('buzzer_pressed', handleBuzzerPressed)
    socket.on('sound_toggled', handleSoundToggled)

    return () => {
      socket.off('room_updated', handleRoomUpdated)
      socket.off('answer_revealed', handleAnswerRevealed)
      socket.off('mistake_added', handleMistakeAdded)
      socket.off('buzzer_pressed', handleBuzzerPressed)
      socket.off('sound_toggled', handleSoundToggled)
    }
  }, [socket, soundEnabled])

  const handleStartGame = () => {
    setShowStartOverlay(false)
    setSoundEnabled(true)
    toaster.success('Игра началась! 🎉')
  }

  const renderMistakes = () => {
    const xMarks = ['X', 'XX', 'XXX']
    return xMarks.slice(0, mistakes).map((mark, index) => (
      <div key={index} className={`mistake visible`}>{mark}</div>
    ))
  }

  if (loading) {
    return (
      <div className="board-container">
        <h1 className="board-title">Загрузка...</h1>
      </div>
    )
  }

  if (!gameState || !gameState.board) {
    return (
      <div className="board-container">
        <h1 className="board-title">Данные загружаются или комната не найдена</h1>
      </div>
    )
  }

  const { board } = gameState
  const revealedCount = board.revealed ? board.revealed.length : 0
  const totalAnswers = board.answers ? board.answers.length : 0
  const progressPercentage = totalAnswers > 0 ? (revealedCount / totalAnswers) * 100 : 0

  return (
    <div className="board-container">
      {showStartOverlay && (
        <div className="start-overlay">
          <div className="start-overlay-content">
            <h2>Добро пожаловать в &quot;Сто к Одному&quot;!</h2>
            <p>Нажмите кнопку ниже чтобы включить звук и начать игру</p>
            <button onClick={handleStartGame} className="start-button">
              🎵 Начать игру
            </button>
          </div>
        </div>
      )}

      <div className="board-header">
        <div className="header-content">
          <h1 className="board-title">СТО К ОДНОМУ</h1>
          <div className="room-info">
            Комната: <span className="code">{gameState.id}</span>
          </div>
        </div>
      </div>

      <div className="turn-indicator">
        <div className={`turn-badge team-${board.activeTeam}`}>
          {board.activeTeam === 1 ? '🔵 Команда 1 думает' : '🔴 Команда 2 думает'}
        </div>
        {mistakes >= 3 && (
          <div className="turn-badge warning">
            ⚠️ Смена хода
          </div>
        )}
      </div>

      <div className="scores">
        <div className={`score-box ${board.activeTeam === 1 ? 'active' : ''}`} data-tip={`Команда ${board.activeTeam === 1 ? 'думает сейчас' : 'ждет хода'}`} data-place="bottom">
          <h3>🔵 Команда 1</h3>
          <div className="score">{board.team1Score}</div>
        </div>
        <div className={`score-box ${board.activeTeam === 2 ? 'active' : ''}`} data-tip={`Команда ${board.activeTeam === 2 ? 'думает сейчас' : 'ждет хода'}`} data-place="bottom">
          <h3>🔴 Команда 2</h3>
          <div className="score">{board.team2Score}</div>
        </div>
      </div>

      <div className="bank-display" data-tip="Очки банка текущего раунда">
        <div className="bank-label">🏦 Банк раунда</div>
        <div className="bank-value">{board.bank} очков</div>
      </div>

      <div className="progress-bar-container">
        <div className="progress-label">
          Прогресс: {revealedCount}/{totalAnswers} ({progressPercentage.toFixed(0)}%)
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      <div className="board-grid">
        {board.answers && board.answers.map((answer, index) => {
          const isRevealed = board.revealed && board.revealed.includes(index)
          return (
            <div 
              key={index} 
              className={`answer-card ${isRevealed ? 'revealed' : ''}`}
              data-tooltip-id={`answer-${index}`}
            >
              <div className={`answer-text ${isRevealed ? 'visible' : 'hidden'}`}>
                {isRevealed ? answer.text : '???'} {index + 1}
              </div>
              <div className={`answer-score ${isRevealed ? 'visible' : 'hidden'}`}>
                {isRevealed ? answer.score : ''}
              </div>
              <Tooltip id={`answer-${index}`} place="top" effect="solid">
                {isRevealed ? `${answer.text}: ${answer.score} очков` : 'Не открыт'}
              </Tooltip>
            </div>
          )
        })}
      </div>

      <div className="mistakes-container">
        {renderMistakes()}
      </div>

      <Tooltip effect="solid" place="bottom" />
    </div>
  )
}

Board.propTypes = {
  socket: PropTypes.object.isRequired,
  gameState: PropTypes.object
}

export default Board
