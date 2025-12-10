# HoloBridge

A type-safe TypeScript bridge between websites and Discord bots. Provides a REST API, WebSocket interface, and plugin system for full Discord bot capabilities.

## Features

- **REST API** for all Discord operations
- **WebSocket** real-time event streaming
- **Plugin System** for extensibility
- **Granular API Scopes** for secure access control
- **Rate Limiting** for API protection
- **CLI Tool** for easy management
- **Docker Ready** for easy deployment
- **Type-safe** with Zod validation

## Quick Start

### Option 1: Using the CLI

```bash
# Install globally
npm install -g holobridge

# Initialize configuration
holo init

# Check your setup
holo doctor

# Start the server
holo start
```

### Option 2: Manual Setup

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Edit .env with your Discord token and API key

# Build and run
npm run build
npm start
```

### Option 3: Docker

```bash
# Using Docker Compose
docker-compose up -d

# Or build manually
docker build -t holobridge .
docker run -p 3000:3000 --env-file .env holobridge
```

## Configuration

Copy `.env.example` to `.env` and configure:

```env
# Required
DISCORD_TOKEN=your_discord_bot_token
API_KEY=your_secure_api_key

# Optional
PORT=3000
DEBUG=false
PLUGINS_ENABLED=true
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MAX=100
```

### Multiple API Keys with Scopes

For granular access control, use the `API_KEYS` environment variable:

```env
API_KEYS=[{"id":"readonly","name":"Dashboard","key":"dash_xxx","scopes":["read:guilds","read:messages"]}]
```

**Available Scopes:**
- `read:guilds`, `read:channels`, `read:members`, `read:messages`
- `write:messages`, `write:members`, `write:channels`, `write:roles`
- `events` (WebSocket access)
- `admin` (full access)

## Plugin System

Extend HoloBridge with custom plugins. Create `.js` files in the `plugins/` directory:

```javascript
export default {
    metadata: {
        name: 'my-plugin',
        version: '1.0.0',
    },

    onLoad(ctx) {
        ctx.log('Plugin loaded!');
        // ctx.client - Discord.js Client
        // ctx.io - Socket.IO Server
    },

    onEvent(eventName, data) {
        if (eventName === 'messageCreate') {
            // React to messages
        }
    },
};
```

See [plugins/README.md](plugins/README.md) for full documentation.

## CLI Commands

```bash
holo start          # Start the server
holo start --watch  # Development mode with hot reload
holo doctor         # Check configuration and environment
holo init           # Interactive setup wizard
```

## API Reference

### Authentication

All API requests require the `X-API-Key` header:

```bash
curl -H "X-API-Key: your_key" http://localhost:3000/api/guilds
```

### Rate Limiting

Responses include rate limit headers:
- `X-RateLimit-Limit` - Max requests per window
- `X-RateLimit-Remaining` - Requests remaining
- `X-RateLimit-Reset` - Unix timestamp when limit resets

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
| `GET` | `/api/commands` | List global commands |
| `POST` | `/api/commands` | Create global command |
| `PATCH` | `/api/commands/:commandId` | Edit global command |
| `DELETE` | `/api/commands/:commandId` | Delete global command |
| `GET` | `/api/guilds/:id/commands` | List guild commands |
| `POST` | `/api/guilds/:id/commands` | Create guild command |
| `GET` | `/health` | Health check (no auth) |

### WebSocket Events

Connect using Socket.IO:

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: { apiKey: 'your_key' }
});

socket.emit('subscribe', { guildIds: ['123456789'] });

socket.on('discord', (event) => {
  console.log(event.event, event.data);
});
```

**Supported Events (45+):** Messages, Reactions, Members, Channels, Threads, Roles, Guilds, Emojis, Voice, Scheduled Events, AutoMod, Invites, Interactions, and more.

## Discord Bot Setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application and bot
3. Enable **ALL Privileged Gateway Intents**:
   - Presence Intent
   - Server Members Intent
   - Message Content Intent
4. Copy the token to your `.env` file
5. Invite the bot with `Administrator` permissions

## Project Structure

```
holobridge/
├── bin/holo.js          # CLI tool
├── plugins/             # Plugin directory
├── src/
│   ├── api/             # REST API routes & middleware
│   ├── discord/         # Discord client & events
│   ├── plugins/         # Plugin manager
│   └── types/           # TypeScript types
├── Dockerfile           # Docker build
└── docker-compose.yml   # Docker Compose config
```

## Resources

- [Use Cases](USE_CASES.md) - Creative ways to use HoloBridge
- [Plugin Guide](plugins/README.md) - How to build plugins
- [Documentation](https://holodocs.pages.dev/) - Full API docs

## License

MIT

