# Security & API Scopes

HoloBridge provides granular access control through API scopes, allowing you to create API keys with limited permissions.

**Navigation:** [Home](index.md) | [Getting Started](getting-started.md) | [API Reference](api-reference.md) | [WebSocket](websocket.md) | [Plugins](plugins.md) | Security | [Network](network.md)

---

## Table of Contents

- [API Key Configuration](#api-key-configuration)
- [Available Scopes](#available-scopes)
- [Rate Limiting](#rate-limiting)
- [Best Practices](#best-practices)

---

## API Key Configuration

### Single Key (Simple)

For basic setups, use a single API key in `.env`:

```env
API_KEY=your_secure_api_key
```

This key has `admin` scope (full access).

### Multiple Keys with Scopes

For production, define multiple keys with specific permissions using the `API_KEYS` environment variable:

```env
API_KEYS=[
  {"id":"dashboard","name":"Web Dashboard","key":"dash_xxx","scopes":["read:guilds","read:members"]},
  {"id":"bot","name":"Chat Bot","key":"bot_xxx","scopes":["read:messages","write:messages"]},
  {"id":"admin","name":"Admin Panel","key":"admin_xxx","scopes":["admin"]}
]
```

### API Key Schema

Each API key object has the following properties:

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | string | Yes | Unique identifier for the key |
| `name` | string | Yes | Human-readable name |
| `key` | string | Yes | The actual API key value |
| `scopes` | string[] | Yes | Array of permission scopes |
| `createdAt` | date | No | When the key was created |

---

## Available Scopes

| Scope | Permissions |
|-------|-------------|
| `read:guilds` | List guilds, get guild details |
| `read:channels` | List channels, get channel info |
| `read:members` | List members, get member details |
| `read:messages` | Read message history |
| `write:messages` | Send, edit, delete messages |
| `write:members` | Kick, ban, timeout members |
| `write:channels` | Create, edit, delete channels |
| `write:roles` | Create, edit, delete roles |
| `events` | Subscribe to WebSocket events |
| `admin` | Full access (bypasses all checks) |

### Scope Examples

**Read-only dashboard:**
```json
{"id":"dashboard","name":"Dashboard","key":"dash_xxx","scopes":["read:guilds","read:channels","read:members"]}
```

**Message bot:**
```json
{"id":"msgbot","name":"Message Bot","key":"msg_xxx","scopes":["read:messages","write:messages"]}
```

**Moderation bot:**
```json
{"id":"modbot","name":"Mod Bot","key":"mod_xxx","scopes":["read:members","write:members"]}
```

**WebSocket listener:**
```json
{"id":"listener","name":"Event Listener","key":"ws_xxx","scopes":["events","read:guilds"]}
```

---

## Rate Limiting

HoloBridge includes built-in rate limiting to protect against abuse.

### Configuration

```env
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=60000  # 1 minute window
RATE_LIMIT_MAX=100          # 100 requests per window
```

| Variable | Default | Description |
|----------|---------|-------------|
| `RATE_LIMIT_ENABLED` | `true` | Enable/disable rate limiting |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Time window in milliseconds |
| `RATE_LIMIT_MAX` | `100` | Maximum requests per window |

### Response Headers

All API responses include rate limit headers:

| Header | Description |
|--------|-------------|
| `X-RateLimit-Limit` | Maximum requests per window |
| `X-RateLimit-Remaining` | Requests remaining in current window |
| `X-RateLimit-Reset` | Unix timestamp when limit resets |

### Rate Limited Response

When the limit is exceeded, you'll receive a `429 Too Many Requests` response:

```json
{
    "success": false,
    "error": "Too many requests",
    "code": "RATE_LIMITED",
    "retryAfter": 45
}
```

The `retryAfter` field indicates how many seconds to wait before retrying.

---

## Best Practices

### API Key Security

1. **Use scoped keys** — Give each integration only the permissions it needs
2. **Rotate keys regularly** — Update API keys periodically
3. **Keep admin keys secure** — Only use admin scope for trusted applications
4. **Never commit keys** — Add `.env` to `.gitignore`
5. **Use environment variables** — Don't hardcode keys in your application

### Network Security

When exposing the API on your network (see [Network Configuration](network.md)):

1. **Always require authentication** — Never disable the `API_KEY` requirement
2. **Use scoped keys for remote access** — Create specific keys for each client device
3. **Monitor usage** — Watch rate limit headers to identify issues
4. **Use HTTPS in production** — Consider using a reverse proxy with TLS

### Example: Secure Multi-Client Setup

```env
# Main admin key (local use only)
API_KEY=admin_super_secret_key

# Scoped keys for different clients
API_KEYS=[
  {"id":"web-dashboard","name":"Web Dashboard","key":"web_abc123","scopes":["read:guilds","read:channels","read:members","events"]},
  {"id":"mobile-app","name":"Mobile App","key":"mob_def456","scopes":["read:guilds","read:messages"]},
  {"id":"bot-service","name":"Bot Service","key":"bot_ghi789","scopes":["read:messages","write:messages","events"]},
  {"id":"admin-cli","name":"Admin CLI","key":"cli_jkl012","scopes":["admin"]}
]
```

### Monitoring and Auditing

- Log API key usage (which key accessed what endpoint)
- Set up alerts for rate limit violations
- Review and revoke unused keys periodically
- Use unique keys per integration for better tracking

---

## Authentication Errors

### 401 Unauthorized

Missing or invalid API key:

```json
{
    "success": false,
    "error": "API key required",
    "code": "UNAUTHORIZED"
}
```

**Solution:** Include the `X-API-Key` header with a valid key.

### 403 Forbidden

API key lacks required scope:

```json
{
    "success": false,
    "error": "Insufficient permissions",
    "code": "FORBIDDEN"
}
```

**Solution:** Use an API key with the required scope, or add the scope to the existing key.

---

## Next Steps

- [Getting Started](getting-started.md) - Initial setup and configuration
- [API Reference](api-reference.md) - Explore all available REST API endpoints
- [Network Configuration](network.md) - Expose the API on your local network
- [Plugins](plugins.md) - Create plugins with custom endpoints