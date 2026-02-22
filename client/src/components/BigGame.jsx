import { useState } from 'react'
import PropTypes from 'prop-types'

function BigGame({ socket, gameState, roomId }) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [player1Answers, setPlayer1Answers] = useState([])
  const [player2Answers, setPlayer2Answers] = useState([])
  const [currentPlayer1Answer, setCurrentPlayer1Answer] = useState('')
  const [currentPlayer2Answer, setCurrentPlayer2Answer] = useState('')
  const [showScores, setShowScores] = useState(false)
  const [totalScore, setTotalScore] = useState(0)

  const gamePack = {
    packId: 'pack1',
    rounds: {
      big_game: [
        {
          question: 'Часть тела?',
          answers: [
            { text: 'Рука', score: 25, synonyms: ['Ладонь', 'Кисть'] },
            { text: 'Нога', score: 20 },
            { text: 'Голова', score: 15 },
            { text: 'Глаз', score: 12 },
            { text: 'Ухо', score: 10 },
            { text: 'Нос', score: 8 }
          ]
        },
        {
          question: 'Цвет?',
          answers: [
            { text: 'Красный', score: 30 },
            { text: 'Синий', score: 25 },
            { text: 'Зеленый', score: 20 },
            { text: 'Желтый', score: 15 },
            { text: 'Черный', score: 12 },
            { text: 'Белый', score: 10 }
          ]
        },
        {
          question: 'Животное?',
          answers: [
            { text: 'Кошка', score: 35 },
            { text: 'Собака', score: 30 },
            { text: 'Лошадь', score: 15 },
            { text: 'Корова', score: 12 },
            { text: 'Свинья', score: 10 },
            { text: 'Курица', score: 8 }
          ]
        },
        {
          question: 'Месяц года?',
          answers: [
            { text: 'Январь', score: 20 },
            { text: 'Декабрь', score: 18 },
            { text: 'Июль', score: 16 },
            { text: 'Август', score: 14 },
            { text: 'Март', score: 12 },
            { text: 'Май', score: 10 }
          ]
        },
        {
          question: 'Страна?',
          answers: [
            { text: 'Россия', score: 35 },
            { text: 'США', score: 25 },
            { text: 'Китай', score: 20 },
            { text: 'Германия', score: 15 },
            { text: 'Франция', score: 12 },
            { text: 'Италия', score: 10 }
          ]
        }
      ]
    }
  }

  const questions = gamePack.rounds.big_game
  const currentQuestionData = questions[currentQuestion]

  const addPlayer1Answer = () => {
    if (currentPlayer1Answer.trim()) {
      setPlayer1Answers([...player1Answers, currentPlayer1Answer])
      
      if (player1Answers.length + 1 >= 5) {
        setCurrentQuestion(prev => prev + 1)
      }
      
      setCurrentPlayer1Answer('')
    }
  }

  const addPlayer2Answer = () => {
    if (currentPlayer2Answer.trim()) {
      const isDuplicate = player1Answers.some(
        ans => ans.toLowerCase() === currentPlayer2Answer.toLowerCase()
      )
      
      if (isDuplicate) {
        alert('Повтор! Этот ответ уже был у игрока 1')
        setCurrentPlayer2Answer('')
        return
      }
      
      setPlayer2Answers([...player2Answers, currentPlayer2Answer])
      
      if (player2Answers.length + 1 >= 5) {
        calculateScores()
      }
      
      setCurrentPlayer2Answer('')
    }
  }

  const calculateScores = () => {
    let score = 0
    
    player1Answers.forEach(answer => {
      const found = currentQuestionData.answers.find(a => 
        a.text.toLowerCase() === answer.toLowerCase() || 
        (a.synonyms && a.synonyms.some(s => s.toLowerCase() === answer.toLowerCase()))
      )
      if (found) score += found.score
    })
    
    player2Answers.forEach(answer => {
      const found = currentQuestionData.answers.find(a => 
        a.text.toLowerCase() === answer.toLowerCase() || 
        (a.synonyms && a.synonyms.some(s => s.toLowerCase() === answer.toLowerCase()))
      )
      if (found) score += found.score
    })
    
    setTotalScore(score)
    setShowScores(true)
    
    socket.emit('award_points', { roomId, team: gameState?.board?.activeTeam || 1, points: score })
  }

  const resetBigGame = () => {
    setCurrentQuestion(0)
    setPlayer1Answers([])
    setPlayer2Answers([])
    setCurrentPlayer1Answer('')
    setCurrentPlayer2Answer('')
    setShowScores(false)
    setTotalScore(0)
  }

  if (!gameState || !currentQuestionData) {
    return <div className="loading">Загрузка...</div>
  }

  return (
    <div className="big-game-container">
      <div className="big-game-header">
        <h1>Большая игра</h1>
        <div className="question-number">
          Вопрос {currentQuestion + 1} из {questions.length}
        </div>
      </div>

      {!showScores ? (
        <div className="big-game-content">
          <div className="question-display">
            <h2>{currentQuestionData.question}</h2>
          </div>

          {currentQuestion < questions.length && (
            <div className="players-section">
              <div className="player-section">
                <h3>Игрок 1</h3>
                <div className="answers-list">
                  {player1Answers.map((answer, index) => (
                    <div key={index} className="answer-display">{answer}</div>
                  ))}
                </div>
                {player1Answers.length < 5 && (
                  <div className="answer-input">
                    <input
                      type="text"
                      value={currentPlayer1Answer}
                      onChange={(e) => setCurrentPlayer1Answer(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addPlayer1Answer()}
                      placeholder="Введите ответ"
                    />
                    <button onClick={addPlayer1Answer}>Добавить</button>
                  </div>
                )}
              </div>

              {currentQuestion >= questions.length && (
                <div className="player-section">
                  <h3>Игрок 2</h3>
                  <div className="answers-list">
                    {player2Answers.map((answer, index) => (
                      <div key={index} className="answer-display">{answer}</div>
                    ))}
                  </div>
                  {player2Answers.length < 5 && (
                    <div className="answer-input">
                      <input
                        type="text"
                        value={currentPlayer2Answer}
                        onChange={(e) => setCurrentPlayer2Answer(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addPlayer2Answer()}
                        placeholder="Введите ответ"
                      />
                      <button onClick={addPlayer2Answer}>Добавить</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="available-answers">
            <h3>Возможные ответы (скрыто от игроков)</h3>
            <div className="answers-grid">
              {currentQuestionData.answers.map((answer, index) => (
                <div key={index} className="answer-hint">
                  <span className="answer-score">{answer.score}</span>
                  <span className="answer-text">{answer.text}</span>
                  {answer.synonyms && (
                    <span className="answer-synonyms">({answer.synonyms.join(', ')})</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="big-game-results">
          <h2>Результаты большой игры</h2>
          <div className="total-score">
            Общий счет: {totalScore} очков
          </div>
          <div className="score-breakdown">
            <h3>Детали:</h3>
            <div className="player-scores">
              <div>
                <strong>Игрок 1 ({player1Answers.length} ответов):</strong>
                {player1Answers.map((answer, index) => {
                  const found = currentQuestionData.answers.find(a => 
                    a.text.toLowerCase() === answer.toLowerCase() || 
                    (a.synonyms && a.synonyms.some(s => s.toLowerCase() === answer.toLowerCase()))
                  )
                  return (
                    <div key={index} className={found ? 'correct-answer' : 'wrong-answer'}>
                      {answer} {found ? `(+${found.score})` : '(0)'}
                    </div>
                  )
                })}
              </div>
              <div>
                <strong>Игрок 2 ({player2Answers.length} ответов):</strong>
                {player2Answers.map((answer, index) => {
                  const found = currentQuestionData.answers.find(a => 
                    a.text.toLowerCase() === answer.toLowerCase() || 
                    (a.synonyms && a.synonyms.some(s => s.toLowerCase() === answer.toLowerCase()))
                  )
                  return (
                    <div key={index} className={found ? 'correct-answer' : 'wrong-answer'}>
                      {answer} {found ? `(+${found.score})` : '(0)'}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
          <div className="action-buttons">
            <button onClick={resetBigGame} className="btn btn-primary">
              Начать заново
            </button>
            <button onClick={() => window.history.back()} className="btn btn-secondary">
              Вернуться к игре
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

BigGame.propTypes = {
  socket: PropTypes.object.isRequired,
  gameState: PropTypes.object,
  roomId: PropTypes.string.isRequired
}

export default BigGame
