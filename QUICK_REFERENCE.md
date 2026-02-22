# Быстрые ссылки и ресурсы

Этот документ содержит полезные ссылки и ресурсы для работы с проектом "Сто к Одному".

## 📚 Документация

Основная документация:
- 📖 [README.md](README.md) - Главная документация
- 📊 [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) - Обзор проекта
- 🔧 [API.md](API.md) - Документация API
- 🚀 [DEPLOYMENT.md](DEPLOYMENT.md) - Развертывание
- 📝 [EXAMPLES.md](EXAMPLES.md) - Примеры использования
- 🤝 [CONTRIBUTING.md](CONTRIBUTING.md) - Вклад в проект
- 🧪 [TESTING.md](TESTING.md) - Тестирование
- 📋 [CHANGELOG.md](CHANGELOG.md) - История изменений

Формат пакетов:
- 📦 [game-packs/README.md](game-packs/README.md) - Формат игровых пакетов

Звуковые файлы:
- 🔊 [client/public/sounds/README.md](client/public/sounds/README.md) - Звуковые эффекты

## 🚀 Быстрый старт

### Установка
```bash
# Установка всех зависимостей
npm install:all

# Запуск (Windows)
start.bat

# Запуск (Unix)
bash start.sh
```

### URLs после старта
- 🏠 Главная: `http://localhost:3000`
- 🔌 Сервер: `ws://localhost:5000`

## 📂 Структура проекта

### Backend
- `server/src/server.js` - Сервер с Socket.io
- `server/package.json` - Зависимости сервера
- `server/src/` - Исходный код сервера
  - `controllers/` - Контроллеры (пусто пока)
  - `models/` - Модели данных (пусто пока)
  - `routes/` - HTTP маршруты (пусто пока)
  - `services/` - Сервисы (пусто пока)
  - `utils/` - Утилиты (пусто пока)

### Frontend
- `client/src/App.jsx` - Главный компонент
- `client/src/main.jsx` - Точка входа
- `client/src/index.css` - Основные стили
- `client/src/App.css` - Дополнительные стили
- `client/src/components/` - Компоненты
  - `Board/Board.jsx` - Табло
  - `Admin/Admin.jsx` - Панель ведущего
  - `Buzzer/Buzzer.jsx` - Кнопка игрока
  - `BigGame.jsx` - Большая игра
  - `ConnectionStatus.jsx` - Статус подключения
  - `PackEditor.jsx` - Редактор пакетов
- `client/src/services/` - Сервисы
  - `socketService.js` - Сокет сервис
- `client/src/utils/` - Утилиты
  - `gameManager.js` - Менеджер игры
- `client/package.json` - Зависимости клиента
- `client/vite.config.js` - Конфигурация Vite
- `client/index.html` - HTML шаблон

### Игровые пакеты
- `game-packs/pack1.json` - Пакет "День рождения"
- `game-packs/pack2.json` - Пакет "Корпоративная вечеринка"

## 🔧 Команды

### Установка
```bash
npm install:all              # Установить все зависимости
```

### Сервер
```bash
cd server
npm install                  # Установить зависимости сервера
npm start                    # Запустить сервер
npm run dev                  # Запустить в режиме разработки
```

### Клиент
```bash
cd client
npm install                  # Установить зависимости клиента
npm run dev                  # Запустить клиент (dev)
npm run build                # Собрать клинт для продакшена
npm run preview              # Предпросмотр сборки
```

### Git
```bash
git add .                    # Добавить все изменения
git commit -m "message"       # Закоммитить
git push                     # Запушить
git pull                     # Запулить
```

## 🎯 WebSocket события

### Быстрая шпаргалка

| Клиент → Сервер | Описание |
|---|---|
| `create_room` | Создать комнату |
| `join_room` | Присоединиться к комнате |
| `reveal_answer` | Открыть ответ |
| `add_mistake` | Добавить промах |
| `switch_team` | Переключить команду |
| `award_points` | Начислить очки |
| `load_round` | Загрузить раунд |
| `buzzer_press` | Нажать кнопку |
| `reset_buzzer` | Сбросить кнопку |
| `toggle_sound` | Переключить звук |

| Сервер → Клиент | Описание |
|---|---|
| `room_created` | Комната создана |
| `joined_room` | Успешное присоединение |
| `room_updated` | Обновление состояния |
| `answer_revealed` | Ответ открыт |
| `mistake_added` | Промах добавлен |
| `team_switched` | Команда переключена |
| `points_awarded` | Очки начислены |
| `round_loaded` | Раунд загружен |
| `buzzer_pressed` | Кнопка нажата |
| `buzzer_reset` | Кнопка сброшена |
| `sound_toggled` | Звук переключен |
| `error` | Ошибка |

## 🎨 Компоненты

### Board (Табло)
**URL:** `/game/{room_id}/board`  
**Использование:** Ноутбук/TV/Smart TV  
**Разрешение:** Любое (оптимизировано для 1080p+)

### Admin (Ведущий)
**URL:** `/game/{room_id}/admin`  
**Использование:** Планшет/Ноутбук  
**Разрешение:** От 768px (оптимизировано для планшета)

### Buzzer (Кнопка)
**URL:** `/game/{room_id}/buzzer`  
**Использование:** Смартфон  
**Разрешение:** От 320px (оптимизировано для телефона)

## 🎮 Игровые режимы

| Режим | Множитель | Ответов | Особенности |
|---|---|---|---|
| Простой (Simple) | x1 | 6 | Базовый раунд |
| Двойной (Double) | x2 | 6 | Очки удваиваются |
| Тройной (Triple) | x3 | 6 | Очки утраиваются |
| Обратно (Reverse) | x1 | 6 | Самые популярные - меньше очков |
| Большая игра (Big Game) | x1 | 5+ | 5 вопросов, финал |

## 📦 Требуемые звуковые файлы

Разместите в `client/public/sounds/`:

1. **reveal.mp3** - Звук открытия ответа (~0.5-1с)
2. **mistake.mp3** - Звук промаха (~0.5с)
3. **wrong.mp3** - Звук ошибки, 3 промаха (~1-2с)
4. **winner.mp3** - Звук победителя (~1с)

**Где найти:**
- Freesound.org
- Zapsplat.com
- Mixkit.co
- Или создайте в Audacity

## 🔗 Полезные ресурсы

### Технологии
- [React](https://react.dev/) - UI библиотека
- [Vite](https://vitejs.dev/) - Сборщик
- [Socket.io](https://socket.io/) - WebSocket
- [Node.js](https://nodejs.org/) - Runtime
- [Express](https://expressjs.com/) - Web фреймворк
- [Howler.js](https://howlerjs.com/) - Звуки
- [NoSleep.js](https://github.com/richtr/NoSleep.js) - No sleep

### Документация
- [React Router](https://reactrouter.com/)
- [Socket.io-client](https://socket.io/docs/v4/client-api/)
- [MDN Web Docs](https://developer.mozilla.org/)
- [Can I Use](https://caniuse.com/) - Поддержка браузеров

### Инструменты
- [VS Code](https://code.visualstudio.com/) - Редактор
- [Postman](https://www.postman.com/) - API тестирование
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/) - Отладка
- [Git](https://git-scm.com/) - Контроль версий

### Дизайн
- [Figma](https://www.figma.com/) - Дизайн
- [Coolors](https://coolors.co/) - Цветовые палитры
- [Google Fonts](https://fonts.google.com/) - Шрифты
- [Font Awesome](https://fontawesome.com/) - Иконки

### Хостинг
- [Heroku](https://www.heroku.com/) - PaaS
- [DigitalOcean](https://www.digitalocean.com/) - VPS
- [Railway](https://railway.app/) - PaaS
- [Render](https://render.com/) - PaaS

### База знаний
- [Stack Overflow](https://stackoverflow.com/)
- [MDN Web Docs](https://developer.mozilla.org/)
- [CSS Tricks](https://css-tricks.com/)
- [FreeCodeCamp](https://www.freecodecamp.org/)

## 🐛 Troubleshooting

### Частые проблемы

**Сервер не запускается:**
```bash
# Проверьте порт 5000 не занят
# Linux/Mac
lsof -i :5000

# Windows
netstat -ano | findstr :5000

# Убейте процесс если нужно
kill -9 <PID>
```

**Клиент не подключается:**
- Проверьте что сервер запущен
- Проверьте CORS настройки
- Проверьте URL в `client/vite.config.js`

**WebSocket не работает:**
- Проверьте конфигурацию Nginx (если используется)
- Убедитесь что заголовки `Upgrade` и `Connection` верны
- Проверьте брандмауэр

**Звуки не играют:**
- Проверьте что файлы существуют в `client/public/sounds/`
- Проверьте формат (MP3)
- Нажмите кнопку "Включить звук" на табло (блокировщикиautoplay)

## 📊 Мониторинг

### Логи
```bash
# Серверные логи (PM2)
pm2 logs 100-to-1-server

# Клиентские логи (DevTools)
# F12 -> Console
```

### Производительность
```bash
# CPU
htop

# Память
free -h

# Диск
df -h

# Сеть
netstat -an
```

## 🔐 Безопасность

- ❌ НЕ коммитите `.env` файлы
- ❌ НЕ коммитите ключи и пароли
- ✅ Используйте HTTPS в продакшене
- ✅ Настройте CORS корректно
- ✅ Валидируйте все входные данные
- ✅ Используйте актуальные зависимости

## 🤝 Сообщество

- GitHub Issues: Создайте issue для багов
- GitHub Pull Requests: Предлагайте улучшения
- GitHub Discussions: Обсуждайте идеи

## 📄 Лицензия

ISC License

---

**Подсказка:** Добавьте эту страницу в закладки для быстрого доступа! 🔖
