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

    onLoad(ctx) {
        ctx.log('Plugin loaded!');
    },

    onEvent(eventName, data) {
        // React to Discord events
    },
};
```

## Plugin Interface

### Metadata (Required)

```javascript
metadata: {
    name: string,     // Unique plugin identifier
    version: string,  // Semantic version (e.g., "1.0.0")
    author?: string,  // Optional author name
    description?: string, // Optional description
}
```

### Lifecycle Hooks (Optional)

#### `onLoad(ctx)`

Called when the plugin is loaded at server startup.

```javascript
onLoad(ctx) {
    // Initialize your plugin
    ctx.log('Hello from my plugin!');
    
    // Access Discord.js client
    const guildCount = ctx.client.guilds.cache.size;
    ctx.log(`Connected to ${guildCount} guilds`);
}
```

#### `onUnload()`

Called when the server is shutting down.

```javascript
onUnload() {
    // Cleanup resources, close connections, etc.
}
```

#### `onEvent(eventName, data)`

Called for every Discord event that HoloBridge broadcasts.

```javascript
onEvent(eventName, data) {
    if (eventName === 'messageCreate') {
        console.log(`New message: ${data.content}`);
    }
}
```

## Plugin Context

The `ctx` object passed to `onLoad` provides:

| Property | Type | Description |
|----------|------|-------------|
| `client` | `Discord.Client` | Full Discord.js client instance |
| `io` | `Socket.IO Server` | WebSocket server for custom events |
| `config` | `Config` | HoloBridge configuration |
| `log` | `(msg: string) => void` | Prefixed logger |

## Examples

### Auto-Responder

```javascript
export default {
    metadata: { name: 'auto-responder', version: '1.0.0' },

    onLoad(ctx) {
        this.client = ctx.client;
    },

    async onEvent(eventName, data) {
        if (eventName !== 'messageCreate') return;
        if (data.author?.bot) return;

        if (data.content === '!hello') {
            const channel = await this.client.channels.fetch(data.channelId);
            if (channel?.isTextBased()) {
                await channel.send('Hello there!');
            }
        }
    },
};
```

### Event Logger

```javascript
export default {
    metadata: { name: 'event-logger', version: '1.0.0' },

    onEvent(eventName, data) {
        console.log(`[${new Date().toISOString()}] ${eventName}`);
    },
};
```

### Custom WebSocket Events

```javascript
export default {
    metadata: { name: 'custom-events', version: '1.0.0' },

    onLoad(ctx) {
        // Emit custom events to connected clients
        setInterval(() => {
            ctx.io.emit('custom:heartbeat', { time: Date.now() });
        }, 30000);
    },
};
```

## Best Practices

1. **Use async/await** - Keep the event loop responsive
2. **Handle errors** - Wrap logic in try-catch blocks
3. **Clean up** - Use `onUnload` to close connections
4. **Be selective** - Filter events early in `onEvent`
5. **Log sparingly** - Avoid flooding the console

## Disabling Plugins

To disable a plugin, either:
- Delete or rename the file (e.g., `my-plugin.js.disabled`)
- Set `PLUGINS_ENABLED=false` in `.env` to disable all plugins

