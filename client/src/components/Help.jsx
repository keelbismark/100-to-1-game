import React, { useState } from 'react'
import PropTypes from 'prop-types'

function Help({ onClose }) {
  const [activeTab, setActiveTab] = useState('rules')
  const [expandedFaq, setExpandedFaq] = useState(null)

  const rules = [
    { id: 1, title: 'Основные правила', content: 'Игра "Сто к Одному" - это командное шоу, где нужно угадать самые популярные ответы на опросные вопросы. Команды по очереди дают ответы, за каждый правильный ответ начисляются очки.' },
    { id: 2, title: 'Структура игры', content: 'Игра состоит из 4 раундов: Простой (x1), Двойной (x2 очков), Тройной (x3 очков) и Игра наоборот. В конце проводится Большая игра с 5 вопросами.' },
    { id: 3, title: 'Как играть', content: '1. Создайте игру\n2. Откройте Табло на телевизоре/проекторе\n3. Ведущий открывает Панель управления на планшете/ноутбуке\n4. Игроки используют Кнопку на телефонах\n5. Задайте вопрос\n6. Игроки нажимают кнопку, чтобы ответить\n7. Открывайте правильные ответы\n8. Начисляйте очки активной команде\n9. После 3 промахов - смена хода' },
    { id: 4, title: 'Раунды', content: 'Простой: обычный раунд с 6 ответами\nДвойной: очки удваиваются\nТройной: очки утраиваются\nОбратно: самый популярный ответ дает меньше очков\nБольшая игра: 5 вопросов, финал с 2 игроками' },
    { id: 5, title: 'Очки и победа', content: 'Каждый ответ имеет свои очки. Сумма очков всех правильных ответов команды = заработок команды. В конце побеждает команда с наибольшей суммой очков.' },
    { id: 6, title: 'Промахи', content: 'Если команда дает неверный ответ, ведущий нажимает "Промах". После 3 промахов ход переходит к другой команде. Промахи показываются как X, XX, XXX на табло.' }
  ]

  const faqs = [
    { 
      id: 1, 
      question: 'Что такое код комнаты?', 
      answer: 'Код комнаты (например, XK42) - это 4-символьный уникальный идентификатор вашей игры. Используйте его, чтобы подключить игроков к вашей игре.' 
    },
    { 
      id: 2, 
      question: 'Сколько устройств нужно для игры?', 
      answer: 'Минимум 3 устройства: 1) Табло (телевизор/проектор) для отображения игры; 2) Панель ведущего (планшет/ноутбук) для управления; 3) Кнопка (телефон) для каждого игрока.' 
    },
    { 
      id: 3, 
      question: 'Могу ли я играть без интернета?', 
      answer: 'Да! Если все устройства в одной локальной сети (Wi-Fi), игра будет работать без интернета. Табло, админ и кнопки соединяются через локальный сервер.' 
    },
    { 
      id: 4, 
      question: 'Как создать свои вопросы?', 
      answer: 'Используйте кнопку "Создать пакет" на главном экране или создайте JSON файл в папке game-packs/ следуя формату из документации.' 
    },
    { 
      id: 5, 
      question: 'Что делает Кнопка игрока?', 
      answer: 'Кнопка позволяет игрокам нажать, чтобы показать, что они готовы ответить. Первый нажавший определяется победителем и дает ответ.' 
    },
    { 
      id: 6, 
      question: 'Можно ли отменить последнее действие?', 
      answer: 'Да, на панели ведущего есть кнопка "Отменить" для возвращения последнего действия. Можно вернуть до 5 последних действий.' 
    },
    { 
      id: 7, 
      question: 'Как включить звук?', 
      answer: 'При первом открытии табло appears кнопка "Включить звук / Начать игру". Нажмите её, чтобы включить звуковые эффекты. Также можно включить/выключить в панели ведущего.' 
    },
    { 
      id: 8, 
      question: 'Сколько человек может играть?', 
      answer: 'Ограничений нет! Одна игра - две команды, но каждая команда может иметь неограниченное количество игроков. Оптимально 6-12 человек, разделенных на 2 команды.' 
    },
    { 
      id: 9, 
      question: 'Что происходит при отключении интернета?', 
      answer: 'Если игра уже началась, она продолжится работать в локальной сети. При отключении сервера попытается переподключиться автоматически.' 
    },
    { 
      id: 10, 
      question: 'Как сохранить результаты игры?', 
      answer: 'Сделайте скриншот табло или запишите очки на бумаге. В будущих версиях будет функция сохранения истории игр.' 
    }
  ]

  const roles = [
    { 
      title: '📺 Табло (Board)', 
      description: 'Отображается на большом экране (телевизор/проектор). Показывает вопросы, ответы, очки команд, промахи. Игроки видят эту часть игры.',
      device: 'Телевизор, проектор или большой экран'
    },
    { 
      title: '👨‍💼 Ведущий (Admin)', 
      description: 'Панель управления для ведущего игры. Здесь выбираются раунды, открываются ответы, начисляются очки, управляются промахи и кнопкой.',
      device: 'Планшет, ноутбук или другой компьютер'
    },
    { 
      title: '🔴 Кнопка (Buzzer)', 
      description: 'Интерфейс для игроков. Большая кнопка для нажатия, выбор команды, показ результата кто первый ответил.',
      device: 'Смартфон игрока'
    }
  ]

  const shortcuts = [
    { key: '1', action: 'Открыть первый ответ' },
    { key: '2', action: 'Открыть второй ответ' },
    { key: '3', action: 'Открыть третий ответ' },
    { key: '4', action: 'Открыть четвертый ответ' },
    { key: '5', action: 'Открыть пятый ответ' },
    { key: '6', action: 'Открыть шестой ответ' },
    { key: 'Space', action: 'Добавить промах' },
    { key: 'Tab', action: 'Сменить команду' },
    { key: 'Enter', action: 'Начислить очки' },
    { key: 'Ctrl+Z', action: 'Отменить действие' },
    { key: 'Escape', action: 'Закрыть справку' }
  ]

  return (
    <div className="help-overlay">
      <div className="help-container">
        <div className="help-header">
          <h1>Справка</h1>
          <button className="close-button" onClick={onClose} aria-label="Закрыть">
            ✕
          </button>
        </div>

        <div className="help-tabs">
          <button 
            className={`help-tab ${activeTab === 'rules' ? 'active' : ''}`}
            onClick={() => setActiveTab('rules')}
          >
            Правила
          </button>
          <button 
            className={`help-tab ${activeTab === 'roles' ? 'active' : ''}`}
            onClick={() => setActiveTab('roles')}
          >
            Роли
          </button>
          <button 
            className={`help-tab ${activeTab === 'faq' ? 'active' : ''}`}
            onClick={() => setActiveTab('faq')}
          >
            FAQ
          </button>
          <button 
            className={`help-tab ${activeTab === 'shortcuts' ? 'active' : ''}`}
            onClick={() => setActiveTab('shortcuts')}
          >
            Клавиатура
          </button>
        </div>

        <div className="help-content">
          {activeTab === 'rules' && (
            <div className="rules-section">
              {rules.map(rule => (
                <div key={rule.id} className="rule-item">
                  <h3>{rule.title}</h3>
                  <p>{rule.content}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'roles' && (
            <div className="roles-section">
              {roles.map((role, index) => (
                <div key={index} className="role-item">
                  <h3>{role.title}</h3>
                  <p>{role.description}</p>
                  <p className="role-device">
                    <strong>Устройство:</strong> {role.device}
                  </p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'faq' && (
            <div className="faq-section">
              {faqs.map(faq => (
                <div key={faq.id} className="faq-item">
                  <button 
                    className={`faq-question ${expandedFaq === faq.id ? 'expanded' : ''}`}
                    onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                  >
                    <span>{faq.question}</span>
                    <span className="faq-arrow">{expandedFaq === faq.id ? '▼' : '▶'}</span>
                  </button>
                  {expandedFaq === faq.id && (
                    <div className="faq-answer">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'shortcuts' && (
            <div className="shortcuts-section">
              <p className="shortcuts-intro">
                Быстрые клавиши для опытных пользователей
              </p>
              <div className="shortcuts-grid">
                {shortcuts.map((shortcut, index) => (
                  <div key={index} className="shortcut-item">
                    <kbd className="shortcut-key">{shortcut.key}</kbd>
                    <span className="shortcut-action">{shortcut.action}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="help-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Закрыть справку
          </button>
        </div>
      </div>
    </div>
  )
}

Help.propTypes = {
  onClose: PropTypes.func.isRequired
}

export default Help
