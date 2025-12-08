# HoloBridge Plugins

Plugins extend HoloBridge functionality without modifying the core codebase.

## Quick Start

Create a `.js` file in this directory:

```javascript
// plugins/my-plugin.js
export default {
    metadata: {
        name: 'my-plugin',
        version: '1.0.0',
        author: 'Your Name',
        description: 'What this plugin does',
    },

    // Register REST API routes (optional)
    routes(router, ctx) {
        router.get('/status', (req, res) => {
            res.json({ status: 'ok' });
        });
    },

    // Subscribe to events (optional)
    events(on, ctx) {
        return [
            on.onDiscord('messageCreate', (msg) => {
                console.log('New message:', msg.content);
            }),
        ];
    },

    onLoad(ctx) {
        ctx.logger.info('Plugin loaded!');
    },
};
```

## Plugin Interface

### Metadata (Required)

```javascript
metadata: {
    name: string,        // Unique plugin identifier
    version: string,     // Semantic version (e.g., "1.0.0")
    author?: string,     // Optional author name
    description?: string // Optional description
}
```

### REST API Endpoints

Plugins can register REST endpoints mounted at `/api/plugins/{plugin-name}/`:

```javascript
routes(router, ctx) {
    // GET /api/plugins/my-plugin/status
    router.get('/status', (req, res) => {
        res.json({ success: true, data: { uptime: process.uptime() } });
    });

    // POST /api/plugins/my-plugin/action
    router.post('/action', (req, res) => {
        const { value } = req.body;
        res.json({ success: true, data: { received: value } });
    });

    // Available methods: get, post, put, patch, delete, use
}
```

Routes automatically:
- Inherit API key authentication from `/api`
- Have error handling wrapped (errors return 500 JSON responses)
- Are scoped to your plugin's namespace

### Event Subscriptions

Subscribe to Discord events and custom inter-plugin events:

```javascript
events(on, ctx) {
    return [
        // Discord events
        on.onDiscord('messageCreate', (msg) => {
            if (msg.content === '!hello') {
                console.log('Got hello from', msg.author.username);
            }
        }),

        // Custom events from other plugins
        on.onCustom('other-plugin:action', (data) => {
            console.log('Received:', data);
        }),

        // Plugin lifecycle events
        on.onPluginLoaded(({ name, version }) => {
            console.log(`${name} v${version} loaded`);
        }),
    ];
}
```

**Emit custom events** for other plugins to consume:

```javascript
// In routes or onLoad
ctx.eventBus.emitCustom('my-plugin:user-action', {
    userId: '123',
    action: 'purchase',
});

// Or using the events helper
on.emit('my-plugin:user-action', { userId: '123' });
```

### Lifecycle Hooks

#### `onLoad(ctx)`

Called when the plugin is loaded at server startup.

```javascript
onLoad(ctx) {
    ctx.logger.info('Hello from my plugin!');
    ctx.logger.info(`Connected to ${ctx.client.guilds.cache.size} guilds`);
    ctx.logger.info(`Other plugins: ${ctx.listPlugins().join(', ')}`);
}
```

#### `onUnload()`

Called when the server is shutting down.

```javascript
onUnload() {
    // Cleanup resources, close connections, etc.
}
```

#### `onEvent(eventName, data)` (Legacy)

> **Deprecated**: Use `events()` hook instead for typed subscriptions.

```javascript
onEvent(eventName, data) {
    if (eventName === 'messageCreate') {
        console.log(`New message: ${data.content}`);
    }
}
```

## Plugin Context

The `ctx` object passed to hooks provides:

| Property | Type | Description |
|----------|------|-------------|
| `client` | `Discord.Client` | Full Discord.js client instance |
| `io` | `Socket.IO Server` | WebSocket server for custom events |
| `config` | `Config` | HoloBridge configuration |
| `app` | `Express` | Express application instance |
| `eventBus` | `PluginEventBus` | Event bus for inter-plugin communication |
| `logger` | `PluginLogger` | Prefixed logger with `info`, `warn`, `error`, `debug` |
| `log` | `(msg) => void` | Simple legacy logger |
| `getPlugin` | `(name) => metadata` | Get another plugin's metadata |
| `listPlugins` | `() => string[]` | List all loaded plugin names |

## Event Types

### Discord Events

All Discord.js events are available with the `discord:` prefix internally:

| Category | Events |
|----------|--------|
| Messages | `messageCreate`, `messageUpdate`, `messageDelete`, `messageReactionAdd`, etc. |
| Members | `guildMemberAdd`, `guildMemberRemove`, `guildMemberUpdate`, `presenceUpdate` |
| Channels | `channelCreate`, `channelUpdate`, `channelDelete`, `threadCreate` |
| Guilds | `guildCreate`, `guildUpdate`, `guildDelete`, `guildBanAdd` |
| Roles | `roleCreate`, `roleUpdate`, `roleDelete` |
| Voice | `voiceStateUpdate` |
| And more... | See [events.types.ts](../src/types/events.types.ts) |

### Plugin Lifecycle Events

| Event | Payload | Description |
|-------|---------|-------------|
| `plugin:loaded` | `{ name, version }` | A plugin was loaded |
| `plugin:unloaded` | `{ name }` | A plugin was unloaded |
| `plugin:error` | `{ name, error }` | A plugin encountered an error |

### Custom Events

Plugins can emit any custom event with `custom:` prefix:

```javascript
ctx.eventBus.emitCustom('my-plugin:something', { key: 'value' });
```

## Examples

### Auto-Responder with API

```javascript
export default {
    metadata: { name: 'auto-responder', version: '1.0.0' },

    triggers: new Map(),

    routes(router) {
        router.get('/triggers', (req, res) => {
            res.json({ success: true, data: Object.fromEntries(this.triggers) });
        });

        router.post('/triggers', (req, res) => {
            const { trigger, response } = req.body;
            this.triggers.set(trigger, response);
            res.json({ success: true });
        });
    },

    events(on, ctx) {
        return [
            on.onDiscord('messageCreate', async (msg) => {
                if (msg.author?.bot) return;
                
                const response = this.triggers.get(msg.content);
                if (response) {
                    const channel = await ctx.client.channels.fetch(msg.channelId);
                    if (channel?.isTextBased()) {
                        await channel.send(response);
                    }
                }
            }),
        ];
    },
};
```

### Event Logger

```javascript
export default {
    metadata: { name: 'event-logger', version: '1.0.0' },

    events(on) {
        const eventTypes = ['messageCreate', 'guildMemberAdd', 'roleCreate'];
        return eventTypes.map(event =>
            on.onDiscord(event, () => {
                console.log(`[${new Date().toISOString()}] ${event}`);
            })
        );
    },
};
```

### Cross-Plugin Communication

```javascript
// Plugin A: Emits events
export default {
    metadata: { name: 'plugin-a', version: '1.0.0' },

    events(on, ctx) {
        return [
            on.onDiscord('guildMemberAdd', (member) => {
                on.emit('member:welcomed', {
                    userId: member.user?.id,
                    guildId: member.guildId,
                });
            }),
        ];
    },
};

// Plugin B: Listens to Plugin A
export default {
    metadata: { name: 'plugin-b', version: '1.0.0' },

    events(on, ctx) {
        return [
            on.onCustom('member:welcomed', (data) => {
                ctx.logger.info(`Member ${data.userId} was welcomed`);
            }),
        ];
    },
};
```

## Best Practices

1. **Use typed events** - Subscribe via `events()` hook for automatic cleanup
2. **Handle errors** - Route handlers are wrapped, but catch errors in event handlers
3. **Clean up** - Use `onUnload` to close connections and clear timers
4. **Be selective** - Filter events early to avoid unnecessary processing
5. **Log sparingly** - Use `ctx.logger.debug()` for verbose logs (only shown in debug mode)
6. **Namespace events** - Prefix custom events with your plugin name

## Disabling Plugins

To disable a plugin, either:
- Delete or rename the file (e.g., `my-plugin.js.disabled`)
- Set `PLUGINS_ENABLED=false` in `.env` to disable all plugins
