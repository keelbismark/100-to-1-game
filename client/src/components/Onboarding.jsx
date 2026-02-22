import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import settings from '../utils/settings'

function Onboarding({ onComplete, skip }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [steps] = useState([
    {
      title: 'Добро пожаловать!',
      content: 'Это игра "Сто к Одному" для компании друзей. Простой, веселый и интерактивный способ провести время.',
      icon: '🎮'
    },
    {
      title: 'Три роли',
      content: 'Для игры нужны три разных устройства и роли: Табло (на телевизоре), Ведущий (планшет), Кнопка (телефон игрока).',
      icon: '🎭'
    },
    {
      title: 'Создание игры',
      content: 'Нажмите "Создать игру", выберите пакет вопросов. Веб-страница сама откроет табло и панель ведущего.',
      icon: '🎲'
    },
    {
      title: 'Подключение игроков',
      content: 'Разошлите код комнаты игрокам или покажите QR код. Игроки открывают /game/XK42 и нажимают кнопку ответа.',
      icon: '🔗'
    },
    {
      title: 'Как играть',
      content: 'Задайте вопрос → Игроки нажимают кнопку → Открывайте правильные ответы → Начисляйте очки → Смените команду после 3 промахов.',
      icon: '⚡'
    },
    {
      title: 'Готовы играть!',
      content: 'Теперь вы знаете основы. Нажмите "Начать" и создайте свою первую игру!',
      icon: '🎉'
    }
  ])

  useEffect(() => {
    const hasSeenOnboarding = settings.getBoolean(settings.KEYS.SHOW_ONBOARDING)
    if (!hasSeenOnboarding && skip) {
      settings.setBoolean(settings.KEYS.SHOW_ONBOARDING, false)
    }
  }, [skip])

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = () => {
    settings.setBoolean(settings.KEYS.SHOW_ONBOARDING, false)
    if (onComplete) {
      onComplete()
    }
  }

  const handleSkip = () => {
    settings.setBoolean(settings.KEYS.SHOW_ONBOARDING, false)
    if (skip) {
      skip()
    }
  }

  if (skip) return null

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-container">
        <div className="onboarding-header">
          <div className="onboarding-icon">
            {steps[currentStep].icon}
          </div>
          <div className="onboarding-progress">
            <h2>{steps[currentStep].title}</h2>
            <div className="progress-bar">
              {steps.map((_, index) => (
                <div 
                  key={index} 
                  className={`progress-dot ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
                  onClick={() => setCurrentStep(index)}
                />
              ))}
            </div>
            <p className="step-indicator">
              Шаг {currentStep + 1} из {steps.length}
            </p>
          </div>
        </div>

        <div className="onboarding-content">
          <p className="onboarding-text">
            {steps[currentStep].content}
          </p>
        </div>

        <div className="onboarding-actions">
          <button 
            className="btn btn-secondary" 
            onClick={handleBack}
            disabled={currentStep === 0}
          >
            ← Назад
          </button>
          
          <button 
            className="btn btn-primary" 
            onClick={handleNext}
          >
            {currentStep === steps.length - 1 ? 'Начать играть! 🎉' : 'Далее →'}
          </button>
        </div>

        <button 
          className="skip-button" 
          onClick={handleSkip}
          aria-label="Пропустить обучение"
        >
          Пропустить обучение
        </button>
      </div>
    </div>
  )
}

Onboarding.propTypes = {
  onComplete: PropTypes.func,
  skip: PropTypes.bool
}

export default Onboarding
