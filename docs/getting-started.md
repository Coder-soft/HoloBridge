# Getting Started

This guide will walk you through installing, configuring, and running HoloBridge.

**Navigation:** [Home](index.md) | Getting Started | [API Reference](api-reference.md) | [WebSocket](websocket.md) | [Plugins](plugins.md) | [Security](security.md) | [Network](network.md)

---

## Prerequisites

- Node.js 18 or higher
- npm or yarn package manager
- A Discord bot token

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/coder-soft/holobridge.git
cd holobridge
```

### 2. Install Dependencies

```bash
npm install
```

## Configuration

### Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```env
# Discord Bot Token (required)
# Get this from https://discord.com/developers/applications
DISCORD_TOKEN=your_discord_bot_token_here

# API Configuration
PORT=3000
HOST=0.0.0.0
API_KEY=your_secure_api_key_here

# Optional: Enable debug logging
DEBUG=false

# Optional: Plugin configuration
PLUGINS_ENABLED=true
PLUGINS_DIR=plugins

# Optional: Rate limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=100
```

### Configuration Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DISCORD_TOKEN` | Yes | - | Your Discord bot token |
| `API_KEY` | Yes | - | API key for authenticating requests |
| `PORT` | No | `3000` | Server port |
| `HOST` | No | `0.0.0.0` | Host to bind to (see [Network Configuration](network.md)) |
| `DEBUG` | No | `false` | Enable debug logging |
| `PLUGINS_ENABLED` | No | `true` | Enable/disable the plugin system |
| `PLUGINS_DIR` | No | `plugins` | Directory for plugins |
| `RATE_LIMIT_ENABLED` | No | `true` | Enable rate limiting |
| `RATE_LIMIT_WINDOW_MS` | No | `60000` | Rate limit window in milliseconds |
| `RATE_LIMIT_MAX` | No | `100` | Max requests per window |

## Running the Server

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm run build
npm start
```

### Using Docker

```bash
docker-compose up -d
```

## Discord Bot Setup

Follow these steps to create a Discord bot and invite it to your server:

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and give it a name
3. Go to the "Bot" section in the left sidebar
4. Click "Add Bot" and confirm
5. Enable the following **Privileged Gateway Intents**:
   - Presence Intent
   - Server Members Intent
   - Message Content Intent
6. Click "Reset Token" to get your bot token and copy it to your `.env` file

### Inviting the Bot

1. Go to the "OAuth2" → "URL Generator" section
2. Select the following scopes:
   - `bot`
   - `applications.commands`
3. Select the permissions your bot needs (Administrator for full access)
4. Copy the generated URL and open it in your browser
5. Select a server and authorize the bot

> ⚠️ **Important:** Keep your bot token and API key secret. Never commit them to version control

## Testing the API

Once the server is running, you can test the API with curl:

```bash
# Health check (no auth required)
curl http://localhost:3000/health

# List all guilds
curl -H "X-API-Key: your_api_key" http://localhost:3000/api/guilds
```

## Server Endpoints

When the server starts, it will display all available endpoints:

```
🌐 API server listening on 0.0.0.0:3000
   Local:      http://localhost:3000/api
   Network:    http://192.168.1.100:3000/api
   API Docs:   http://192.168.1.100:3000/api/docs
   Plugin API: http://192.168.1.100:3000/api/plugins
   WebSocket:  ws://192.168.1.100:3000
   Health:     http://192.168.1.100:3000/health
```

- **Local** - Access from the same machine
- **Network** - Access from other devices on your network (see [Network Configuration](network.md))
- **API Docs** - Interactive Swagger UI documentation
- **Plugin API** - Endpoints registered by plugins
- **WebSocket** - Socket.IO endpoint for real-time events
- **Health** - Health check endpoint for monitoring

## Next Steps

- [API Reference](api-reference.md) - Explore all available REST API endpoints
- [WebSocket Events](websocket.md) - Learn how to receive real-time Discord events
- [Network Configuration](network.md) - Expose the API on your local network
- [Plugins](plugins.md) - Extend HoloBridge with custom functionality
- [Security](security.md) - Configure API scopes and rate limiting
