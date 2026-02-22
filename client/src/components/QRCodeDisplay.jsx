import React from 'react'
import QRCode from 'qrcode.react'
import PropTypes from 'prop-types'
import settings from '../utils/settings'

function QRCodeDisplay({ 
  roomId, 
  onClose, 
  showHelp = true 
}) {
  const [copied, setCopied] = React.useState(false)
  
  const buzzerUrl = `${window.location.origin}/game/${roomId}/buzzer`
  const boardUrl = `${window.location.origin}/game/${roomId}/board`
  const adminUrl = `${window.location.origin}/game/${roomId}/admin`

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(type)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Присоединиться к игре "Сто к Одному"',
          text: `Код комнаты: ${roomId}`,
          url: boardUrl
        })
      } catch (error) {
        console.error('Share failed:', error)
      }
    } else {
      copyToClipboard(buzzerUrl, 'buzzer')
    }
  }

  return (
    <div className="qr-overlay" onClick={onClose}>
      <div className="qr-container" onClick={e => e.stopPropagation()}>
        <div className="qr-header">
          <h2>QR Коды для быстрого подключения</h2>
          <button 
            className="close-button" 
            onClick={onClose}
            aria-label="Закрыть"
          >
            ✕
          </button>
        </div>

        <div className="qr-content">
          <div className="qr-section">
            <h3>📱 Кнопка игрока</h3>
            <div className="qr-code-wrapper">
              <QRCode 
                value={buzzerUrl}
                size={200}
                level="H"
                includeMargin={true}
                renderAs="canvas"
                fgColor="#4facfe"
                bgColor="#1a1a2e"
              />
            </div>
            <p className="qr-url">{buzzerUrl}</p>
            <div className="qr-actions">
              <button 
                className="qr-action-btn"
                onClick={() => copyToClipboard(buzzerUrl, 'buzzer')}
                title="Копировать ссылку кнопки"
              >
                {copied === 'buzzer' ? '✓ Скопировано' : '📋 Копировать'}
              </button>
              <button 
                className="qr-action-btn"
                onClick={shareLink}
                title="Поделиться ссылкой"
              >
                📤 Поделиться
              </button>
            </div>
          </div>

          <div className="qr-section">
            <h3>📺 Табло</h3>
            <div className="qr-code-wrapper small">
              <QRCode 
                value={boardUrl}
                size={150}
                level="H"
                includeMargin={true}
                renderAs="canvas"
                fgColor="#f7b733"
                bgColor="#1a1a2e"
              />
            </div>
            <p className="qr-url">{boardUrl}</p>
            <button 
              className="qr-action-btn"
              onClick={() => copyToClipboard(boardUrl, 'board')}
              title="Копировать ссылку табло"
            >
              {copied === 'board' ? '✓ Скопировано' : '📋 Копировать'}
            </button>
          </div>

          <div className="qr-section">
            <h3>👨‍💼 Ведущий</h3>
            <div className="qr-code-wrapper small">
              <QRCode 
                value={adminUrl}
                size={150}
                level="H"
                includeMargin={true}
                renderAs="canvas"
                fgColor="#fc4a1a"
                bgColor="#1a1a2e"
              />
            </div>
            <p className="qr-url">{adminUrl}</p>
            <button 
              className="qr-action-btn"
              onClick={() => copyToClipboard(adminUrl, 'admin')}
              title="Копировать ссылку ведущего"
            >
              {copied === 'admin' ? '✓ Скопировано' : '📋 Копировать'}
            </button>
          </div>
        </div>

        <div className="room-code-display">
          <div className="code-label">Код комнаты:</div>
          <div className="code-value">{roomId}</div>
          <button 
            className="copy-code-btn"
            onClick={() => copyToClipboard(roomId, 'room')}
            title="Копировать код"
          >
            {copied === 'room' ? '✓' : '📋'}
          </button>
        </div>

        <div className="qr-footer">
          <p className="qr-tip">
            💡 Сканируйте QR код кнопки на телефоне или отправьте ссылку игрокам
          </p>
          {showHelp && (
            <button 
              className="qr-help-btn"
              onClick={() => window.dispatchEvent(new CustomEvent('openHelp'))}
            >
              📚 Справка
            </button>
          )}
          <button 
            className="btn btn-primary qr-close-btn"
            onClick={onClose}
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  )
}

QRCodeDisplay.propTypes = {
  roomId: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  showHelp: PropTypes.bool
}

export default QRCodeDisplay
