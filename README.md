# Holo Bridge

A type-safe TypeScript bridge between websites and Discord bots. Provides a REST API and WebSocket interface for full Discord bot capabilities.

## Features

- **REST API** for all Discord operations
- **WebSocket** real-time event streaming
- **Type-safe** with Zod validation
- **Full Discord.js coverage**:
  - Guilds, Channels, Roles
  - Members, Bans, Timeouts
  - Messages, Reactions, Pins
  - Voice state tracking
  - And more...

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your values:

```env
DISCORD_TOKEN=your_discord_bot_token
API_KEY=your_secure_api_key
PORT=3000
```

### 3. Run

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## API Reference

### Authentication

All API requests require the `X-API-Key` header:

```bash
curl -H "X-API-Key: your_key" http://localhost:3000/api/guilds
```

### REST Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/guilds` | List all guilds |
| `GET` | `/api/guilds/:id` | Get guild details |
| `GET` | `/api/guilds/:id/channels` | Get guild channels |
| `GET` | `/api/guilds/:id/roles` | Get guild roles |
| `GET` | `/api/guilds/:id/members` | List members |
| `POST` | `/api/guilds/:id/members/:userId/kick` | Kick member |
| `POST` | `/api/guilds/:id/members/:userId/ban` | Ban member |
| `GET` | `/api/channels/:id/messages` | Get messages |
| `POST` | `/api/channels/:id/messages` | Send message |
| `PATCH` | `/api/channels/:id/messages/:msgId` | Edit message |
| `DELETE` | `/api/channels/:id/messages/:msgId` | Delete message |

### WebSocket Events

Connect using Socket.IO:

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: { apiKey: 'your_key' }
});

// Subscribe to guild events
socket.emit('subscribe', { guildIds: ['123456789'] });

// Listen for Discord events
socket.on('discord', (event) => {
  console.log(event.event, event.data);
});
```

**Events:** `messageCreate`, `messageUpdate`, `messageDelete`, `guildMemberAdd`, `guildMemberRemove`, `voiceStateUpdate`, and more.

## Discord Bot Setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to Bot section and create a bot
4. Enable these **Privileged Gateway Intents**:
   - Presence Intent
   - Server Members Intent
   - Message Content Intent
5. Copy the token to your `.env` file
6. Invite the bot to your server with appropriate permissions

## License

MIT
