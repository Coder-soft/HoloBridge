# Plugin System

Extend HoloBridge with custom functionality using the powerful plugin system. Plugins can add REST API endpoints, listen to Discord events, and communicate with other plugins via a typed event bus.

**Navigation:** [Home](index.md) | [Getting Started](getting-started.md) | [API Reference](api-reference.md) | [WebSocket](websocket.md) | Plugins | [Security](security.md) | [Network](network.md)

---

## Table of Contents

- [Quick Start](#quick-start)
- [Plugin Structure](#plugin-structure)
- [Plugin Context](#plugin-context)
- [REST API Routes](#rest-api-routes)
- [Event Bus](#event-bus)
- [Inter-Plugin Communication](#inter-plugin-communication)
- [Complete Example](#complete-example)
- [Best Practices](#best-practices)

---

> **ℹ️ Note:** Plugins are JavaScript/ESM modules placed in the `plugins/` directory. They are automatically loaded on startup.

---

## Quick Start

Create a file in the `plugins/` directory with a `.js` or `.mjs` extension:

### plugins/my-plugin.js

```javascript
export default {
    metadata: {
        name: 'my-plugin',
        version: '1.0.0',
        author: 'Your Name',
        description: 'A sample HoloBridge plugin'
    },

    // Optional: Register REST endpoints
    routes: (router, ctx) => {
        router.get('/status', (req, res) => {
            res.json({ status: 'ok', plugin: 'my-plugin' });
        });
    },

    // Optional: Subscribe to events
    events: (on, ctx) => [
        on.onDiscord('messageCreate', (msg) => {
            ctx.logger.info('New message:', msg.content);
        }),
    ],

    // Optional: Called when plugin loads
    onLoad: (ctx) => {
        ctx.logger.info('Plugin loaded!');
    },

    // Optional: Called when plugin unloads
    onUnload: () => {
        console.log('Plugin unloaded!');
    }
};
```

---

## Plugin Structure

### Plugin Metadata

Every plugin must export an object with a `metadata` property:

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | string | Yes | Unique plugin identifier (used in routes and logs) |
| `version` | string | Yes | Semantic version (e.g., "1.0.0") |
| `author` | string | No | Plugin author name |
| `description` | string | No | Short description of the plugin |

### Lifecycle Hooks

| Hook | When Called | Use Case |
|------|-------------|----------|
| `onLoad(ctx)` | After plugin is loaded | Initialize state, setup connections |
| `onUnload()` | Before plugin is unloaded | Cleanup resources, close connections |

---

## Plugin Context

The `ctx` object provides access to core HoloBridge services:

```typescript
interface PluginContext {
    client: Client;              // Discord.js client
    io: SocketIOServer;          // Socket.IO server
    config: Config;              // Application configuration
    app: Application;            // Express application
    eventBus: PluginEventBus;    // Event bus for inter-plugin communication
    logger: PluginLogger;        // Logging utility
    log: (message: string) => void;  // Legacy logger
    getPlugin: (name: string) => PluginMetadata | undefined;
    listPlugins: () => string[];
}
```

### Logger

Use the built-in logger for consistent output:

```javascript
ctx.logger.info('Information message');
ctx.logger.warn('Warning message');
ctx.logger.error('Error message');
ctx.logger.debug('Debug message (only in debug mode)');
```

---

## REST API Routes

Plugins can register REST API endpoints that are automatically mounted at `/api/plugins/{plugin-name}/`:

```javascript
routes: (router, ctx) => {
    // GET /api/plugins/my-plugin/status
    router.get('/status', (req, res) => {
        res.json({ status: 'ok' });
    });

    // POST /api/plugins/my-plugin/action
    router.post('/action', (req, res) => {
        const { userId, action } = req.body;
        // Handle the action
        res.json({ success: true });
    });

    // Routes support all HTTP methods
    router.put('/update', handler);
    router.patch('/modify', handler);
    router.delete('/remove', handler);

    // Add middleware
    router.use(myMiddleware);
}
```

> **ℹ️ Automatic Error Handling:** Plugin routes are automatically wrapped with error handling. Errors are caught and returned as JSON responses.

---

## Event Bus

HoloBridge provides a typed event bus for inter-plugin communication with three event categories:

| Category | Prefix | Description |
|----------|--------|-------------|
| 🎮 Discord Events | `discord:` | Events forwarded from the Discord gateway |
| 🔌 Plugin Events | `plugin:` | Lifecycle events like plugin load/unload |
| ✨ Custom Events | `custom:` | Events emitted by plugins for inter-plugin communication |

### Subscribing to Events

Use the `events` hook to subscribe to events. Return an array of subscriptions for automatic cleanup:

```javascript
events: (on, ctx) => [
    // Subscribe to Discord events
    on.onDiscord('messageCreate', (message) => {
        ctx.logger.info('New message:', message.content);
    }),

    on.onDiscord('guildMemberAdd', (member) => {
        ctx.logger.info('New member joined:', member.user.username);
    }),

    // Subscribe to custom events from other plugins
    on.onCustom('moderation:user-warned', (data) => {
        ctx.logger.info(`User ${data.userId} was warned`);
    }),

    // Subscribe to plugin lifecycle events
    on.onPluginLoaded((data) => {
        ctx.logger.info(`Plugin loaded: ${data.name} v${data.version}`);
    }),

    on.onPluginUnloaded((data) => {
        ctx.logger.info(`Plugin unloaded: ${data.name}`);
    }),
]
```

### Emitting Custom Events

Plugins can emit custom events for other plugins to consume:

```javascript
events: (on, ctx) => {
    // Emit a custom event
    on.emit('my-plugin:action-performed', {
        userId: '123456789',
        action: 'ban',
        reason: 'Spam'
    });

    return [];
}
```

### Available Discord Events

All standard Discord.js events are available. Common events include:

| Event | Data | Description |
|-------|------|-------------|
| `messageCreate` | Serialized Message | New message sent |
| `messageUpdate` | Serialized Message | Message edited |
| `messageDelete` | Message info | Message deleted |
| `guildMemberAdd` | Serialized Member | Member joined |
| `guildMemberRemove` | Serialized Member | Member left/kicked |
| `guildMemberUpdate` | Serialized Member | Member updated |
| `channelCreate` | Serialized Channel | Channel created |
| `channelUpdate` | Serialized Channel | Channel updated |
| `channelDelete` | Channel info | Channel deleted |
| `roleCreate` | Serialized Role | Role created |
| `roleUpdate` | Serialized Role | Role updated |
| `roleDelete` | Role info | Role deleted |
| `voiceStateUpdate` | Voice state data | Voice state changed |
| `guildBanAdd` | Ban info | Member banned |
| `guildBanRemove` | Ban info | Member unbanned |
| `threadCreate` | Serialized Thread | Thread created |
| `threadUpdate` | Serialized Thread | Thread updated |
| `threadDelete` | Thread info | Thread deleted |

See [WebSocket Events](websocket.md) for the complete list.

### Plugin Lifecycle Events

| Event | Data | Description |
|-------|------|-------------|
| `plugin:loaded` | `{ name, version }` | A plugin was loaded |
| `plugin:unloaded` | `{ name }` | A plugin was unloaded |
| `plugin:error` | `{ name, error }` | A plugin encountered an error |

---

## Direct Event Bus Access

For advanced use cases, access the event bus directly via `ctx.eventBus`:

```javascript
onLoad: (ctx) => {
    const { eventBus } = ctx;

    // Subscribe to any event
    const subscription = eventBus.subscribe('custom:my-event', (data) => {
        console.log('Received:', data);
    });

    // Subscribe once
    eventBus.subscribeOnce('discord:ready', () => {
        console.log('Bot is ready!');
    });

    // Emit Discord events (typically done by core)
    eventBus.emitDiscord('messageCreate', messageData);

    // Emit custom events
    eventBus.emitCustom('my-plugin:action', { key: 'value' });

    // Emit plugin lifecycle events
    eventBus.emitPlugin('plugin:error', { name: 'my-plugin', error: new Error('Oops') });

    // Get listener counts (for debugging)
    console.log(eventBus.getListenerCounts());
}
```

### Event Bus Methods

| Method | Description |
|--------|-------------|
| `onDiscord(event, handler)` | Subscribe to a Discord event |
| `onCustom(event, handler)` | Subscribe to a custom event |
| `onPlugin(event, handler)` | Subscribe to a plugin lifecycle event |
| `emitDiscord(event, data)` | Emit a Discord event |
| `emitCustom(event, data)` | Emit a custom event |
| `emitPlugin(event, data)` | Emit a plugin lifecycle event |
| `subscribe(event, handler)` | Subscribe to any event (returns subscription object) |
| `subscribeOnce(event, handler)` | Subscribe once and automatically unsubscribe |
| `unsubscribeAll(subscriptions)` | Unsubscribe from multiple events at once |

---

## Inter-Plugin Communication

Plugins can discover and interact with other loaded plugins:

```javascript
onLoad: (ctx) => {
    // List all loaded plugins
    const plugins = ctx.listPlugins();
    ctx.logger.info('Loaded plugins:', plugins);

    // Get another plugin's metadata
    const modPlugin = ctx.getPlugin('moderation');
    if (modPlugin) {
        ctx.logger.info(`Moderation plugin v${modPlugin.version} is loaded`);
    }
}
```

### Example: Plugin Communication Pattern

```javascript
// Plugin A: moderation.js
export default {
    metadata: { name: 'moderation', version: '1.0.0' },
    
    routes: (router, ctx) => {
        router.post('/warn', (req, res) => {
            const { userId, reason } = req.body;
            
            // Emit event for other plugins
            ctx.eventBus.emitCustom('moderation:user-warned', {
                userId,
                reason,
                timestamp: Date.now()
            });
            
            res.json({ success: true });
        });
    }
};

// Plugin B: logging.js
export default {
    metadata: { name: 'logging', version: '1.0.0' },
    
    events: (on, ctx) => [
        // Listen for moderation events
        on.onCustom('moderation:user-warned', (data) => {
            ctx.logger.info(`[AUDIT] User ${data.userId} warned: ${data.reason}`);
            // Log to database, send to webhook, etc.
        }),
    ]
};
```

---

## Complete Example

Here's a complete example of a plugin that demonstrates all features:

```javascript
// plugins/welcome.js
export default {
    metadata: {
        name: 'welcome',
        version: '1.0.0',
        author: 'HoloBridge',
        description: 'Welcome new members with customizable messages'
    },

    // Configuration stored in memory (use a database in production)
    _config: {
        enabled: true,
        channelId: null,
        message: 'Welcome to the server, {user}!'
    },

    routes: (router, ctx) => {
        // GET /api/plugins/welcome/config
        router.get('/config', (req, res) => {
            res.json({
                success: true,
                data: this._config
            });
        });

        // PATCH /api/plugins/welcome/config
        router.patch('/config', (req, res) => {
            const { enabled, channelId, message } = req.body;
            
            if (enabled !== undefined) this._config.enabled = enabled;
            if (channelId !== undefined) this._config.channelId = channelId;
            if (message !== undefined) this._config.message = message;

            res.json({ success: true, data: this._config });
        });
    },

    events: (on, ctx) => [
        on.onDiscord('guildMemberAdd', async (member) => {
            if (!this._config.enabled || !this._config.channelId) return;

            try {
                const channel = await ctx.client.channels.fetch(this._config.channelId);
                if (channel?.isTextBased()) {
                    const message = this._config.message
                        .replace('{user}', `<@${member.user.id}>`)
                        .replace('{username}', member.user.username)
                        .replace('{server}', member.guild.name);
                    
                    await channel.send(message);
                    ctx.logger.info(`Welcomed ${member.user.username}`);
                }
            } catch (error) {
                ctx.logger.error('Failed to send welcome message:', error);
            }
        }),
    ],

    onLoad: (ctx) => {
        ctx.logger.info('Welcome plugin loaded!');
        ctx.logger.info(`Routes available at /api/plugins/welcome/`);
    },

    onUnload: () => {
        console.log('[welcome] Plugin unloaded');
    }
};
```

---

## Best Practices

### ✅ Do:

- Return event subscriptions from the `events` hook for automatic cleanup
- Use `ctx.logger` for consistent, prefixed logging
- Handle errors gracefully in event handlers
- Use semantic versioning for your plugin version
- Namespace custom events with your plugin name (e.g., `my-plugin:event-name`)

### ⚠️ Avoid:

- Blocking the event loop with synchronous operations
- Storing sensitive data in plugin state without encryption
- Using the deprecated `onEvent` hook (use `events` instead)
- Creating memory leaks by not cleaning up resources in `onUnload`

---

## Next Steps

- [API Reference](api-reference.md) - Explore the REST API that plugins can extend
- [WebSocket Events](websocket.md) - See all available Discord events you can subscribe to
- [Security](security.md) - Configure API scopes for plugin endpoints
- [Network Configuration](network.md) - Access plugin APIs from other devices