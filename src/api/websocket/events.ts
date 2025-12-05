import type { Server as SocketIOServer, Socket } from 'socket.io';
import { config } from '../../config/index.js';
import { discordClient } from '../../discord/client.js';
import type {
    ServerToClientEvents,
    ClientToServerEvents,
    InterServerEvents,
    SocketData,
} from '../../types/events.types.js';

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

/**
 * Setup WebSocket event handlers for Socket.IO
 */
export function setupWebSocketEvents(
    io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
): void {
    // Authentication middleware
    io.use((socket, next) => {
        const apiKey = socket.handshake.auth['apiKey'] as string | undefined;

        if (!apiKey) {
            return next(new Error('Missing API key'));
        }

        if (apiKey !== config.api.apiKey) {
            return next(new Error('Invalid API key'));
        }

        socket.data.apiKey = apiKey;
        socket.data.subscribedGuilds = new Set();
        next();
    });

    io.on('connection', (socket: TypedSocket) => {
        console.log(`📱 WebSocket client connected: ${socket.id}`);

        // Subscribe to guild events
        socket.on('subscribe', (data) => {
            const { guildIds } = data;
            const validGuildIds: string[] = [];

            for (const guildId of guildIds) {
                // Verify guild exists
                if (discordClient.guilds.cache.has(guildId)) {
                    socket.join(`guild:${guildId}`);
                    socket.data.subscribedGuilds?.add(guildId);
                    validGuildIds.push(guildId);

                    if (config.debug) {
                        console.log(`   Subscribed to guild: ${guildId}`);
                    }
                }
            }

            socket.emit('subscribed', { guildIds: validGuildIds });
        });

        // Unsubscribe from guild events
        socket.on('unsubscribe', (data) => {
            const { guildIds } = data;

            for (const guildId of guildIds) {
                socket.leave(`guild:${guildId}`);
                socket.data.subscribedGuilds?.delete(guildId);

                if (config.debug) {
                    console.log(`   Unsubscribed from guild: ${guildId}`);
                }
            }

            socket.emit('unsubscribed', { guildIds });
        });

        // Handle disconnect
        socket.on('disconnect', (reason) => {
            console.log(`📴 WebSocket client disconnected: ${socket.id} (${reason})`);
        });

        // Handle errors
        socket.on('error', (error) => {
            console.error(`❌ WebSocket error for ${socket.id}:`, error);
        });
    });

    console.log('✅ WebSocket event handlers configured');
}
