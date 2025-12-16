# WebSocket Events

Real-time Discord event streaming via Socket.IO. Subscribe to guilds and receive Discord events as they happen. **45+ event types are supported.**

**Navigation:** [Home](index.md) | [Getting Started](getting-started.md) | [API Reference](api-reference.md) | WebSocket | [Plugins](plugins.md) | [Security](security.md) | [Network](network.md)

---

## Table of Contents

- [Connection](#connection)
- [Authentication](#authentication)
- [Subscribing to Guilds](#subscribing-to-guilds)
- [Event Types](#event-types)
  - [Message Events](#message-events)
  - [Reaction Events](#reaction-events)
  - [Poll Events](#poll-events)
  - [Member Events](#member-events)
  - [Channel Events](#channel-events)
  - [Thread Events](#thread-events)
  - [Role Events](#role-events)
  - [Guild Events](#guild-events)
  - [Emoji Events](#emoji-events)
  - [Sticker Events](#sticker-events)
  - [Voice Events](#voice-events)
  - [Stage Instance Events](#stage-instance-events)
  - [Scheduled Event Events](#scheduled-event-events)
  - [AutoMod Events](#automod-events)
  - [Invite Events](#invite-events)
  - [Interaction Events](#interaction-events)
  - [Entitlement Events](#entitlement-events)
  - [Other Events](#other-events)
- [Error Handling](#error-handling)
- [Complete Example](#complete-example)

---

## Connection

Connect to the WebSocket server using Socket.IO:

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
    auth: {
        apiKey: 'your_api_key'
    }
});

socket.on('connect', () => {
    console.log('Connected to HoloBridge');
});

socket.on('connect_error', (error) => {
    console.error('Connection error:', error.message);
});

socket.on('disconnect', (reason) => {
    console.log('Disconnected:', reason);
});
```

For network access from other devices, use the network IP:

```javascript
const socket = io('http://192.168.1.100:3000', {
    auth: { apiKey: 'your_api_key' }
});
```

See [Network Configuration](network.md) for more details.

---

## Authentication

Authentication is required and must be provided in the `auth` option when connecting:

```javascript
const socket = io('http://localhost:3000', {
    auth: {
        apiKey: 'your_secure_api_key'
    }
});
```

> **Note:** If authentication fails, the connection will be rejected with an error.

---

## Subscribing to Guilds

After connecting, subscribe to specific guilds to receive their events:

```javascript
// Subscribe to guilds
socket.emit('subscribe', {
    guildIds: ['123456789012345678', '987654321098765432']
});

// Listen for subscription confirmation
socket.on('subscribed', (data) => {
    console.log('Subscribed to guilds:', data.guildIds);
});

// Unsubscribe from guilds
socket.emit('unsubscribe', {
    guildIds: ['123456789012345678']
});

socket.on('unsubscribed', (data) => {
    console.log('Unsubscribed from guilds:', data.guildIds);
});
```

### Listening for Events

All Discord events are emitted through the `discord` event:

```javascript
socket.on('discord', (payload) => {
    console.log('Event:', payload.event);
    console.log('Guild:', payload.guildId);
    console.log('Data:', payload.data);
});
```

---

## Event Types

### Message Events

| Event | Description | Data |
|-------|-------------|------|
| `messageCreate` | New message sent | SerializedMessage |
| `messageUpdate` | Message edited | `{ old, new }` |
| `messageDelete` | Message deleted | `{ id, channelId, guildId }` |
| `messageDeleteBulk` | Multiple messages deleted | `{ ids, channelId, guildId }` |

---

### Reaction Events

| Event | Description | Data |
|-------|-------------|------|
| `messageReactionAdd` | Reaction added to message | `{ messageId, channelId, guildId, userId, reaction }` |
| `messageReactionRemove` | Reaction removed from message | `{ messageId, channelId, guildId, userId, emoji }` |
| `messageReactionRemoveAll` | All reactions removed from message | `{ messageId, channelId, guildId }` |
| `messageReactionRemoveEmoji` | All reactions of specific emoji removed | `{ messageId, channelId, guildId, emoji }` |

---

### Poll Events

| Event | Description | Data |
|-------|-------------|------|
| `messagePollVoteAdd` | User voted on a poll | `{ messageId, channelId, guildId, userId, answerId }` |
| `messagePollVoteRemove` | User removed poll vote | `{ messageId, channelId, guildId, userId, answerId }` |

---

### Member Events

| Event | Description | Data |
|-------|-------------|------|
| `guildMemberAdd` | Member joined | SerializedMember |
| `guildMemberRemove` | Member left/kicked | `{ user, guildId }` |
| `guildMemberUpdate` | Member updated | `{ old, new }` |
| `presenceUpdate` | Presence changed | `{ old, new }` |
| `userUpdate` | User globally updated | `{ old, new }` |

---

### Channel Events

| Event | Description | Data |
|-------|-------------|------|
| `channelCreate` | Channel created | SerializedChannel |
| `channelUpdate` | Channel modified | `{ old, new }` |
| `channelDelete` | Channel deleted | SerializedChannel |
| `channelPinsUpdate` | Pins updated in channel | `{ channelId, guildId, lastPinAt }` |
| `webhookUpdate` | Webhooks changed | `{ channelId, guildId }` |

---

### Thread Events

| Event | Description | Data |
|-------|-------------|------|
| `threadCreate` | Thread created | `{ thread, newlyCreated }` |
| `threadUpdate` | Thread modified | `{ old, new }` |
| `threadDelete` | Thread deleted | `{ id, guildId, parentId, name, type }` |
| `threadMembersUpdate` | Thread members changed | `{ threadId, guildId, addedMembers, removedMemberIds, memberCount }` |

---

### Role Events

| Event | Description | Data |
|-------|-------------|------|
| `roleCreate` | Role created | SerializedRole |
| `roleUpdate` | Role modified | `{ old, new }` |
| `roleDelete` | Role deleted | `{ id, guildId }` |

---

### Guild Events

| Event | Description | Data |
|-------|-------------|------|
| `guildCreate` | Bot joined guild | SerializedGuild |
| `guildUpdate` | Guild modified | `{ old, new }` |
| `guildDelete` | Bot left/removed | `{ id, name, unavailable }` |
| `guildBanAdd` | User banned | `{ guildId, user }` |
| `guildBanRemove` | User unbanned | `{ guildId, user }` |
| `guildIntegrationsUpdate` | Integrations updated | `{ guildId }` |
| `guildAuditLogEntryCreate` | Audit log entry created | SerializedAuditLogEntry |

---

### Emoji Events

| Event | Description | Data |
|-------|-------------|------|
| `emojiCreate` | Custom emoji added | SerializedEmoji |
| `emojiUpdate` | Emoji modified | `{ old, new }` |
| `emojiDelete` | Emoji removed | SerializedEmoji |

---

### Sticker Events

| Event | Description | Data |
|-------|-------------|------|
| `stickerCreate` | Custom sticker added | SerializedSticker |
| `stickerUpdate` | Sticker modified | `{ old, new }` |
| `stickerDelete` | Sticker removed | SerializedSticker |

#### Sticker Object

```json
{
    "id": "123456789",
    "name": "cool_sticker",
    "description": "A cool sticker",
    "packId": null,
    "type": 2,
    "format": 1,
    "formatName": "png",
    "available": true,
    "guildId": "111222333",
    "user": { ... },
    "sortValue": null,
    "tags": "cool",
    "url": "https://cdn.discordapp.com/stickers/...",
    "createdAt": "2025-01-01T00:00:00.000Z"
}
```

---

### Voice Events

| Event | Description | Data |
|-------|-------------|------|
| `voiceStateUpdate` | Voice state changed | `{ old, new }` |

---

### Stage Instance Events

| Event | Description | Data |
|-------|-------------|------|
| `stageInstanceCreate` | Stage went live | SerializedStageInstance |
| `stageInstanceUpdate` | Stage settings changed | `{ old, new }` |
| `stageInstanceDelete` | Stage ended | SerializedStageInstance |

#### Stage Instance Object

```json
{
    "id": "123456789",
    "guildId": "111222333",
    "channelId": "444555666",
    "topic": "Community Q&A Session",
    "privacyLevel": 2,
    "privacyLevelName": "guild_only",
    "guildScheduledEventId": null,
    "createdAt": "2025-01-01T12:00:00.000Z"
}
```

---

### Scheduled Event Events

| Event | Description | Data |
|-------|-------------|------|
| `guildScheduledEventCreate` | Scheduled event created | SerializedScheduledEvent |
| `guildScheduledEventUpdate` | Scheduled event updated | `{ old, new }` |
| `guildScheduledEventDelete` | Scheduled event deleted | SerializedScheduledEvent |
| `guildScheduledEventUserAdd` | User RSVPed to event | `{ guildScheduledEventId, userId, guildId }` |
| `guildScheduledEventUserRemove` | User cancelled RSVP | `{ guildScheduledEventId, userId, guildId }` |

#### Scheduled Event Object

```json
{
    "id": "123456789",
    "guildId": "111222333",
    "channelId": "444555666",
    "creatorId": "777888999",
    "creator": { ... },
    "name": "Community Game Night",
    "description": "Join us for fun games!",
    "scheduledStartTime": "2025-01-15T20:00:00.000Z",
    "scheduledEndTime": "2025-01-15T23:00:00.000Z",
    "privacyLevel": 2,
    "status": 1,
    "statusName": "scheduled",
    "entityType": 2,
    "entityTypeName": "voice",
    "entityId": null,
    "entityMetadata": null,
    "userCount": 25,
    "image": "abc123",
    "imageUrl": "https://cdn.discordapp.com/...",
    "createdAt": "2025-01-01T00:00:00.000Z"
}
```

---

### AutoMod Events

| Event | Description | Data |
|-------|-------------|------|
| `autoModerationRuleCreate` | AutoMod rule created | SerializedAutoModRule |
| `autoModerationRuleUpdate` | AutoMod rule updated | `{ old, new }` |
| `autoModerationRuleDelete` | AutoMod rule deleted | SerializedAutoModRule |
| `autoModerationActionExecution` | AutoMod action executed | SerializedAutoModAction |

#### AutoMod Rule Object

```json
{
    "id": "123456789",
    "guildId": "111222333",
    "name": "Block Bad Words",
    "creatorId": "444555666",
    "eventType": 1,
    "triggerType": 1,
    "triggerTypeName": "keyword",
    "triggerMetadata": {
        "keywordFilter": ["badword1", "badword2"],
        "regexPatterns": [],
        "presets": [],
        "allowList": [],
        "mentionTotalLimit": null,
        "mentionRaidProtectionEnabled": false
    },
    "actions": [
        {
            "type": 1,
            "typeName": "block_message",
            "metadata": {
                "customMessage": "This message was blocked by AutoMod."
            }
        }
    ],
    "enabled": true,
    "exemptRoles": ["777888999"],
    "exemptChannels": []
}
```

#### AutoMod Action Execution Object

```json
{
    "ruleId": "123456789",
    "ruleTriggerType": 1,
    "guildId": "111222333",
    "userId": "444555666",
    "channelId": "777888999",
    "messageId": "101010101",
    "alertSystemMessageId": null,
    "content": "The message content that triggered AutoMod",
    "matchedKeyword": "badword1",
    "matchedContent": "badword1",
    "action": {
        "type": 1,
        "typeName": "block_message"
    }
}
```

---

### Invite Events

| Event | Description | Data |
|-------|-------------|------|
| `inviteCreate` | Invite created | SerializedInvite |
| `inviteDelete` | Invite deleted | `{ code, channelId, guildId }` |

#### Invite Object

```json
{
    "code": "abc123",
    "guildId": "111222333",
    "channelId": "444555666",
    "inviter": { ... },
    "targetUser": null,
    "targetType": null,
    "uses": 5,
    "maxUses": 100,
    "maxAge": 86400,
    "temporary": false,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "expiresAt": "2025-01-02T00:00:00.000Z",
    "url": "https://discord.gg/abc123"
}
```

---

### Interaction Events

| Event | Description | Data |
|-------|-------------|------|
| `interactionCreate` | Any interaction (slash command, button, modal, etc.) | SerializedInteraction |

#### Interaction Object

```json
{
    "id": "123456789",
    "type": 2,
    "typeName": "application_command",
    "guildId": "111222333",
    "channelId": "444555666",
    "user": { ... },
    "member": { ... },
    "token": "interaction_token",
    "applicationId": "777888999",
    "commandName": "ping",
    "commandId": "101010101",
    "commandType": 1,
    "customId": null,
    "componentType": null,
    "values": null,
    "targetId": null,
    "locale": "en-US",
    "guildLocale": "en-US",
    "createdAt": "2025-01-01T12:00:00.000Z"
}
```

---

### Entitlement Events

For Discord app monetization (subscriptions, purchases).

| Event | Description | Data |
|-------|-------------|------|
| `entitlementCreate` | User purchased subscription | SerializedEntitlement |
| `entitlementUpdate` | Subscription renewed | SerializedEntitlement |
| `entitlementDelete` | Subscription refunded/removed | SerializedEntitlement |

---

### Other Events

| Event | Description | Data |
|-------|-------------|------|
| `typingStart` | User started typing | `{ channelId, userId, timestamp, member }` |

---

## Error Handling

```javascript
socket.on('error', (error) => {
    console.error('WebSocket error:', error.message);
    if (error.code) {
        console.error('Error code:', error.code);
    }
});
```

---

## Complete Example

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
    auth: { apiKey: 'your_api_key' }
});

socket.on('connect', () => {
    console.log('Connected!');
    socket.emit('subscribe', { guildIds: ['123456789'] });
});

socket.on('subscribed', ({ guildIds }) => {
    console.log('Subscribed to:', guildIds);
});

socket.on('discord', (payload) => {
    switch (payload.event) {
        // Message Events
        case 'messageCreate':
            console.log(`[${payload.data.author.username}]: ${payload.data.content}`);
            break;
        case 'messageReactionAdd':
            console.log(`Reaction added: ${payload.data.reaction.emoji.name}`);
            break;
        
        // Member Events
        case 'guildMemberAdd':
            console.log(`${payload.data.user.username} joined!`);
            break;
        
        // Scheduled Events
        case 'guildScheduledEventCreate':
            console.log(`New event: ${payload.data.name}`);
            break;
        
        // AutoMod Events
        case 'autoModerationActionExecution':
            console.log(`AutoMod blocked: ${payload.data.matchedKeyword}`);
            break;
        
        // Interaction Events
        case 'interactionCreate':
            console.log(`Interaction: ${payload.data.typeName}`);
            break;
        
        default:
            console.log(`Event: ${payload.event}`);
    }
});

socket.on('error', console.error);
socket.on('disconnect', (reason) => console.log('Disconnected:', reason));
```

---

## Next Steps

- [API Reference](api-reference.md) - REST API endpoints
- [Plugins](plugins.md) - Create plugins that listen to events
- [Network Configuration](network.md) - Connect from other devices
- [Security](security.md) - API scopes and authentication