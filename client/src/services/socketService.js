import { io } from 'socket.io-client'

class SocketService {
  constructor() {
    this.socket = null
    this.listeners = {}
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 10
    this.baseReconnectDelay = 1000
    this.maxReconnectDelay = 30000
    this.isConnecting = false
    this.connectionPromise = null
  }

  getReconnectDelay() {
    const delay = Math.min(
      this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts),
      this.maxReconnectDelay
    )
    return delay + Math.random() * 1000
  }

  async connect(url = 'http://localhost:5000', options = {}) {
    if (this.socket?.connected) {
      return this.socket
    }

    if (this.isConnecting && this.connectionPromise) {
      return this.connectionPromise
    }

    this.isConnecting = true
    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        const socketUrl = process.env.REACT_APP_SOCKET_URL || url

        this.socket = io(socketUrl, {
          reconnection: true,
          reconnectionDelay: this.getReconnectDelay(),
          reconnectionDelayMax: this.maxReconnectDelay,
          reconnectionAttempts: this.maxReconnectAttempts,
          timeout: 10000,
          ...options
        })

        this.socket.on('connect', () => {
          console.log('Connected to server', {
            socketId: this.socket.id,
            transport: this.socket.io.engine.transport.name
          })
          this.reconnectAttempts = 0
          this.isConnecting = false
          this.emit('connection_established')
          resolve(this.socket)
        })

        this.socket.on('connect_error', (error) => {
          console.error('Connection error:', {
            message: error.message,
            description: error.description,
            context: error.context,
            type: error.type,
            reconnectAttempts: this.reconnectAttempts
          })
          
          this.reconnectAttempts++
          
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('Max reconnection attempts reached')
            this.isConnecting = false
            this.emit('connection_failed', error)
            reject(new Error('Failed to establish connection after multiple attempts'))
          } else {
            const nextDelay = this.getReconnectDelay()
            console.log(`Will attempt to reconnect in ${Math.round(nextDelay / 1000)} seconds...`)
          }
        })

        this.socket.on('disconnect', (reason) => {
          console.log('Disconnected from server:', {
            reason,
            socketId: this.socket?.id
          })
          
          this.isConnecting = false
          this.emit('disconnected', reason)

          if (reason === 'io server disconnect') {
            setTimeout(() => {
              this.connect(url, options)
            }, this.getReconnectDelay())
          }
        })

        this.socket.on('error', (data) => {
          console.error('Socket error:', data)
          this.emit('error', data)
        })

        this.socket.on('reconnect_attempt', (attemptNumber) => {
          console.log(`Reconnection attempt ${attemptNumber}/${this.maxReconnectAttempts}`)
          this.emit('reconnect_attempting', { attemptNumber })
        })

        this.socket.on('reconnect', (attemptNumber) => {
          console.log('Reconnected successfully', { attemptNumber })
          this.reconnectAttempts = 0
          this.emit('reconnected', { attemptNumber })
        })

        this.socket.on('reconnect_failed', () => {
          console.error('Reconnection failed')
          this.isConnecting = false
          this.emit('reconnection_failed')
          reject(new Error('Failed to reconnect after multiple attempts'))
        })

      } catch (error) {
        console.error('Error creating socket connection:', error)
        this.isConnecting = false
        reject(error)
      }
    })

    return this.connectionPromise
  }

  disconnect() {
    if (this.socket) {
      console.log('Disconnecting socket...')
      this.socket.disconnect()
      this.socket = null
      this.isConnecting = false
      this.connectionPromise = null
    }
  }

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = []
    }
    
    if (!this.listeners[event].includes(callback)) {
      this.listeners[event].push(callback)
    }
    
    if (this.socket) {
      this.socket.on(event, callback)
    }
    
    return () => this.off(event, callback)
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback)
    }
    
    if (this.socket) {
      this.socket.off(event, callback)
    }
  }

  emitWithAck(event, data) {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Socket not connected'))
        return
      }

      try {
        this.socket.emit(event, data, (response) => {
          if (response?.error) {
            reject(new Error(response.error.message || 'Request failed'))
          } else {
            resolve(response)
          }
        })
      } catch (error) {
        reject(error)
      }
    })
  }

  once(event, callback) {
    if (this.socket) {
      this.socket.once(event, callback)
    }
  }

  isConnected() {
    return this.socket?.connected || false
  }

  getSocket() {
    return this.socket
  }

  setReconnectDelay(delay) {
    this.baseReconnectDelay = delay
  }

  setMaxReconnectAttempts(attempts) {
    this.maxReconnectAttempts = attempts
  }

  getConnectionStatus() {
    return {
      connected: this.isConnected(),
      connecting: this.isConnecting,
      reconnectAttempts: this.reconnectAttempts,
      socketId: this.socket?.id
    }
  }

  emit(eventName, data) {
    if (this.socket?.connected) {
      this.socket.emit(eventName, data)
    } else {
      console.warn(`Socket not connected, cannot emit: ${eventName}`)
    }
  }

  createRoom(packId) {
    return this.emitWithAck('create_room', { packId })
      .catch(error => {
        console.error('Failed to create room:', error)
        throw error
      })
  }

  joinRoom(roomId, role) {
    return this.emitWithAck('join_room', { roomId, role })
      .catch(error => {
        console.error('Failed to join room:', error)
        throw error
      })
  }

  revealAnswer(roomId, answerIndex) {
    try {
      this.emit('reveal_answer', { roomId, answerIndex })
    } catch (error) {
      console.error('Failed to reveal answer:', error)
      throw error
    }
  }

  addMistake(roomId) {
    try {
      this.emit('add_mistake', { roomId })
    } catch (error) {
      console.error('Failed to add mistake:', error)
      throw error
    }
  }

  switchTeam(roomId) {
    try {
      this.emit('switch_team', { roomId })
    } catch (error) {
      console.error('Failed to switch team:', error)
      throw error
    }
  }

  awardPoints(roomId, team, points) {
    try {
      this.emit('award_points', { roomId, team, points })
    } catch (error) {
      console.error('Failed to award points:', error)
      throw error
    }
  }

  loadRound(roomId, roundData) {
    try {
      this.emit('load_round', { roomId, roundData })
    } catch (error) {
      console.error('Failed to load round:', error)
      throw error
    }
  }

  pressBuzzer(roomId, team, timestamp) {
    try {
      this.emit('buzzer_press', { roomId, team, timestamp })
    } catch (error) {
      console.error('Failed to press buzzer:', error)
      throw error
    }
  }

  resetBuzzer(roomId) {
    try {
      this.emit('reset_buzzer', { roomId })
    } catch (error) {
      console.error('Failed to reset buzzer:', error)
      throw error
    }
  }

  toggleSound(roomId, enabled) {
    try {
      this.emit('toggle_sound', { roomId, enabled })
    } catch (error) {
      console.error('Failed to toggle sound:', error)
      throw error
    }
  }

  setTeam(roomId, team) {
    try {
      this.emit('set_team', { roomId, team })
    } catch (error) {
      console.error('Failed to set team:', error)
      throw error
    }
  }
}

export default new SocketService()
