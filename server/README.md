# Server Documentation

This document provides detailed information about the backend server architecture, configuration, and usage.

## 🏗️ Architecture Overview

The server follows a modular architecture with clear separation of concerns:

```
server/
├── src/
│   ├── server.js              # Main entry point
│   ├── config/
│   │   └── config.js          # Configuration with validation
│   ├── controllers/
│   │   └── room.controller.js # WebSocket event handlers
│   ├── services/
│   │   └── room.service.js    # Business logic for rooms
│   ├── middlewares/
│   │   ├── rateLimiter.js     # Rate limiting
│   │   ├── security.js        # Security headers & socket security
│   │   └── errorHandler.js    # Error handling utilities
│   ├── validators/
│   │   └── room.validator.js  # Input validation with Joi
│   └── utils/
│       └── logger.js          # Winston logger
├── tests/
│   ├── setup.js               # Test setup
│   ├── room.service.test.js   # Service tests
│   └── room.validator.test.js # Validator tests
├── logs/                      # Log files (generated)
├── data/                      # Persistent data (generated)
├── package.json
├── Dockerfile
└── .env.example
```

## 📦 Key Components

### Configuration (`config/config.js`)
- Environment variable validation using Joi
- App-level configuration for ports, URLs, logging
- CORS and rate limiting settings

### Controllers (`controllers/room.controller.js`)
- Handles WebSocket events
- Coordinates between validators and services
- Manages error handling for socket operations

### Services (`services/room.service.js`)
- Business logic for room management
- Room state persistence (JSON file)
- Player management and team logic
- Game mechanics (buzzer, answers, mistakes, points)

### Validators (`validators/room.validator.js`)
- Input validation using Joi
- Ensures data integrity
- Provides detailed error messages

### Middlewares
- **Rate Limiter**: Prevents abuse with configurable limits
- **Security**: Helmet headers and socket authentication
- **Error Handler**: Centralized error management

### Logger (`utils/logger.js`)
- Structured logging with Winston
- Multiple log levels (error, warn, info, debug)
- Console and file outputs
- Exception and rejection tracking

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the server directory:

```env
NODE_ENV=development                    # development|production|test
PORT=5000                                # Server port
CLIENT_URL=http://localhost:3000         # Frontend URL
LOG_LEVEL=info                           # error|warn|info|debug
LOG_DIR=logs                            # Log directory
RATE_LIMIT_WINDOW_MS=900000             # Rate limit window (15 min)
RATE_LIMIT_MAX_REQUESTS=100             # Max requests per window
PRODUCTION_URL=https://your-domain.com  # Production URL
```

### Configuration Validation

The configuration is validated on startup. Invalid values will prevent the server from starting with a clear error message.

## 🚀 Getting Started

### Installation

```bash
cd server
npm install
```

### Running the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

### Running Tests

```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm run test:watch
```

## 🔌 API Endpoints

### Health Check
```http
GET /health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-02-22T12:00:00.000Z",
  "uptime": 3600.123,
  "environment": "development",
  "version": "1.1.0",
  "stats": {
    "totalRooms": 5,
    "totalPlayers": 12,
    "roomsByRound": {
      "simple": 2,
      "double": 2,
      "triple": 1
    },
    "activeRooms": 3
  }
}
```

### Get Statistics
```http
GET /api/stats
```

Response:
```json
{
  "success": true,
  "data": {
    "totalRooms": 5,
    "totalPlayers": 12,
    "roomsByRound": {
      "simple": 2,
      "double": 2,
      "triple": 1
    },
    "activeRooms": 3
  }
}
```

## 🔌 WebSocket Events

### Client → Server Events

| Event | Payload | Description |
|-------|---------|-------------|
| `create_room` | `{ packId: string }` | Create a new game room |
| `join_room` | `{ roomId, role }` | Join an existing room |
| `set_team` | `{ roomId, team }` | Set player team (1 or 2) |
| `reveal_answer` | `{ roomId, answerIndex }` | Reveal an answer |
| `add_mistake` | `{ roomId }` | Add a mistake to current round |
| `switch_team` | `{ roomId }` | Switch active team |
| `award_points` | `{ roomId, team, points }` | Award points to a team |
| `load_round` | `{ roomId, roundData }` | Load a new round |
| `buzzer_press` | `{ roomId, team, timestamp }` | Press the buzzer |
| `reset_buzzer` | `{ roomId }` | Reset buzzer state |
| `toggle_sound` | `{ roomId, enabled }` | Toggle sound on/off |

### Server → Client Events

| Event | Payload | Description |
|-------|---------|-------------|
| `room_created` | `{ roomId, room }` | Room created successfully |
| `joined_room` | `{ roomId, playerId }` | Player joined room |
| `room_updated` | `Room` | Room state updated |
| `answer_revealed` | `{ answerIndex, answer, bank }` | Answer revealed |
| `mistake_added` | `{ mistakes }` | Mistake added |
| `team_switched` | `{ activeTeam }` | Active team changed |
| `points_awarded` | `{ team, points }` | Points awarded |
| `round_loaded` | `RoundData` | New round loaded |
| `buzzer_pressed` | `{ winner }` | Buzzer pressed |
| `buzzer_reset` | - | Buzzer reset |
| `sound_toggled` | `{ enabled }` | Sound toggled |
| `error` | `{ message }` | Error occurred |

## 💾 Persistence

### Room State Storage

Rooms are persisted to `data/rooms.json` with the following schema:

```json
{
  "ABCD": {
    "id": "ABCD",
    "packId": "pack1",
    "players": [
      {
        "id": "socket123",
        "role": "buzzer",
        "team": 1,
        "joinedAt": "2024-02-22T12:00:00.000Z"
      }
    ],
    "currentRound": "simple",
    "board": {
      "answers": [...],
      "revealed": [],
      "mistakes": 0,
      "team1Score": 50,
      "team2Score": 30,
      "bank": 0,
      "activeTeam": 1
    },
    "buzzer": {
      "team1Pressed": false,
      "team2Pressed": false,
      "winner": null
    },
    "createdAt": "2024-02-22T12:00:00.000Z",
    "updatedAt": "2024-02-22T12:00:10.000Z"
  }
}
```

### Automatic Cleanup

Inactive rooms (not updated in 24 hours) are automatically cleaned up every hour.

## 🛡️ Security

### Rate Limiting
- Default: 100 requests per 15 minutes per IP
- Configurable via environment variables
- Socket.io paths are exempted

### Security Headers
- Helmet.js middleware applies security headers
- HSTS enabled in production
- Content Security Policy configured

### Socket Security
- Referer checking in production
- IP logging for all connections
- Connection attempt limits

### Input Validation
- All WebSocket events validated with Joi
- Detailed error messages for invalid data
- Type checking and format validation

## 📊 Logging

### Log Levels
- `error`: Critical errors that need attention
- `warn`: Warning messages for potential issues
- `info`: General informational messages
- `debug`: Detailed debugging information

### Log Files
- `logs/error.log`: Error-level logs
- `logs/combined.log`: All logs combined
- `logs/exceptions.log`: Uncaught exceptions
- `logs/rejections.log`: Unhandled promise rejections

### Structured Logging
Logs include timestamp, level, and relevant metadata for better analysis.

## 🧪 Testing

### Test Structure

```bash
server/
├── tests/
│   ├── setup.js               # Global test setup
│   ├── room.service.test.js   # Service tests
│   └── room.validator.test.js # Validator tests
└── coverage/                  # Coverage reports (generated)
```

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm run test:watch
```

### Test Coverage

Target coverage:
- Branches: 50%
- Functions: 50%
- Lines: 50%
- Statements: 50%

## 🐳 Docker

### Building the Image

```bash
docker build -t 100-to-1-server .
```

### Running the Container

```bash
docker run -p 5000:5000 \
  -e NODE_ENV=production \
  -e CLIENT_URL=http://localhost:3000 \
  -v $(pwd)/logs:/app/logs \
  -v $(pwd)/data:/app/data \
  100-to-1-server
```

### Docker Compose

Use `docker-compose.yml` from the project root:

```bash
docker-compose up -d
```

## 🚀 Deployment

### PM2

```bash
# Install PM2
npm install -g pm2

# Start server
pm2 start src/server.js --name "100-to-1-server"

# Save process list
pm2 save

# Setup startup script
pm2 startup

# View logs
pm2 logs 100-to-1-server

# Restart
pm2 restart 100-to-1-server
```

### Environment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure `CLIENT_URL` with production URL
- [ ] Set `LOG_LEVEL=info` or `warn`
- [ ] Configure reverse proxy (Nginx)
- [ ] Enable HTTPS
- [ ] Set up proper backup for data/logs

## 🐛 Troubleshooting

### Common Issues

**Port already in use:**
```bash
# Linux/Mac
lsof -i :5000
kill -9 <PID>

# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

**Database files not loading:**
- Ensure `data/` directory exists and is writable
- Check file permissions
- Review logs for errors

**Rate limiting issues:**
- Adjust `RATE_LIMIT_MAX_REQUESTS` in `.env`
- Check IP forwarding if behind proxy
- Review `logs/combined.log` for blocked requests

## 📚 Additional Resources

- [Express Documentation](https://expressjs.com/)
- [Socket.io Documentation](https://socket.io/docs/)
- [Winston Documentation](https://github.com/winstonjs/winston)
- [Joi Documentation](https://joi.dev/api/)

## 🔗 Related Documentation

- [Root README](../../README.md) - Project overview
- [API Documentation](../../API.md) - Full API reference
- [Deployment Guide](../../DEPLOYMENT.md) - Deployment instructions
