# API Reference

Complete REST API documentation for HoloBridge. All endpoints require authentication via the `X-API-Key` header.

**Navigation:** [Home](index.md) | [Getting Started](getting-started.md) | API Reference | [WebSocket](websocket.md) | [Plugins](plugins.md) | [Security](security.md) | [Network](network.md)

---

## Table of Contents

- [Authentication](#authentication)
- [Guilds](#guilds)
- [Channels](#channels)
- [Messages](#messages)
- [Members](#members)
- [Roles](#roles)
- [Stickers](#stickers)
- [Scheduled Events](#scheduled-events)
- [AutoMod](#automod)
- [Other Resources](#other-resources)
- [Application Commands](#application-commands)

---

## Authentication

All API requests require the `X-API-Key` header with your configured API key.

```bash
curl -H "X-API-Key: your_api_key" http://localhost:3000/api/guilds
```

### Response Format

All responses follow a consistent format:

```json
// Success
{
    "success": true,
    "data": { ... }
}

// Error
{
    "success": false,
    "error": "Error message",
    "code": "ERROR_CODE"
}
```

### Error Codes

| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | Missing or invalid API key |
| `FORBIDDEN` | API key lacks required scope |
| `NOT_FOUND` | Resource not found |
| `VALIDATION_ERROR` | Invalid request body |
| `RATE_LIMITED` | Too many requests |
| `DISCORD_ERROR` | Discord API error |

---

## Guilds

### GET `/api/guilds`

List all guilds the bot is in.

```bash
curl -H "X-API-Key: your_key" http://localhost:3000/api/guilds
```

### GET `/api/guilds/:guildId`

Get details of a specific guild.

```bash
curl -H "X-API-Key: your_key" http://localhost:3000/api/guilds/123456789
```

### GET `/api/guilds/:guildId/channels`

Get all channels in a guild.

### GET `/api/guilds/:guildId/roles`

Get all roles in a guild.

### GET `/api/guilds/:guildId/emojis`

Get all emojis in a guild.

### GET `/api/guilds/:guildId/bans`

Get all bans in a guild.

### GET `/api/guilds/:guildId/invites`

Get all invites in a guild.

---

## Channels

### GET `/api/channels/:channelId`

Get a channel by ID.

### POST `/api/guilds/:guildId/channels`

Create a new channel in a guild.

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Channel name (1-100 chars) |
| `type` | string | Yes | text, voice, category, announcement, stage, forum |
| `topic` | string | No | Channel topic (max 1024 chars) |
| `parentId` | string | No | Category ID |
| `position` | number | No | Channel position |
| `nsfw` | boolean | No | NSFW flag |
| `rateLimitPerUser` | number | No | Slowmode (0-21600 seconds) |
| `bitrate` | number | No | Voice channel bitrate |
| `userLimit` | number | No | Voice channel user limit (0-99) |

### PATCH `/api/channels/:channelId`

Edit a channel. All fields are optional.

### DELETE `/api/channels/:channelId`

Delete a channel.

### POST `/api/channels/:channelId/clone`

Clone a channel. Optionally provide a `name` in the request body.

### GET `/api/channels/:channelId/webhooks`

Get all webhooks for a channel.

### Threads

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/channels/:channelId/threads` | Create a thread |
| GET | `/api/channels/:channelId/threads` | Get all threads |
| POST | `/api/channels/:channelId/archive` | Archive a thread |
| DELETE | `/api/channels/:channelId/archive` | Unarchive a thread |
| POST | `/api/channels/:channelId/lock` | Lock a thread |
| DELETE | `/api/channels/:channelId/lock` | Unlock a thread |

---

## Messages

### GET `/api/channels/:channelId/messages`

Get messages from a channel.

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | number | Number of messages (1-100, default: 50) |
| `before` | string | Get messages before this ID |
| `after` | string | Get messages after this ID |
| `around` | string | Get messages around this ID |

### GET `/api/channels/:channelId/messages/pinned`

Get pinned messages in a channel.

### GET `/api/channels/:channelId/messages/:messageId`

Get a specific message by ID.

### POST `/api/channels/:channelId/messages`

Send a message to a channel.

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `content` | string | No* | Message content (max 2000 chars) |
| `embeds` | array | No* | Array of embed objects |
| `replyTo` | string | No | Message ID to reply to |
| `tts` | boolean | No | Text-to-speech |

> *Either content or at least one embed is required.

### PATCH `/api/channels/:channelId/messages/:messageId`

Edit a message.

### DELETE `/api/channels/:channelId/messages/:messageId`

Delete a message.

### POST `/api/channels/:channelId/messages/bulk-delete`

Bulk delete messages. Send `messageIds` array in body.

### POST `/api/channels/:channelId/messages/:messageId/crosspost`

Crosspost a message (for announcement channels).

### Reactions

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/channels/:channelId/messages/:messageId/reactions/:emoji` | Add reaction |
| DELETE | `/api/channels/:channelId/messages/:messageId/reactions/:emoji` | Remove reaction |
| DELETE | `/api/channels/:channelId/messages/:messageId/reactions` | Remove all reactions |
| GET | `/api/channels/:channelId/messages/:messageId/reactions/:emoji/users` | Get reaction users |

### Pins

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/channels/:channelId/messages/:messageId/pin` | Pin a message |
| DELETE | `/api/channels/:channelId/messages/:messageId/pin` | Unpin a message |

---

## Members

### GET `/api/guilds/:guildId/members`

List all members in a guild.

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | number | Max members to return (default: 1000) |

### GET `/api/guilds/:guildId/members/search`

Search members by username/nickname.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `q` | string | Yes | Search query |
| `limit` | number | No | Max results (default: 20) |

### GET `/api/guilds/:guildId/members/:userId`

Get a specific member.

### Moderation

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/guilds/:guildId/members/:userId/kick` | Kick member |
| POST | `/api/guilds/:guildId/members/:userId/ban` | Ban member |
| DELETE | `/api/guilds/:guildId/bans/:userId` | Unban user |
| POST | `/api/guilds/:guildId/members/:userId/timeout` | Timeout member |
| DELETE | `/api/guilds/:guildId/members/:userId/timeout` | Remove timeout |

#### Ban Request Body

| Field | Type | Description |
|-------|------|-------------|
| `reason` | string | Ban reason (max 512 chars) |
| `deleteMessageSeconds` | number | Seconds of messages to delete (0-604800) |

#### Timeout Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `duration` | number | Yes | Duration in milliseconds |
| `reason` | string | No | Timeout reason |

### Member Roles

| Method | Endpoint | Description |
|--------|----------|-------------|
| PATCH | `/api/guilds/:guildId/members/:userId/nickname` | Set nickname |
| PATCH | `/api/guilds/:guildId/members/:userId/roles` | Modify roles |

#### Modify Roles Request Body

| Field | Type | Description |
|-------|------|-------------|
| `add` | string[] | Role IDs to add |
| `remove` | string[] | Role IDs to remove |

---

## Roles

### GET `/api/guilds/:guildId/roles`

Get all roles in a guild.

### GET `/api/guilds/:guildId/roles/search?name=RoleName`

Search for a role by name.

### GET `/api/guilds/:guildId/roles/:roleId`

Get a specific role.

### POST `/api/guilds/:guildId/roles`

Create a new role.

#### Request Body

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Role name (max 100 chars) |
| `color` | number | Color integer (0-16777215) |
| `hoist` | boolean | Display separately |
| `mentionable` | boolean | Allow mentions |
| `permissions` | string | Permission bitfield |

### PATCH `/api/guilds/:guildId/roles/:roleId`

Edit a role. Same fields as create, plus `position`.

### DELETE `/api/guilds/:guildId/roles/:roleId`

Delete a role.

### GET `/api/guilds/:guildId/roles/:roleId/members`

Get all member IDs with a specific role.

### PATCH `/api/guilds/:guildId/roles/:roleId/permissions`

Set role permissions. Send `permissions` (bitfield string) in body.

---

## Stickers

### GET `/api/guilds/:guildId/stickers`

List all stickers in a guild.

### GET `/api/guilds/:guildId/stickers/:stickerId`

Get a specific sticker.

### POST `/api/guilds/:guildId/stickers`

Create a new sticker.

### PATCH `/api/guilds/:guildId/stickers/:stickerId`

Edit a sticker.

### DELETE `/api/guilds/:guildId/stickers/:stickerId`

Delete a sticker.

---

## Scheduled Events

### GET `/api/guilds/:guildId/scheduled-events`

List all scheduled events.

### GET `/api/guilds/:guildId/scheduled-events/:eventId`

Get a specific event.

### POST `/api/guilds/:guildId/scheduled-events`

Create a new event.

### PATCH `/api/guilds/:guildId/scheduled-events/:eventId`

Edit an event.

### DELETE `/api/guilds/:guildId/scheduled-events/:eventId`

Delete an event.

---

## AutoMod

### GET `/api/guilds/:guildId/auto-moderation/rules`

List all auto-moderation rules.

### GET `/api/guilds/:guildId/auto-moderation/rules/:ruleId`

Get a specific rule.

### POST `/api/guilds/:guildId/auto-moderation/rules`

Create a new rule.

### PATCH `/api/guilds/:guildId/auto-moderation/rules/:ruleId`

Edit a rule.

### DELETE `/api/guilds/:guildId/auto-moderation/rules/:ruleId`

Delete a rule.

---

## Other Resources

### Stage Instances

Endpoints: `/api/stage-instances` (GET, POST, PATCH, DELETE)

### Invites

Endpoints: `/api/invites/:code` (GET, DELETE)

### Webhooks

Endpoints: `/api/webhooks/:webhookId` (GET, PATCH, DELETE)

### Emojis

Endpoints: `/api/guilds/:guildId/emojis` (GET, POST, PATCH, DELETE)

---

## Application Commands

Manage Discord Application Commands (Slash Commands) for your bot. Commands can be global (available in all guilds) or guild-specific.

### Global Commands

#### GET `/api/commands`

List all global application commands.

```bash
curl -H "X-API-Key: your_key" http://localhost:3000/api/commands
```

#### GET `/api/commands/:commandId`

Get a specific global command by ID.

#### POST `/api/commands`

Create a new global application command.

##### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Command name (1-32 chars, lowercase) |
| `description` | string | Yes | Command description (1-100 chars) |
| `type` | number | No | 1=CHAT_INPUT (default), 2=USER, 3=MESSAGE |
| `options` | array | No | Command options (max 25) |
| `default_member_permissions` | string | No | Permission bitfield |
| `dm_permission` | boolean | No | Allow in DMs |
| `nsfw` | boolean | No | Age-restricted command |

##### Example

```bash
curl -X POST -H "X-API-Key: your_key" -H "Content-Type: application/json" \
  -d '{"name": "hello", "description": "Says hello"}' \
  http://localhost:3000/api/commands
```

#### PATCH `/api/commands/:commandId`

Edit a global application command. All fields optional.

#### DELETE `/api/commands/:commandId`

Delete a global application command.

### Guild-Specific Commands

Guild commands are only available in the specified guild. They update instantly (unlike global commands which can take up to an hour).

#### GET `/api/guilds/:guildId/commands`

List all commands for a specific guild.

#### GET `/api/guilds/:guildId/commands/:commandId`

Get a specific guild command.

#### POST `/api/guilds/:guildId/commands`

Create a guild-specific command. Same request body as global commands.

#### PATCH `/api/guilds/:guildId/commands/:commandId`

Edit a guild-specific command.

#### DELETE `/api/guilds/:guildId/commands/:commandId`

Delete a guild-specific command.

---

## Next Steps

- [WebSocket Events](websocket.md) - Real-time Discord event streaming
- [Plugins](plugins.md) - Extend HoloBridge with custom endpoints
- [Security](security.md) - API scopes and rate limiting
- [Network Configuration](network.md) - Access the API from other devices