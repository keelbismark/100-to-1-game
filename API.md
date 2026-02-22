# API Documentation

## WebSocket Events

### Client → Server Events

#### `create_room`
Creates a new game room.

**Payload:**
```json
{
  "packId": "string"
}
```

**Response:** `room_created`
```json
{
  "roomId": "string",
  "room": {
    "id": "string",
    "packId": "string",
    "players": [],
    "currentRound": "simple",
    "board": {
      "answers": [],
      "revealed": [],
      "mistakes": 0,
      "team1Score": 0,
      "team2Score": 0,
      "bank": 0,
      "activeTeam": 1
    },
    "buzzer": {
      "team1Pressed": false,
      "team2Pressed": false,
      "winner": null
    }
  }
}
```

#### `join_room`
Joins an existing room.

**Payload:**
```json
{
  "roomId": "string",
  "role": "board" | "admin" | "buzzer"
}
```

**Response:** `joined_room`
```json
{
  "roomId": "string",
  "playerId": "string"
}
```

#### `set_team`
Sets the team for a buzzer player.

**Payload:**
```json
{
  "roomId": "string",
  "team": 1 | 2
}
```

**Broadcast:** `room_updated`

#### `reveal_answer`
Reveals an answer on the board.

**Payload:**
```json
{
  "roomId": "string",
  "answerIndex": number
}
```

**Broadcast:** `answer_revealed`
```json
{
  "answerIndex": number,
  "answer": {
    "text": "string",
    "score": number
  },
  "bank": number
}
```

#### `add_mistake`
Adds a mistake to the current round.

**Payload:**
```json
{
  "roomId": "string"
}
```

**Broadcast:** `mistake_added`
```json
{
  "mistakes": number
}
```

#### `switch_team`
Switches the active team.

**Payload:**
```json
{
  "roomId": "string"
}
```

**Broadcast:** `team_switched`
```json
{
  "activeTeam": 1 | 2
}
```

#### `award_points`
Awards points to a team.

**Payload:**
```json
{
  "roomId": "string",
  "team": 1 | 2,
  "points": number
}
```

**Broadcast:** `points_awarded`
```json
{
  "team": 1 | 2,
  "points": number
}
```

#### `load_round`
Loads a new round with questions.

**Payload:**
```json
{
  "roomId": "string",
  "roundData": {
    "question": "string",
    "answers": [
      {
        "text": "string",
        "score": number
      }
    ],
    "type": "simple" | "double" | "triple" | "reverse"
  }
}
```

**Broadcast:** `round_loaded` (same as roundData payload)

#### `buzzer_press`
Presses the buzzer.

**Payload:**
```json
{
  "roomId": "string",
  "team": 1 | 2,
  "timestamp": number
}
```

**Broadcast:** `buzzer_pressed`
```json
{
  "winner": 1 | 2
}
```

#### `reset_buzzer`
Resets the buzzer state.

**Payload:**
```json
{
  "roomId": "string"
}
```

**Broadcast:** `buzzer_reset`

#### `toggle_sound`
Toggles sound on/off.

**Payload:**
```json
{
  "roomId": "string",
  "enabled": boolean
}
```

**Broadcast:** `sound_toggled`
```json
{
  "enabled": boolean
}
```

### Server → Client Events

#### `room_created`
Sent when a room is successfully created.

```json
{
  "roomId": "string",
  "room": { ... }
}
```

#### `joined_room`
Sent when a player successfully joins a room.

```json
{
  "roomId": "string",
  "playerId": "string"
}
```

#### `room_updated`
Broadcast when any room state changes.

```json
{
  "id": "string",
  "packId": "string",
  "players": [...],
  "currentRound": "string",
  "board": { ... },
  "buzzer": { ... }
}
```

#### `answer_revealed`
Sent when an answer is revealed.

```json
{
  "answerIndex": number,
  "answer": { ... },
  "bank": number
}
```

#### `mistake_added`
Sent when a mistake is added.

```json
{
  "mistakes": number
}
```

#### `team_switched`
Sent when active team changes.

```json
{
  "activeTeam": 1 | 2
}
```

#### `points_awarded`
Sent when points are awarded.

```json
{
  "team": 1 | 2,
  "points": number
}
```

#### `round_loaded`
Sent when a new round is loaded.

```json
{
  "question": "string",
  "answers": [...],
  "type": "string"
}
```

#### `buzzer_pressed`
Sent when a buzzer is pressed.

```json
{
  "winner": 1 | 2
}
```

#### `buzzer_reset`
Sent when buzzer is reset.

(no payload)

#### `sound_toggled`
Sent when sound state changes.

```json
{
  "enabled": boolean
}
```

#### `error`
Sent when an error occurs.

```json
{
  "message": "string"
}
```

## HTTP API

### GET /health
Health check endpoint.

**Response:** `200 OK`
```json
{
  "status": "ok",
  "timestamp": "string"
}
```

## Room Object Structure

```json
{
  "id": "string",
  "packId": "string",
  "players": [
    {
      "id": "string",
      "role": "buzzer",
      "team": 1 | 2
    }
  ],
  "currentRound": "simple",
  "board": {
    "answers": [
      {
        "text": "string",
        "score": number
      }
    ],
    "revealed": [number],
    "mistakes": number,
    "team1Score": number,
    "team2Score": number,
    "bank": number,
    "activeTeam": 1 | 2
  },
  "buzzer": {
    "team1Pressed": boolean,
    "team2Pressed": boolean,
    "winner": 1 | 2 | null
  }
}
```

## Game Pack Structure

```json
{
  "pack_id": "string",
  "title": "string",
  "description": "string",
  "rounds": {
    "simple": {
      "question": "string",
      "answers": [
        {
          "text": "string",
          "score": number
        }
      ]
    },
    "double": { ... },
    "triple": { ... },
    "reverse": { ... },
    "big_game": [
      {
        "question": "string",
        "answers": [
          {
            "text": "string",
            "score": number,
            "synonyms": ["string"]
          }
        ]
      }
    ]
  }
}
```

## Error Codes

- `ROOM_NOT_FOUND` - Room doesn't exist
- `INVALID_ROOM_ID` - Invalid room ID format
- `ROOM_FULL` - Room is full
- `ALREADY_JOINED` - Player already joined
- `INVALID_TEAM` - Invalid team number
- `GAME_IN_PROGRESS` - Cannot perform action during game
