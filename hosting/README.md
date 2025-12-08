# HoloBridge Hosting Service

A multi-tenant hosting platform for HoloBridge instances with Discord OAuth authentication and Docker containerization.

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│  TUI Client │────▶│  Host API   │────▶│   Docker     │
│ (holo-host) │     │   Server    │     │ Containers   │
└─────────────┘     └─────────────┘     └──────────────┘
       │                   │
       │                   │
       ▼                   ▼
┌─────────────┐     ┌─────────────┐
│   Discord   │     │  Supabase   │
│    OAuth    │────▶│  Database   │
└─────────────┘     └─────────────┘
```

## Components

### Server (`hosting/server/`)
API server that manages Docker containers and authenticates requests.

```bash
cd hosting/server
npm install
npm run dev
```

### CLI (`hosting/cli/`)
TUI client for managing HoloBridge instances.

```bash
cd hosting/cli
npm install
npm run dev
```

## Setup

### 1. Supabase Setup

1. Create a Supabase project at https://supabase.com
2. Enable Discord OAuth in Authentication > Providers
3. Run the schema in `hosting/database/schema.sql`
4. Copy your project URL and keys

### 2. Discord OAuth Setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to OAuth2 settings
4. Add redirect URI: `http://localhost:8976/callback`
5. Copy Client ID

### 3. Server Configuration

Create `hosting/server/.env`:

```env
PORT=4000
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_role_key
ENCRYPTION_KEY=your_32_char_encryption_key
```

### 4. CLI Configuration

Update `hosting/cli/src/config.ts`:

```typescript
export const SUPABASE_URL = 'your_supabase_url';
export const SUPABASE_ANON_KEY = 'your_anon_key';
export const DISCORD_CLIENT_ID = 'your_discord_client_id';
```

## Usage

### Start the Server

```bash
cd hosting/server
npm run dev
```

### Launch the TUI

```bash
cd hosting/cli
npm run dev
```

Or after installing globally:

```bash
holo-host
```

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Enter` | Select / Confirm |
| `Escape` | Go back |
| `C` | Create instance |
| `S` | Start instance |
| `T` | Stop instance |
| `P` | Manage plugins |
| `K` | Manage API keys |
| `R` | Refresh |
| `L` | Logout |
| `Q` | Quit |

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Server health check |
| `/api/v1/instances` | GET | List instances |
| `/api/v1/instances` | POST | Create instance |
| `/api/v1/instances/:id` | DELETE | Delete instance |
| `/api/v1/instances/:id/start` | POST | Start instance |
| `/api/v1/instances/:id/stop` | POST | Stop instance |
| `/api/v1/instances/:id/plugins` | GET/POST | Manage plugins |
| `/api/v1/instances/:id/keys` | GET/POST | Manage API keys |

## Security

- Discord tokens encrypted at rest using AES-256-GCM
- Security codes stored in system keychain
- Row-level security in Supabase
- Container isolation with Docker networks
- Audit logging of all actions
