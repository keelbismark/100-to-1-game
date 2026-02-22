import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import NoSleep from 'nosleep.js'
import { Tooltip } from 'react-tooltip'
import settings from '../../utils/settings'
import toaster from '../../utils/toaster'
import 'react-tooltip/dist/react-tooltip.css'

const noSleep = new NoSleep()

function Buzzer({ socket, gameState, roomId }) {
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [isPressed, setIsPressed] = useState(false)
  const [winner, setWinner] = useState(null)
  const [latency, setLatency] = useState(0)
  const [pressTime, setPressTime] = useState(null)
  const [connectionStatus, setConnectionStatus] = useState('disconnected')

  useEffect(() => {
    if (!socket) return

    const handleRoomUpdated = (room) => {
      if (room.buzzer.winner) {
        setWinner(room.buzzer.winner)
        setConnectionStatus('connected')
      } else {
        setWinner(null)
        setIsPressed(false)
      }
    }

    const handleBuzzerPressed = ({ winner: buzzerWinner }) => {
      setWinner(buzzerWinner)
      
      if (buzzerWinner && selectedTeam === buzzerWinner) {
        if (settings.getBoolean(settings.KEYS.BUZZER_HAPTIC_ENABLED, true)) {
          if (navigator.vibrate) {
            navigator.vibrate(200)
          }
        }
        toaster.success('🎉 ВЫ ПЕРВЫ!', {
          autoClose: 2000
        })
      } else if (buzzerWinner && selectedTeam !== buzzerWinner) {
        toaster.info(`Команда ${buzzerWinner} ответила первой`, {
          autoClose: 2000
        })
      }
    }

    const handleBuzzerReset = () => {
      setWinner(null)
      setIsPressed(false)
      setPressTime(null)
    }

    const handleConnected = () => {
      setConnectionStatus('connected')
    }

    const handleDisconnected = () => {
      setConnectionStatus('disconnected')
    }

    socket.on('room_updated', handleRoomUpdated)
    socket.on('buzzer_pressed', handleBuzzerPressed)
    socket.on('buzzer_reset', handleBuzzerReset)
    
    if (socket.isConnected()) {
      setConnectionStatus('connected')
    }

    socket.on('connect', handleConnected)
    socket.on('disconnect', handleDisconnected)

    return () => {
      socket.off('room_updated', handleRoomUpdated)
      socket.off('buzzer_pressed', handleBuzzerPressed)
      socket.off('buzzer_reset', handleBuzzerReset)
      socket.off('connect', handleConnected)
      socket.off('disconnect', handleDisconnected)
      noSleep.disable()
    }
  }, [socket, selectedTeam])

  const enableNoSleep = () => {
    noSleep.enable()
    document.removeEventListener('click', enableNoSleep, false)
  }

  useEffect(() => {
    document.addEventListener('click', enableNoSleep, false)
    return () => {
      document.removeEventListener('click', enableNoSleep, false)
    }
  }, [])

  const handleTeamSelect = (team) => {
    if (!isPressed && !winner) {
      setSelectedTeam(team)
      try {
        socket.setTeam(roomId, team)
        toaster.success(`Вы выбрали Команду ${team}`)
      } catch (error) {
        console.error('Failed to set team:', error)
        toaster.error('Не удалось выбрать команду')
      }
    }
  }

  const handleBuzzerPress = () => {
    if (!selectedTeam) {
      toaster.warning('Сначала выберите команду!')
      return
    }

    if (isPressed || winner) {
      return
    }

    const startTime = Date.now()
    setIsPressed(true)
    setPressTime(startTime)
    
    try {
      socket.pressBuzzer(roomId, selectedTeam, startTime)
      setLatency(0)
    } catch (error) {
      console.error('Failed to press buzzer:', error)
      toaster.error('Не удалось нажать кнопку')
      setIsPressed(false)
    }
  }

  const getStatusMessage = () => {
    if (!selectedTeam) {
      return {
        text: 'Выберите команду',
        type: 'select',
        icon: '👆'
      }
    }
    
    if (winner) {
      if (winner === selectedTeam) {
        return {
          text: 'ВЫ ПЕРВЫ! 🎉',
          type: 'winner',
          icon: '🏆'
        }
      } else {
        return {
          text: `Команда ${winner} ответила первой`,
          type: 'loser',
          icon: '⏰'
        }
      }
    }
    
    if (isPressed) {
      return {
        text: 'Вы нажали! Ждем ответ противника...',
        type: 'waiting',
        icon: '⏳'
      }
    }
    
    return {
      text: 'Нажмите когда будете готовы!',
      type: 'ready',
      icon: '🎯'
    }
  }

  const status = getStatusMessage()

  return (
    <div className="buzzer-container">
      <div className="buzzer-header">
        <h1>🔴 КНОПКА ИГРОКА</h1>
        <div className="room-info">
          Комната: <span className="code">{roomId}</span>
        </div>
        {latency > 0 && (
          <div className="latency-info">
            Пинг: <span className="ping-value">{latency}мс</span>
          </div>
        )}
      </div>

      <div className="connection-indicator">
        <div className={`status-dot ${connectionStatus}`}></div>
        <span className="status-text">
          {connectionStatus === 'connected' ? 'Подключено' : 'Отключено'}
        </span>
      </div>

      <div className="team-selector">
        <button 
          className={`team-btn-buzzer team1 ${selectedTeam === 1 ? 'selected' : ''}`}
          onClick={() => handleTeamSelect(1)}
          disabled={winner !== null}
          data-tip={
            selectedTeam === 1 
              ? 'Вы в Команде 1' 
              : winner !== null 
                ? 'Идет игра' 
                : 'Выбрать Команду 1'
          }
          data-place="bottom"
        >
          <div className="team-icon">🔵</div>
          <div className="team-name">Команда 1</div>
        </button>
        
        <button 
          className={`team-btn-buzzer team2 ${selectedTeam === 2 ? 'selected' : ''}`}
          onClick={() => handleTeamSelect(2)}
          disabled={winner !== null}
          data-tip={
            selectedTeam === 2 
              ? 'Вы в Команде 2' 
              : winner !== null 
                ? 'Идет игра' 
                : 'Выбрать Команду 2'
          }
          data-place="bottom"
        >
          <div className="team-icon">🔴</div>
          <div className="team-name">Команда 2</div>
        </button>
      </div>

      <div className="buzzer-section">
        <button 
          className={`buzzer-button ${status.type} ${!selectedTeam ? 'disabled' : ''}`}
          onClick={handleBuzzerPress}
          disabled={!selectedTeam || winner !== null}
          data-tip={
            !selectedTeam 
              ? 'Сначала выберите команду' 
              : winner !== null 
                ? 'Раунд уже завершен' 
                : 'Нажмите для ответа!'
          }
          data-place="bottom"
        >
          <div className="buzzer-icon">{status.icon}</div>
          <div className="buzzer-text">
            {winner !== null ? 'ОЖИДАНИЕ' : selectedTeam ? 'НАЖМИ!' : 'ВЫБЕРИТЕ КОМАНДУ'}
          </div>
          {winner === selectedTeam && (
            <div className="winner-animation">🎉</div>
          )}
        </button>
      </div>

      <div className={`buzzer-status status-${status.type}`}>
        <div className="status-content">
          <div className="status-icon">{status.icon}</div>
          <div className="status-message">{status.text}</div>
        </div>
      </div>

      {pressTime && !winner && (
        <div className="reaction-time">
          Зафиксировано: {new Date(pressTime).toLocaleTimeString()}
        </div>
      )}

      <div className="buzzer-footer">
        <button 
          onClick={() => window.dispatchEvent(new CustomEvent('openHelp'))}
          className="help-button"
          data-tip="Справка"
          data-place="top"
        >
          📚 Справка
        </button>
      </div>

      <Tooltip effect="solid" place="bottom" />
    </div>
  )
}

Buzzer.propTypes = {
  socket: PropTypes.object.isRequired,
  gameState: PropTypes.object,
  roomId: PropTypes.string.isRequired
}

export default Buzzer
