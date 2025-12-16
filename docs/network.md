# Network Configuration

HoloBridge can be configured to expose its API on your local network, allowing access from other devices such as phones, tablets, or other computers on the same network.

**Navigation:** [Home](index.md) | [Getting Started](getting-started.md) | [API Reference](api-reference.md) | [WebSocket](websocket.md) | [Plugins](plugins.md) | [Security](security.md) | Network

---

## Overview

By default, HoloBridge binds to `0.0.0.0`, which means it listens on all available network interfaces. This allows the API to be accessed from:

- **localhost** - The machine running HoloBridge
- **Local Network IP** - Other devices on the same network (e.g., `192.168.1.x`)

## Configuration

### HOST Environment Variable

The `HOST` environment variable controls which network interface(s) the server binds to:

```env
# Bind to all interfaces (accessible from network) - DEFAULT
HOST=0.0.0.0

# Bind to localhost only (not accessible from network)
HOST=127.0.0.1

# Bind to a specific IP address
HOST=192.168.1.100
```

| Value | Description | Network Access |
|-------|-------------|----------------|
| `0.0.0.0` | All interfaces (default) | ✅ Yes |
| `127.0.0.1` | Localhost only | ❌ No |
| `localhost` | Localhost only | ❌ No |
| Specific IP | Single interface | ✅ Yes (from that network) |

### PORT Environment Variable

```env
# Default port
PORT=3000

# Custom port
PORT=8080
```

## Server Output

When HoloBridge starts, it displays all available access URLs:

```
🌐 API server listening on 0.0.0.0:3000
   Local:      http://localhost:3000/api
   Network:    http://192.168.1.100:3000/api
   API Docs:   http://192.168.1.100:3000/api/docs
   Plugin API: http://192.168.1.100:3000/api/plugins
   WebSocket:  ws://192.168.1.100:3000
   Health:     http://192.168.1.100:3000/health
```

The **Network** URL shows your local network IP address, which other devices on your network can use to access the API.

## Accessing from Other Devices

### REST API

From another device on your network:

```bash
# Replace with your HoloBridge server's IP
curl -H "X-API-Key: your_api_key" http://192.168.1.100:3000/api/guilds
```

### WebSocket

Connect to the WebSocket from any device:

```javascript
import { io } from 'socket.io-client';

// Use the network IP address
const socket = io('http://192.168.1.100:3000', {
    auth: {
        apiKey: 'your_api_key'
    }
});

socket.on('connect', () => {
    console.log('Connected from remote device!');
});
```

### API Documentation (Swagger UI)

Access the interactive API documentation from any browser on your network:

```
http://192.168.1.100:3000/api/docs
```

## Finding Your Network IP

HoloBridge automatically detects and displays your local network IP. If you need to find it manually:

### Windows

```cmd
ipconfig
```

Look for "IPv4 Address" under your active network adapter.

### macOS / Linux

```bash
# macOS
ipconfig getifaddr en0

# Linux
hostname -I | awk '{print $1}'
```

## Security Considerations

> ⚠️ **Warning:** Exposing the API on your network means any device on that network can potentially access it.

### Best Practices

1. **Always use API key authentication** - Never disable the `API_KEY` requirement
2. **Use scoped API keys** - Create keys with minimal required permissions (see [Security](security.md))
3. **Enable rate limiting** - Protect against abuse with rate limits
4. **Use a firewall** - Restrict access to trusted IP ranges if possible
5. **Don't expose to the internet** - The default configuration is for local network access only

### Restricting Access

To restrict access to localhost only:

```env
HOST=127.0.0.1
```

To use scoped API keys with limited permissions:

```env
API_KEYS=[
  {"id":"mobile","name":"Mobile App","key":"mobile_xxx","scopes":["read:guilds","read:messages"]},
  {"id":"admin","name":"Admin Only","key":"admin_xxx","scopes":["admin"]}
]
```

See the [Security documentation](security.md) for more details on API scopes.

## Docker Configuration

When running in Docker, ensure port mapping is configured:

```yaml
# docker-compose.yml
services:
  holobridge:
    ports:
      - "3000:3000"  # Maps host:container
    environment:
      - HOST=0.0.0.0
      - PORT=3000
```

To restrict to localhost when using Docker:

```yaml
services:
  holobridge:
    ports:
      - "127.0.0.1:3000:3000"  # Only accessible from host machine
```

## Troubleshooting

### Cannot access from other devices

1. **Check firewall settings** - Ensure port 3000 (or your configured port) is allowed
2. **Verify HOST setting** - Must be `0.0.0.0` or a specific network IP
3. **Check network connectivity** - Ensure devices are on the same network
4. **Verify the IP address** - Use the IP shown in the server output

### Connection refused

- The server may not be running
- The port may be blocked by a firewall
- HOST may be set to `127.0.0.1`

### Authentication errors

- Ensure you're including the `X-API-Key` header
- Check that the API key matches your `.env` configuration
- Verify the API key has the required scopes

## Use Cases

### Mobile App Development

Access HoloBridge from your phone while developing a mobile Discord client:

```javascript
// In your React Native / Flutter app
const API_URL = 'http://192.168.1.100:3000/api';

fetch(`${API_URL}/guilds`, {
    headers: { 'X-API-Key': 'your_api_key' }
});
```

### Multi-Device Dashboard

Run a Discord dashboard on multiple screens in your home or office, all connecting to a single HoloBridge instance.

### Development & Testing

Test your Discord integration from different devices without deploying to a server.

## Next Steps

- [Security](security.md) - Configure API scopes and rate limiting
- [Getting Started](getting-started.md) - Initial setup and configuration
- [API Reference](api-reference.md) - Explore all available endpoints
- [WebSocket Events](websocket.md) - Real-time event streaming