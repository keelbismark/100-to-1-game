import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'

function ConnectionStatus({ socket }) {
  const [connected, setConnected] = useState(false)
  const [ping, setPing] = useState(0)

  useEffect(() => {
    if (!socket) return

    const checkConnection = () => {
      setConnected(socket.connected)
      
      if (socket.connected) {
        const start = Date.now()
        socket.emit('ping')
        socket.once('pong', () => {
          setPing(Date.now() - start)
        })
      }
    }

    checkConnection()
    const interval = setInterval(checkConnection, 5000)

    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))

    return () => {
      clearInterval(interval)
      socket.off('connect')
      socket.off('disconnect')
    }
  }, [socket])

  return (
    <div className={`connection-status ${connected ? 'connected' : 'disconnected'}`}>
      <div className="status-indicator"></div>
      <div className="status-text">
        {connected ? `Подключено (${ping}мс)` : 'Отключено'}
      </div>
    </div>
  )
}

ConnectionStatus.propTypes = {
  socket: PropTypes.object.isRequired
}

export default ConnectionStatus
