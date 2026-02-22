import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { useParams, useNavigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import socketService from './services/socketService'
import ErrorBoundary from './components/ErrorBoundary'
import Help from './components/Help'
import Onboarding from './components/Onboarding'
import QRCodeDisplay from './components/QRCodeDisplay'
import Board from './components/Board/Board'
import Admin from './components/Admin/Admin'
import Buzzer from './components/Buzzer/Buzzer'
import PackEditor from './components/PackEditor.jsx'
import ConnectionStatus from './components/ConnectionStatus'
import toaster from './utils/toaster'
import settings from './utils/settings'
import './App.css'

function App({ view }) {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const [gameState, setGameState] = useState(null)
  const [socketConnected, setSocketConnected] = useState(false)
  const [connectionError, setConnectionError] = useState(null)
  const [showHelp, setShowHelp] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(true)
  const [showQR, setShowQR] = useState(false)
  const [createdRoomId, setCreatedRoomId] = useState(null)
  const [showEditor, setShowEditor] = useState(false)

  useEffect(() => {
    let isMounted = true

    const connectAndSubscribe = async () => {
      try {
        await socketService.connect()
        
        if (!isMounted) return

        setSocketConnected(true)
        setConnectionError(null)

        const handleRoomUpdated = (room) => {
          if (isMounted) {
            setGameState(room)
          }
        }

        const handleError = ({ message }) => {
          if (isMounted) {
            toaster.error(message)
          }
        }

        const handleConnectionFailed = () => {
          if (isMounted) {
            setConnectionError('Не удалось подключиться к серверу')
            toaster.error('Не удалось подключиться к серверу. Проверьте соединение.')
          }
        }

        const handleDisconnected = () => {
          if (isMounted) {
            setSocketConnected(false)
            toaster.warning('Отключено от сервера. Пытаемся переподключиться...')
          }
        }

        socketService.on('room_updated', handleRoomUpdated)
        socketService.on('error', handleError)
        socketService.on('connection_failed', handleConnectionFailed)
        socketService.on('disconnected', handleDisconnected)

        return () => {
          socketService.off('room_updated', handleRoomUpdated)
          socketService.off('error', handleError)
          socketService.off('connection_failed', handleConnectionFailed)
          socketService.off('disconnected', handleDisconnected)
        }
        } catch (error) {
          if (isMounted) {
            setConnectionError('Не удалось подключиться к серверу')
            toaster.error('Не удалось подключиться к серверу. Попробуйте обновить страницу.')
          }
        }
    }

    connectAndSubscribe()

    return () => {
      isMounted = false
    }
  }, [])

  const handleCreateRoom = async (packId) => {
    try {
      const response = await socketService.createRoom(packId)
      const roomId = response.roomId
      setCreatedRoomId(roomId)
      settings.setString(settings.KEYS.LAST_PACK_ID, packId)

      socketService.once('room_created', () => {
        navigate(`/game/${roomId}/admin`)
        const boardWindow = window.open(`/game/${roomId}/board`, '_blank')

        if (!boardWindow) {
          toaster.warning('popup заблокирован. Откройте tablo вручную.')
        }

        setShowQR(true)
        toaster.success(`Комната создана! Код: ${roomId}`)
      })

    } catch (error) {
      toaster.error('Не удалось создать комнату: ' + error.message)
    }
  }

  const handleJoinRoom = async (inputRoomId, role) => {
    try {
      await socketService.joinRoom(inputRoomId, role)

      socketService.once('joined_room', () => {
        navigate(`/game/${inputRoomId}/${role}`)
      })

      if (role === 'buzzer') {
        settings.add_recentRoom(inputRoomId)
      }

    } catch (error) {
      toaster.error('Не удалось присоединиться к комнате: ' + error.message)
    }
  }

  const resetGame = () => {
    setGameState(null)
    setShowHelp(false)
    setShowQR(false)
    setCreatedRoomId(null)
    navigate('/')
  }

  useEffect(() => {
    const handleOpenHelp = () => setShowHelp(true)
    window.addEventListener('openHelp', handleOpenHelp)
    return () => window.removeEventListener('openHelp', handleOpenHelp)
  }, [])

  if (connectionError) {
    return (
      <div className="error-container">
        <div className="error-message">
          <h2>Ошибка подключения</h2>
          <p style={{ fontSize: '2em', marginBottom: '20px' }}>🔌❌</p>
          <p>{connectionError}</p>
          <button onClick={resetGame} className="btn btn-primary">
            Попробовать снова
          </button>
          <button 
            onClick={() => setShowHelp(true)} 
            className="btn btn-secondary"
            style={{ marginTop: '10px' }}
          >
            📚 Справка
          </button>
        </div>
      </div>
    )
  }

  if (!socketConnected && !connectionError) {
    return (
      <div className="loading-container">
        <div className="loading">
          <p>Подключение к серверу...</p>
          <p className="loading-dots">⏳</p>
        </div>
      </div>
    )
  }

  if (view === 'board') {
    return <Board socket={socketService} gameState={gameState} />
  }

  if (view === 'admin') {
    return <Admin socket={socketService} gameState={gameState} roomId={roomId} />
  }

  if (view === 'buzzer') {
    return <Buzzer socket={socketService} gameState={gameState} roomId={roomId} />
  }

  if (showEditor) {
    return (
      <PackEditor
        onSave={(packData) => {
          const blob = new Blob([JSON.stringify(packData, null, 2)], { type: 'application/json' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `${packData.pack_id || 'custom_pack'}.json`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
          toaster.success('Пакет сохранен! Загрузите его в папку game-packs/')
          setShowEditor(false)
        }}
        onCancel={() => setShowEditor(false)}
      />
    )
  }

  const lastPackId = settings.getString(settings.KEYS.LAST_PACK_ID, 'pack1')
  const recentRooms = settings.getRecentRooms()

  return (
    <ErrorBoundary onReset={resetGame}>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
      
      {showOnboarding && settings.getBoolean(settings.KEYS.SHOW_ONBOARDING) && (
        <Onboarding 
          onComplete={() => setShowOnboarding(false)}
        />
      )}

      {showHelp && <Help onClose={() => setShowHelp(false)} />}
      
      {showQR && createdRoomId && (
        <QRCodeDisplay 
          roomId={createdRoomId}
          onClose={() => setShowQR(false)}
          showHelp={true}
        />
      )}
      
      <ConnectionStatus socket={socketService} />
      
      <div className="landing">
        <div className="landing-container">
          <div className="landing-header">
            <h1 className="game-title">СТО К ОДНОМУ</h1>
            <button 
              className="help-button"
              onClick={() => setShowHelp(true)}
              title="Справка"
              aria-label="Открыть справку"
            >
              📚
            </button>
          </div>
          
          <div className="landing-buttons">
            <div className="create-section">
              <h2>Создать игру</h2>
              <select id="pack-select" className="pack-select" defaultValue={lastPackId}>
                <option value="pack1">Пакет для дня рождения</option>
                <option value="pack2">Корпоративная вечеринка</option>
              </select>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    const packId = document.getElementById('pack-select').value
                    handleCreateRoom(packId)
                  }}
                  title="Создать новую игру"
                >
                  🎲 Создать комнату
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => setShowEditor(true)}
                  title="Создать свой пакет вопросов"
                >
                  ✏️ Создать пакет
                </button>
              </div>
            </div>
            
            <div className="join-section">
              <h2>Присоединиться к игре</h2>
              
              {recentRooms.length > 0 && (
                <div className="recent-rooms">
                  <p className="recent-label">Недавние игры:</p>
                  <div className="recent-buttons">
                    {recentRooms.slice(0, 3).map(room => (
                      <button
                        key={room.id}
                        className="btn btn-secondary recent-btn"
                        onClick={() => handleJoinRoom(room.id, 'buzzer')}
                        title={`Сыграть снова (${room.playedAt})`}
                      >
                        🔗 {room.id}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="join-options">
                <div className="join-option">
                  <input 
                    type="text" 
                    id="room-input" 
                    placeholder="Код комнаты"
                    className="room-input"
                    aria-label="Код комнаты для табло"
                  />
                  <button 
                    className="btn btn-secondary"
                    onClick={() => {
                      const inputRoomId = document.getElementById('room-input').value.trim()
                      if (inputRoomId) {
                        handleJoinRoom(inputRoomId, 'board')
                        window.open(`/game/${inputRoomId}/board`, '_blank')
                      } else {
                        toaster.warning('Введите код комнаты')
                      }
                    }}
                    title="Открыть табло"
                  >
                    📺 Табло
                  </button>
                </div>
                <div className="join-option">
                  <input 
                    type="text" 
                    id="room-input-admin" 
                    placeholder="Код комнаты"
                    className="room-input"
                    aria-label="Код комнаты для ведущего"
                  />
                  <button 
                    className="btn btn-secondary"
                    onClick={() => {
                      const inputRoomId = document.getElementById('room-input-admin').value.trim()
                      if (inputRoomId) {
                        handleJoinRoom(inputRoomId, 'admin')
                      } else {
                        toaster.warning('Введите код комнаты')
                      }
                    }}
                    title="Открыть панель ведущего"
                  >
                    👨‍💼 Ведущий
                  </button>
                </div>
                <div className="join-option">
                  <input 
                    type="text" 
                    id="room-input-buzzer" 
                    placeholder="Код комнаты"
                    className="room-input"
                    aria-label="Код комнаты для кнопки"
                  />
                  <button 
                    className="btn btn-primary"
                    onClick={() => {
                      const inputRoomId = document.getElementById('room-input-buzzer').value.trim()
                      if (inputRoomId) {
                        handleJoinRoom(inputRoomId, 'buzzer')
                      } else {
                        toaster.warning('Введите код комнаты')
                      }
                    }}
                    title="Присоединиться как игрок"
                  >
                    🔴 Кнопка
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="shortcuts-hint">
        Нажмите <kbd>F1</kbd> для справки | <kbd>?</kbd> для помощи
      </div>
    </ErrorBoundary>
  )
}

App.propTypes = {
  view: PropTypes.string
}

export default App
