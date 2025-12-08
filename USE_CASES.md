# 🌉 HoloBridge Use Cases

HoloBridge decouples your Discord bot's logic from its connection. By exposing a **REST API** for actions and a **WebSocket** for events, it opens up a world of possibilities that standard Discord libraries can't easily handle.

Here is a collection of use cases ranging from practical enterprise solutions to fun weekend experiments.

---

## 🏢 The "Standard" Integrations
*Practical solutions for common development problems.*

### 1. The Web Dashboard
**Scenario:** You want a Next.js or React dashboard where admins can manage their server.
*   **The Problem:** Connecting a web frontend directly to Discord is insecure (exposing tokens) or requires a complex backend just to proxy requests.
*   **The Fix:** Your frontend calls HoloBridge's REST API to fetch roles, kick members, or update settings.
*   **Flow:** `Admin clicks "Ban" on Website` → `POST /api/guilds/:id/members/:id/ban` → `HoloBridge` → `Discord`.

### 2. Serverless Bot Logic
**Scenario:** You have a bot that is rarely used and you don't want to pay for 24/7 hosting.
*   **The Fix:** Host HoloBridge on a tiny, cheap VPS (or free tier). Point it to a serverless function (AWS Lambda, Vercel Functions).
*   **Flow:** `User types !help` → `HoloBridge WebSocket` → `Your Listener Script` → `Trigger Serverless Function` → `REST API Reply`.

### 3. Unified Community Auth
**Scenario:** Syncing website subscriptions with Discord roles.
*   **The Fix:** When a user subscribes on your site (Stripe webhook), your backend immediately hits HoloBridge to assign the "Premium" role.
*   **Benefit:** Instant role assignment without waiting for a bot polling interval.

---

## 🧠 Advanced Architectures
*For power users building complex systems.*

### 4. The "External Brain" AI Agent
**Scenario:** Running a massive LLM (Llama 3, Grok) that requires a GPU server.
*   **The Setup:**
    *   **Server A (Cheap VPS):** Runs HoloBridge. Handles the persistent Discord connection.
    *   **Server B (GPU Monster):** Runs the AI model.
*   **The Flow:** HoloBridge streams `messageCreate` events to Server B. Server B processes the text and replies via HoloBridge's REST API.
*   **Why?** If the AI server crashes or restarts, your bot stays "online" in Discord. You can also swap AI models without restarting the bot connection.

### 5. Multi-Platform Chat Bridge
**Scenario:** Linking a Discord channel with Slack, Matrix, or IRC.
*   **The Fix:** A lightweight "translator" script connects to HoloBridge and the other platform's API.
*   **Flow:** `Discord Message` → `HoloBridge WS` → `Translator Script` → `Slack API`.
*   **Why?** HoloBridge handles the complex Gateway intent management (reconnects, heartbeats), so your translator script remains simple.

### 6. Compliance "Black Box"
**Scenario:** An enterprise needs to archive *everything* for legal compliance.
*   **The Fix:** A secure, read-only logging service connects to HoloBridge's WebSocket. It silently records every `messageCreate`, `messageDelete`, and `guildAuditLogEntryCreate` into a cold-storage database (S3, ClickHouse).
*   **Security:** The logger has no write access to Discord; it simply consumes the stream.

---

## 🎮 Real-World "Clever" Cases
*Integration with external software and hardware.*

### 7. Real-Time Game Server Sync
**Scenario:** A Minecraft or Rust server that syncs chat and bans.
*   **The Problem:** Implementing a full Discord library in Java/C++/Rust can be heavy or conflict with game threads.
*   **The Fix:** The game server uses a lightweight HTTP/WebSocket client to talk to HoloBridge.
*   **Flow:** `Player dies in-game` → `Game Server` → `POST /api/channels/:id/messages` → `Discord: "Steve fell from a high place"`.

### 8. Dynamic OBS Stream Overlay
**Scenario:** A Twitch streamer wants an overlay that reacts to Discord voice activity.
*   **The Fix:** A simple HTML/JS browser source in OBS connects to HoloBridge.
*   **Flow:** `User joins Voice Channel` → `voiceStateUpdate Event` → `OBS Overlay plays entrance theme song`.
*   **Creativity:** Show a "Talking Now" visualizer that bounces to the user's avatar when they speak.

---

## 🧪 Fun & Creative Experiments
*Weekend projects to impress your friends.*

### 9. The "Office DJ"
**Scenario:** A shared Spotify playlist for the office.
*   **The Setup:** A bot in the office voice channel.
*   **The Flow:** Users join a specific "Request" voice channel to queue a song, or use reaction emojis on a "Now Playing" message to skip tracks. HoloBridge events trigger a script controlling the office speakers.

### 10. Smart Home "God Mode"
**Scenario:** Controlling your house via Discord.
*   **The Setup:** Home Assistant + HoloBridge.
*   **The Flow:**
    *   `!lights on` → HoloBridge → Home Assistant turns on lights.
    *   **Doorbell Rings** → Home Assistant → HoloBridge → Bot posts a photo of the visitor in `#security-logs`.

### 11. The Stock/Crypto Ticker
**Scenario:** A channel name that updates with the price of Bitcoin.
*   **The Fix:** A script polls an API for prices and uses HoloBridge's `PATCH /api/channels/:id` to update the channel name every 10 minutes.
*   **Result:** `#btc-98k` (Updates automatically).

### 12. "Dad Bot" Microservice
**Scenario:** A dedicated service just for dad jokes.
*   **The Fix:** A tiny script that listens *only* for messages starting with "I'm".
*   **Flow:** `User: "I'm hungry"` → `Script: "Hi hungry, I'm Dad"` via HoloBridge.
*   **Why?** Because you can run this annoying logic separately from your serious moderation bot.

---

## 🚀 Why Use HoloBridge?

| Feature | Standard Bot | HoloBridge |
| :--- | :--- | :--- |
| **Language** | Node.js/Python/etc. | **Any** (via HTTP/WS) |
| **Hosting** | Stateful Process | **Decoupled** |
| **Scaling** | Sharding is hard | **Stateless API** |
| **Complexity** | High (Intents, Cache) | **Low** (Simple JSON) |
