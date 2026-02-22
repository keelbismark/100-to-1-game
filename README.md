# 🎮 Сто к Одному (100 to 1)

Multiplayer real-time game for parties, corporate events, and fun.

## 📋 Features

- **Real-time multiplayer** - Synchronized gameplay with WebSocket
- **Three roles** - Board (TV), Admin (tablet), Buzzer (phone)
- **Multiple game modes** - Simple, Double, Triple, Reverse, Big Game
- **Modern UI** - Responsive design with animations
- **Sound effects** - Audio feedback for game events
- **QR sharing** - Quick room connection
- **Undo functionality** - Cancel recent actions
- **Accessibility** - Keyboard shortcuts and screen reader support

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start server
cd server && npm run dev

# Start client (new terminal)
cd client && npm run dev

# Open http://localhost:3000
```

## 📦 Project Structure

```
├── client/              # React frontend
│   ├── src/
│   │   ├── components/ # React components
│   │   ├── services/   # API & Socket services
│   │   └── utils/      # Utility functions
│   └── e2e/           # Playwright tests
│
├── server/             # Node.js backend
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── middlewares/
│   │   ├── validators/
│   │   └── utils/
│   └── tests/         # Jest tests
│
└── game-packs/        # Game question packs
```

## 🎯 How to Play

1. **Create game** - Select question pack
2. **Open Board** - Display on TV/projector
3. **Open Admin** - Control game from tablet
4. **Players connect** - Use QR code or room code
5. **Press Buzzer** - First to press answers
6. **Reveal answers** - Admin reveals correct ones
7. **Score points** - Team scoring system

## 🔧 Technical Stack

### Frontend
- React 18
- Vite
- Socket.io-client
- Howler.js
- NoSleep.js
- React Router
- Playwright (E2E tests)

### Backend
- Node.js
- Express
- Socket.io
- Winston (logging)
- Joi (validation)
- Jest (unit tests)

## 📊 Game Modes

| Mode | Multiplier | Questions |
|------|-----------|-----------|
| Simple | x1 | 6 |
| Double | x2 | 6 |
| Triple | x3 | 6 |
| Reverse | x1 | 6 |
| Big Game | x1 | 5 |

## 🧪 Testing

```bash
# Server tests
cd server && npm test

# Client lint
cd client && npm run lint

# E2E tests (requires installation)
cd client
npm install -D @playwright/test
npx playwright install
npm run test:e2e
```

Test Coverage: **71.59%** (173 tests)

## 🐳 Docker

```bash
# Build and run
docker-compose up -d

# Stop and remove
docker-compose down
```

## 📖 Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

## 📄 License

MIT

## 🙏 Credits

Game inspired by "Family Feud" format.

---

**Need help?** Check the documentation in `/docs` folder or open an issue.
