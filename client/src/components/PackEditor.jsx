import { useState } from 'react'
import PropTypes from 'prop-types'

function PackEditor({ onSave, onCancel }) {
  const [packData, setPackData] = useState({
    pack_id: '',
    title: '',
    description: '',
    rounds: {
      simple: {
        question: '',
        answers: [
          { text: '', score: 0 },
          { text: '', score: 0 },
          { text: '', score: 0 },
          { text: '', score: 0 },
          { text: '', score: 0 },
          { text: '', score: 0 }
        ]
      },
      double: {
        question: '',
        answers: [
          { text: '', score: 0 },
          { text: '', score: 0 },
          { text: '', score: 0 },
          { text: '', score: 0 },
          { text: '', score: 0 },
          { text: '', score: 0 }
        ]
      },
      triple: {
        question: '',
        answers: [
          { text: '', score: 0 },
          { text: '', score: 0 },
          { text: '', score: 0 },
          { text: '', score: 0 },
          { text: '', score: 0 },
          { text: '', score: 0 }
        ]
      },
      reverse: {
        question: '',
        answers: [
          { text: '', score: 0 },
          { text: '', score: 0 },
          { text: '', score: 0 },
          { text: '', score: 0 },
          { text: '', score: 0 },
          { text: '', score: 0 }
        ]
      },
      big_game: Array(5).fill(null).map(() => ({
        question: '',
        answers: [
          { text: '', score: 0, synonyms: [] }
        ]
      }))
    }
  })

  const [activeRound, setActiveRound] = useState('simple')

  const updatePackField = (field, value) => {
    setPackData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const updateRoundField = (roundType, field, value) => {
    setPackData(prev => ({
      ...prev,
      rounds: {
        ...prev.rounds,
        [roundType]: {
          ...prev.rounds[roundType],
          [field]: value
        }
      }
    }))
  }

  const updateAnswer = (roundType, answerIndex, field, value) => {
    setPackData(prev => ({
      ...prev,
      rounds: {
        ...prev.rounds,
        [roundType]: {
          ...prev.rounds[roundType],
          answers: prev.rounds[roundType].answers.map((answer, index) =>
            index === answerIndex ? { ...answer, [field]: value } : answer
          )
        }
      }
    }))
  }

  const updateBigGameQuestion = (questionIndex, field, value) => {
    setPackData(prev => ({
      ...prev,
      rounds: {
        ...prev.rounds,
        big_game: prev.rounds.big_game.map((question, index) =>
          index === questionIndex ? { ...question, [field]: value } : question
        )
      }
    }))
  }

  const updateBigGameAnswer = (questionIndex, answerIndex, field, value) => {
    setPackData(prev => ({
      ...prev,
      rounds: {
        ...prev.rounds,
        big_game: prev.rounds.big_game.map((question, qIndex) =>
          qIndex === questionIndex
            ? {
                ...question,
                answers: question.answers.map((answer, aIndex) =>
                  aIndex === answerIndex ? { ...answer, [field]: value } : answer
                )
              }
            : question
        )
      }
    }))
  }

  const addBigGameAnswer = (questionIndex) => {
    setPackData(prev => ({
      ...prev,
      rounds: {
        ...prev.rounds,
        big_game: prev.rounds.big_game.map((question, index) =>
          index === questionIndex
            ? {
                ...question,
                answers: [...question.answers, { text: '', score: 0, synonyms: [] }]
              }
            : question
        )
      }
    }))
  }

  const removeBigGameAnswer = (questionIndex, answerIndex) => {
    if (packData.rounds.big_game[questionIndex].answers.length <= 1) return
    
    setPackData(prev => ({
      ...prev,
      rounds: {
        ...prev.rounds,
        big_game: prev.rounds.big_game.map((question, index) =>
          index === questionIndex
            ? {
                ...question,
                answers: question.answers.filter((_, aIndex) => aIndex !== answerIndex)
              }
            : question
        )
      }
    }))
  }

  const handleSave = () => {
    onSave({
      ...packData,
      pack_id: packData.pack_id || `custom_${Date.now()}`
    })
  }

  const renderAnswerInput = (roundType, answer, index) => (
    <div key={index} className="answer-input-row">
      <input
        type="text"
        value={answer.text}
        onChange={(e) => updateAnswer(roundType, index, 'text', e.target.value)}
        placeholder="Ответ"
        className="answer-text-input"
      />
      <input
        type="number"
        value={answer.score}
        onChange={(e) => updateAnswer(roundType, index, 'score', parseInt(e.target.value) || 0)}
        placeholder="Очки"
        className="answer-score-input"
      />
    </div>
  )

  const renderBigGameAnswers = (question, qIndex) => (
    <div key={qIndex} className="big-game-question">
      <input
        type="text"
        value={question.question}
        onChange={(e) => updateBigGameQuestion(qIndex, 'question', e.target.value)}
        placeholder="Вопрос"
        className="big-game-question-input"
      />
      <div className="big-game-answers">
        {question.answers.map((answer, aIndex) => (
          <div key={aIndex} className="big-game-answer-row">
            <input
              type="text"
              value={answer.text}
              onChange={(e) => updateBigGameAnswer(qIndex, aIndex, 'text', e.target.value)}
              placeholder="Ответ"
              className="answer-text-input"
            />
            <input
              type="number"
              value={answer.score}
              onChange={(e) => updateBigGameAnswer(qIndex, aIndex, 'score', parseInt(e.target.value) || 0)}
              placeholder="Очки"
              className="answer-score-input"
            />
            <button
              onClick={() => removeBigGameAnswer(qIndex, aIndex)}
              className="btn btn-danger"
              disabled={question.answers.length <= 1}
            >
              ×
            </button>
          </div>
        ))}
        <button onClick={() => addBigGameAnswer(qIndex)} className="btn btn-secondary">
          + Добавить вариант
        </button>
      </div>
    </div>
  )

  return (
    <div className="pack-editor">
      <div className="editor-header">
        <h1>Редактор пакетов вопросов</h1>
        <div className="editor-actions">
          <button onClick={onCancel} className="btn btn-secondary">
            Отмена
          </button>
          <button onClick={handleSave} className="btn btn-primary">
            Сохранить пакет
          </button>
        </div>
      </div>

      <div className="pack-info">
        <div className="form-group">
          <label>ID пакета:</label>
          <input
            type="text"
            value={packData.pack_id}
            onChange={(e) => updatePackField('pack_id', e.target.value)}
            placeholder="my_custom_pack"
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label>Название:</label>
          <input
            type="text"
            value={packData.title}
            onChange={(e) => updatePackField('title', e.target.value)}
            placeholder="Мой пакет"
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label>Описание:</label>
          <input
            type="text"
            value={packData.description}
            onChange={(e) => updatePackField('description', e.target.value)}
            placeholder="Описание пакета"
            className="form-input"
          />
        </div>
      </div>

      <div className="rounds-tabs">
        <button
          className={`round-tab ${activeRound === 'simple' ? 'active' : ''}`}
          onClick={() => setActiveRound('simple')}
        >
          Простой
        </button>
        <button
          className={`round-tab ${activeRound === 'double' ? 'active' : ''}`}
          onClick={() => setActiveRound('double')}
        >
          Двойной
        </button>
        <button
          className={`round-tab ${activeRound === 'triple' ? 'active' : ''}`}
          onClick={() => setActiveRound('triple')}
        >
          Тройной
        </button>
        <button
          className={`round-tab ${activeRound === 'reverse' ? 'active' : ''}`}
          onClick={() => setActiveRound('reverse')}
        >
          Обратно
        </button>
        <button
          className={`round-tab ${activeRound === 'big_game' ? 'active' : ''}`}
          onClick={() => setActiveRound('big_game')}
        >
          Большая игра
        </button>
      </div>

      {activeRound !== 'big_game' ? (
        <div className="round-editor">
          <div className="form-group">
            <label>Вопрос:</label>
            <input
              type="text"
              value={packData.rounds[activeRound]?.question || ''}
              onChange={(e) => updateRoundField(activeRound, 'question', e.target.value)}
              placeholder="Введите вопрос"
              className="form-input"
            />
          </div>
          <div className="answers-section">
            <h3>Ответы (6 вариантов):</h3>
            {packData.rounds[activeRound]?.answers.map((answer, index) =>
              renderAnswerInput(activeRound, answer, index)
            )}
          </div>
        </div>
      ) : (
        <div className="big-game-editor">
          <h3>Большая игра (5 вопросов):</h3>
          {packData.rounds.big_game.map((question, index) =>
            renderBigGameAnswers(question, index)
          )}
        </div>
      )}
    </div>
  )
}

PackEditor.propTypes = {
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
}

export default PackEditor
