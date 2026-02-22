class SettingsManager {
  KEYS = {
    SOUND_ENABLED: 'settings_soundEnabled',
    VOLUME: 'settings_volume',
    THEME: 'settings_theme',
    LANGUAGE: 'settings_language',
    SHOW_ONBOARDING: 'settings_showOnboarding',
    RECENT_ROOMS: 'settings_recentRooms',
    KEYBOARD_SHORTCUTS_ENABLED: 'settings_keyboardShortcutsEnabled',
    TOOLTIPS_ENABLED: 'settings_tooltipsEnabled',
    AUTO_CONNECT: 'settings_autoConnect',
    ADMIN_HISTORY_LENGTH: 'settings_adminHistoryLength',
    BUZZER_HAPTIC_ENABLED: 'settings_buzzerHapticEnabled',
    LAST_PACK_ID: 'settings_lastPackId'
  }

  getBoolean(key, defaultValue = false) {
    try {
      const value = localStorage.getItem(key)
      if (value === null) return defaultValue
      return JSON.parse(value)
    } catch (error) {
      console.error(`Error getting ${key}:`, error)
      return defaultValue
    }
  }

  setBoolean(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (error) {
      console.error(`Error setting ${key}:`, error)
      return false
    }
  }

  getNumber(key, defaultValue = 0) {
    try {
      const value = localStorage.getItem(key)
      if (value === null) return defaultValue
      return JSON.parse(value)
    } catch (error) {
      console.error(`Error getting ${key}:`, error)
      return defaultValue
    }
  }

  setNumber(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (error) {
      console.error(`Error setting ${key}:`, error)
      return false
    }
  }

  getString(key, defaultValue = '') {
    try {
      const value = localStorage.getItem(key)
      return value || defaultValue
    } catch (error) {
      console.error(`Error getting ${key}:`, error)
      return defaultValue
    }
  }

  setString(key, value) {
    try {
      localStorage.setItem(key, value)
      return true
    } catch (error) {
      console.error(`Error setting ${key}:`, error)
      return false
    }
  }

  getObject(key, defaultValue = null) {
    try {
      const value = localStorage.getItem(key)
      if (value === null) return defaultValue
      return JSON.parse(value)
    } catch (error) {
      console.error(`Error getting ${key}:`, error)
      return defaultValue
    }
  }

  setObject(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (error) {
      console.error(`Error setting ${key}:`, error)
      return false
    }
  }

  getArray(key, defaultValue = []) {
    try {
      const value = localStorage.getItem(key)
      if (value === null) return defaultValue
      return JSON.parse(value)
    } catch (error) {
      console.error(`Error getting ${key}:`, error)
      return defaultValue
    }
  }

  setArray(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (error) {
      console.error(`Error setting ${key}:`, error)
      return false
    }
  }

  add_recentRoom(roomId) {
    const recentRooms = this.getArray(this.KEYS.RECENT_ROOMS, [])
    const filtered = recentRooms.filter(room => room.id !== roomId)
    filtered.unshift({
      id: roomId,
      timestamp: Date.now(),
      playedAt: new Date().toLocaleString('ru-RU')
    })
    const limited = filtered.slice(0, 10)
    this.setArray(this.KEYS.RECENT_ROOMS, limited)
  }

  getRecentRooms() {
    return this.getArray(this.KEYS.RECENT_ROOMS, [])
  }

  getAllSettings() {
    return {
      soundEnabled: this.getBoolean(this.KEYS.SOUND_ENABLED, true),
      volume: this.getNumber(this.KEYS.VOLUME, 70),
      theme: this.getString(this.KEYS.THEME, 'dark'),
      language: this.getString(this.KEYS.LANGUAGE, 'ru'),
      showOnboarding: this.getBoolean(this.KEYS.SHOW_ONBOARDING, true),
      keyboardShortcutsEnabled: this.getBoolean(this.KEYS.KEYBOARD_SHORTCUTS_ENABLED, true),
      tooltipsEnabled: this.getBoolean(this.KEYS.TOOLTIPS_ENABLED, true),
      autoConnect: this.getBoolean(this.KEYS.AUTO_CONNECT, true),
      adminHistoryLength: this.getNumber(this.KEYS.ADMIN_HISTORY_LENGTH, 10),
      buzzerHapticEnabled: this.getBoolean(this.KEYS.BUZZER_HAPTIC_ENABLED, true),
      lastPackId: this.getString(this.KEYS.LAST_PACK_ID, 'pack1')
    }
  }

  resetAll() {
    Object.values(this.KEYS).forEach(key => {
      localStorage.removeItem(key)
    })
  }

  exportSettings() {
    return JSON.stringify(this.getAllSettings(), null, 2)
  }

  importSettings(jsonSettings) {
    try {
      const settings = JSON.parse(jsonSettings)
      Object.entries(settings).forEach(([key, value]) => {
        if (typeof value === 'boolean') {
          this.setBoolean(key, value)
        } else if (typeof value === 'number') {
          this.setNumber(key, value)
        } else if (Array.isArray(value)) {
          this.setArray(key, value)
        } else if (typeof value === 'object') {
          this.setObject(key, value)
        } else {
          this.setString(key, value)
        }
      })
      return true
    } catch (error) {
      console.error('Error importing settings:', error)
      return false
    }
  }
}

export default new SettingsManager()
