import { useState, useEffect, useCallback } from 'react'
import PropTypes from 'prop-types'
import NoSleep from 'nosleep.js'
import BigGame from '../BigGame.jsx'
import RoundSelector from './parts/RoundSelector'
import AnswerList from './parts/AnswerList'
import ControlButtons from './parts/ControlButtons'
import ScoreBoard from './parts/ScoreBoard'
import UndoStack from '../UndoStack'
import AdminHistoryManager from '../../utils/adminHistory'
import toaster from '../../utils/toaster'
import { Tooltip } from 'react-tooltip'
import 'react-tooltip/dist/react-tooltip.css'

const noSleep = new NoSleep()

function Admin({ socket, gameState, roomId }) {
  const [selectedRound, setSelectedRound] = useState('simple')
  const [selectedTeam, setSelectedTeam] = useState(1)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [history, setHistory] = useState([])
  const [canUndo, setCanUndo] = useState(false)

  const historyManager = new AdminHistoryManager(5)

  const gamePack = {
    packId: 'pack1',
    rounds: {
      simple: {
        question: 'Самый популярный фрукт?',
        answers: [
          { text: 'Яблоко', score: 30 },
          { text: 'Банан', score: 25 },
          { text: 'Апельсин', score: 15 },
          { text: 'Груша', score: 10 },
          { text: 'Виноград', score: 12 },
          { text: 'Клубника', score: 8 }
        ]
      },
      double: {
        question: 'Что люди покупают в супермаркете?',
        answers: [
          { text: 'Хлеб', score: 35 },
          { text: 'Молоко', score: 28 },
          { text: 'Яйца', score: 22 },
          { text: 'Овощи', score: 15 },
          { text: 'Мясо', score: 18 },
          { text: 'Сыр', score: 12 }
        ]
      },
      triple: {
        question: 'Причина пропуска работы?',
        answers: [
          { text: 'Болезнь', score: 40 },
          { text: 'Семейные обстоятельства', score: 25 },
          { text: 'Транспорт', score: 15 },
          { text: 'Погода', score: 10 },
          { text: 'Заработался', score: 8 },
          { text: 'Просто не захотел', score: 5 }
        ]
      },
      reverse: {
        question: 'Что дарят на день рождения?',
        answers: [
          { text: 'Деньги', score: 15 },
          { text: 'Цветы', score: 20 },
          { text: 'Книги', score: 12 },
          { text: 'Одежду', score: 18 },
          { text: 'Электронику', score: 25 },
          { text: 'Конфеты', score: 10 }
        ]
      },
      big_game: []
    }
  }

  useEffect(() => {
    document.addEventListener('click', enableNoSleep, false)

    const handleRoomUpdated = (room) => {
      setSelectedTeam(room.board.activeTeam)
    }

    socket.on('room_updated', handleRoomUpdated)

    const handleKeyDown = (e) => {
      if (!gameState || selectedRound === 'big_game') return

      const board = gameState.board || {}

      if (e.key === '1' && e.ctrlKey) {
        e.preventDefault()
        undo()
      } else if (e.key === '1' || e.key === '2' || e.key === '3' || e.key === '4' || e.key === '5' || e.key === '6') {
        e.preventDefault()
        const index = parseInt(e.key) - 1
        if (board.answers && board.answers[index]) {
          revealAnswer(index)
        }
      } else if (e.key === ' ') {
        e.preventDefault()
        addMistake()
      } else if (e.key === 'Tab') {
        e.preventDefault()
        switchTeam()
      } else if (e.key === 'Enter') {
        e.preventDefault()
        awardPoints()
      } else if (e.key === 'F1') {
        e.preventDefault()
        window.dispatchEvent(new CustomEvent('openHelp'))
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault()
        resetBuzzer()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('click', enableNoSleep, false)
      noSleep.disable()
      socket.off('room_updated', handleRoomUpdated)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [socket, gameState, selectedRound, revealAnswer, addMistake, awardPoints, switchTeam, resetBuzzer, undo, enableNoSleep])

  const addToHistory = useCallback((action) => {
    const newHistory = [...history]
    newHistory.push(action)
    if (newHistory.length > 5) {
      newHistory.shift()
    }
    setHistory(newHistory)
    setCanUndo(true)
  }, [history])

  const undo = () => {
    if (history.length === 0) {
      toaster.warning('Нет действий для отмены')
      return
    }

    const lastAction = history[history.length - 1]

    try {
      switch (lastAction.type) {
        case 'reveal_answer':
          if (lastAction.undo) {
            toaster.info('Undo: скрыт ответ #' + (lastAction.data.answerIndex + 1))
          }
          break
        case 'add_mistake':
          if (lastAction.undo) {
            toaster.info('Undo: удален промах')
          }
          break
        case 'switch_team':
          if (lastAction.undo) {
            toaster.info('Undo: команда возвращена')
          }
          break
        case 'award_points':
          if (lastAction.undo) {
            toaster.info('Undo: очки возвращены')
          }
          break
      }

      setHistory(history.slice(0, -1))
      setCanUndo(history.length > 1)
      toaster.success('Действие отменено!')
    } catch (error) {
      toaster.error('Не удалось отменить действие')
    }
  }

  const enableNoSleep = () => {
    noSleep.enable()
    document.removeEventListener('click', enableNoSleep, false)
  }

  const loadRound = (roundType) => {
    setSelectedRound(roundType)
    const roundData = gamePack.rounds[roundType]
    try {
      socket.loadRound(roomId, {
        ...roundData,
        type: roundType
      })
      toaster.success(`${roundType === 'simple' ? 'Простой' : roundType === 'double' ? 'Двойной' : roundType === 'triple' ? 'Тройной' : 'Обратный'} раунд загружен!`)
    } catch (error) {
      toaster.error('Не удалось загрузить раунд')
    }
  }

  const revealAnswer = (index) => {
    try {
      socket.revealAnswer(roomId, index)
      const action = historyManager.createAnswerRevealAction(
        roomId,
        index,
        gameState?.board?.answers?.[index],
        gameState?.board?.bank
      )
      addToHistory({
        ...action,
        timestamp: Date.now(),
        time: new Date().toLocaleTimeString('ru-RU', { timeStyle: 'short' })
      })
    } catch (error) {
      toaster.error('Не удалось открыть ответ')
    }
  }

  const addMistake = () => {
    if (!gameState || !gameState.board) return

    const mistakes = gameState.board.mistakes
    if (mistakes >= 3) {
      toaster.warning('Максимум промахов! Смена хода.')
      return
    }

    try {
      socket.addMistake(roomId)
      const action = historyManager.createAddMistakeAction(roomId, mistakes + 1)
      addToHistory({
        ...action,
        timestamp: Date.now(),
        time: new Date().toLocaleTimeString('ru-RU', { timeStyle: 'short' })
      })
    } catch (error) {
      toaster.error('Не удалось добавить промах')
    }
  }

  const switchTeam = () => {
    if (!gameState || !gameState.board) return

    try {
      socket.switchTeam(roomId)
      const newTeam = selectedTeam === 1 ? 2 : 1
      setSelectedTeam(newTeam)

      const action = historyManager.createSwitchTeamAction(roomId, selectedTeam)
      addToHistory({
        ...action,
        timestamp: Date.now(),
        time: new Date().toLocaleTimeString('ru-RU', { timeStyle: 'short' })
      })
    } catch (error) {
      toaster.error('Не удалось переключить команду')
    }
  }

  const awardPoints = () => {
    const points = gameState?.board?.bank || 0
    if (points > 0) {
      try {
        socket.awardPoints(roomId, selectedTeam, points)
        socket.switchTeam(roomId)
        const newTeam = selectedTeam === 1 ? 2 : 1
        setSelectedTeam(newTeam)

        const action = historyManager.createAwardPointsAction(roomId, selectedTeam, points)
        addToHistory({
          ...action,
          timestamp: Date.now(),
          time: new Date().toLocaleTimeString('ru-RU', { timeStyle: 'short' })
        })

        toaster.success(`${points} очков начислено Команде ${selectedTeam}!`)
      } catch (error) {
        toaster.error('Не было начислить очки')
      }
    } else {
      toaster.warning('В банке нет очков для начисления')
    }
  }

  const toggleSound = () => {
    const newSoundState = !soundEnabled
    setSoundEnabled(newSoundState)
    try {
      socket.toggleSound(roomId, newSoundState)
      toaster.info(newSoundState ? 'Звук включен' : 'Звук выключен')
    } catch {
    }
  }

  const resetBuzzer = () => {
    try {
      socket.resetBuzzer(roomId)
    } catch (error) {
      toaster.error('Не удалось сбросить кнопку')
    }
  }

  if (!gameState) {
    return (
      <div className="admin-container">
        <div className="loading">Загрузка...</div>
      </div>
    )
  }

  if (selectedRound === 'big_game') {
    return <BigGame socket={socket} gameState={gameState} roomId={roomId} />
  }

  const { board } = gameState
  const currentRound = selectedRound && gamePack.rounds[selectedRound]

  return (
    <AdminUI
      roomId={roomId}
      selectedRound={selectedRound}
      selectedTeam={selectedTeam}
      soundEnabled={soundEnabled}
      board={board}
      currentRound={currentRound}
      canUndo={canUndo}
      history={history}
      onSelectRound={loadRound}
      onRevealAnswer={revealAnswer}
      onAddMistake={addMistake}
      onSwitchTeam={switchTeam}
      onAwardPoints={awardPoints}
      onToggleSound={toggleSound}
      onResetBuzzer={resetBuzzer}
      onUndo={undo}
    />
  )
}

function AdminUI({
  roomId,
  selectedRound,
  selectedTeam,
  soundEnabled,
  board,
  currentRound,
  canUndo,
  history,
  onSelectRound,
  onRevealAnswer,
  onAddMistake,
  onSwitchTeam,
  onAwardPoints,
  onToggleSound,
  onResetBuzzer,
  onUndo
}) {
  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>👨‍💼 Панель ведущего</h1>
        <div className="room-code">Комната: <span className="code">{roomId}</span></div>
        <div className="header-actions">
          {canUndo && (
            <button
              className="undo-button"
              onClick={onUndo}
              data-tip="Отменить последнее действие (Ctrl+1)"
              data-place="bottom"
            >
              ↩ Отменить
            </button>
          )}
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('openHelp'))}
            data-tip="Справка (F1)"
            data-place="bottom"
          >
            📚
          </button>
        </div>
      </div>

      {history.length > 0 && (
        <UndoStack
          history={history}
          onUndo={onUndo}
          maxHistory={5}
        />
      )}

      <RoundSelector
        selectedRound={selectedRound}
        onSelectRound={onSelectRound}
      />

      {currentRound && (
        <AnswerList
          round={currentRound}
          board={board}
          onRevealAnswer={onRevealAnswer}
        />
      )}

      <ControlButtons
        board={board}
        soundEnabled={soundEnabled}
        onAddMistake={onAddMistake}
        onSwitchTeam={onSwitchTeam}
        onAwardPoints={onAwardPoints}
        onResetBuzzer={onResetBuzzer}
        onToggleSound={onToggleSound}
      />

      <ScoreBoard board={board} />

      <div className="keyboard-shortcuts-hint">
        💡 Горячие клавиши:
        <kbd>1-6</kbd> открыть ответ |
        <kbd>Space</kbd> промах |
        <kbd>Tab</kbd> смена команды |
        <kbd>Enter</kbd> очки |
        <kbd>Ctrl+1</kbd> undo |
        <kbd>F1</kbd> справка
      </div>

      <Tooltip effect="solid" place="bottom" />
    </div>
  )
}

Admin.propTypes = {
  socket: PropTypes.object.isRequired,
  gameState: PropTypes.object,
  roomId: PropTypes.string.isRequired
}

export default Admin
