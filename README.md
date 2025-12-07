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
| `GET` | `/api/guilds/:id/stickers` | List stickers |
| `GET` | `/api/guilds/:id/scheduled-events` | List scheduled events |
| `GET` | `/api/guilds/:id/auto-moderation/rules` | List AutoMod rules |
| `GET` | `/api/guilds/:id/emojis` | List emojis |
| `GET` | `/api/invites/:code` | Get invite info |
| `GET` | `/api/webhooks/:id` | Get webhook info |
| `GET` | `/api/stage-instances/:channelId` | Get stage instance |

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

**Supported Events (45+):**

- **Messages:** `messageCreate`, `messageUpdate`, `messageDelete`, `messageDeleteBulk`
- **Reactions:** `messageReactionAdd`, `messageReactionRemove`, `messageReactionRemoveAll`, `messageReactionRemoveEmoji`
- **Polls:** `messagePollVoteAdd`, `messagePollVoteRemove`
- **Members:** `guildMemberAdd`, `guildMemberRemove`, `guildMemberUpdate`, `presenceUpdate`, `userUpdate`
- **Channels:** `channelCreate`, `channelUpdate`, `channelDelete`, `channelPinsUpdate`, `webhookUpdate`
- **Threads:** `threadCreate`, `threadUpdate`, `threadDelete`, `threadMembersUpdate`
- **Roles:** `roleCreate`, `roleUpdate`, `roleDelete`
- **Guilds:** `guildCreate`, `guildUpdate`, `guildDelete`, `guildBanAdd`, `guildBanRemove`, `guildIntegrationsUpdate`, `guildAuditLogEntryCreate`
- **Emojis & Stickers:** `emojiCreate`, `emojiUpdate`, `emojiDelete`, `stickerCreate`, `stickerUpdate`, `stickerDelete`
- **Voice:** `voiceStateUpdate`
- **Scheduled Events:** `guildScheduledEventCreate`, `guildScheduledEventUpdate`, `guildScheduledEventDelete`, `guildScheduledEventUserAdd`, `guildScheduledEventUserRemove`
- **AutoMod:** `autoModerationRuleCreate`, `autoModerationRuleUpdate`, `autoModerationRuleDelete`, `autoModerationActionExecution`
- **Invites:** `inviteCreate`, `inviteDelete`
- **Interactions:** `interactionCreate` (Slash commands, buttons, modals)
- **Entitlements:** `entitlementCreate`, `entitlementUpdate`, `entitlementDelete`
- **Other:** `typingStart`, `stageInstanceCreate`, `stageInstanceUpdate`, `stageInstanceDelete`

## Discord Bot Setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to Bot section and create a bot
4. Enable **ALL Privileged Gateway Intents** to support all features:
   - Presence Intent
   - Server Members Intent
   - Message Content Intent
5. The bot also requires standard intents (enabled by default in code):
   - Guilds, Moderation, Emojis, Integrations, Webhooks, Invites, Voice States
   - Message Reactions, Typing
   - Scheduled Events, AutoMod
   - Message Polls
6. Copy the token to your `.env` file
7. Invite the bot to your server with `Administrator` permissions for full functionality

## Documentation

Visit the [documentation](https://holodocs.pages.dev/) for more details.

## License

MIT
