# HoloBridge Documentation

A type-safe TypeScript bridge between websites and Discord bots. Provides a REST API and WebSocket interface for full Discord bot capabilities.

## Quick Start

- [Getting Started](getting-started.md) - Installation, configuration, and running the server
- [API Reference](api-reference.md) - Complete REST API endpoint documentation
- [WebSocket Events](websocket.md) - Real-time event streaming documentation
- [Plugins](plugins.md) - Create plugins with event handling and REST endpoints
- [Security](security.md) - API scopes, rate limiting, and security features
- [Network Configuration](network.md) - Expose your API on the local network

## Features

### 🌐 REST API

Full REST API for all Discord operations including guilds, channels, messages, members, and roles.

### ⚡ WebSocket Events

Real-time event streaming via Socket.IO. Subscribe to guilds and receive Discord events instantly.

### 🔒 Type-Safe

Built with TypeScript and Zod validation. Every request and response is fully typed.

### 📦 Full Coverage

Guilds, Channels, Roles, Members, Bans, Timeouts, Messages, Reactions, Pins, and more.

### 🔌 Plugin System

Extend functionality with plugins. Add routes, listen to events, and communicate between plugins.

### 🌍 Network Exposed API

Bind to `0.0.0.0` to expose the API on your local network for access from other devices.

## Discord Operations

- **Guilds** - List guilds, get details, channels, roles, emojis, bans, invites
- **Channels** - Create, edit, delete channels and threads
- **Messages** - Send, edit, delete, bulk delete, reactions, pins
- **Members** - List, search, kick, ban, timeout, role management
- **Roles** - Create, edit, delete, permissions management

## Real-Time Events

- **Message Events** - messageCreate, messageUpdate, messageDelete
- **Member Events** - guildMemberAdd, guildMemberRemove, guildMemberUpdate
- **Channel Events** - channelCreate, channelUpdate, channelDelete
- **Role Events** - roleCreate, roleUpdate, roleDelete
- **Voice Events** - voiceStateUpdate
- **Guild Events** - guildBanAdd, guildBanRemove
- **And 40+ more** - See the [WebSocket documentation](websocket.md) for the full list

## API Endpoints Overview

| Resource | Endpoints |
|----------|-----------|
| Guilds | `/api/guilds` |
| Channels | `/api/channels`, `/api/guilds/:guildId/channels` |
| Messages | `/api/channels/:channelId/messages` |
| Members | `/api/guilds/:guildId/members` |
| Roles | `/api/guilds/:guildId/roles` |
| Emojis | `/api/guilds/:guildId/emojis` |
| Stickers | `/api/guilds/:guildId/stickers` |
| Scheduled Events | `/api/guilds/:guildId/scheduled-events` |
| AutoMod | `/api/guilds/:guildId/auto-moderation` |
| Commands | `/api/commands`, `/api/guilds/:guildId/commands` |
| Webhooks | `/api/webhooks` |
| Invites | `/api/invites` |
| Stage Instances | `/api/stage-instances` |
| Voice | `/api/guilds/:guildId/voice` |
| Plugins | `/api/plugins` |

## License

HoloBridge © 2025 - MIT License