import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { config } from '../config/index.js';
import { authMiddleware, errorHandler, notFoundHandler } from './middleware/auth.js';
import { rateLimiter } from './middleware/rateLimit.js';
import { setupWebSocketEvents } from './websocket/events.js';
import { setSocketServer } from '../discord/events/index.js';
import type {
    ServerToClientEvents,
    ClientToServerEvents,
    InterServerEvents,
    SocketData,
} from '../types/events.types.js';

// Import routes
import guildsRouter from './routes/guilds.js';
import membersRouter from './routes/members.js';
import messagesRouter from './routes/messages.js';
import channelsRouter from './routes/channels.js';
import rolesRouter from './routes/roles.js';
import stickersRouter from './routes/stickers.js';
import scheduledEventsRouter from './routes/scheduled-events.js';
import autoModRouter from './routes/automod.js';
import stageInstancesRouter from './routes/stage-instances.js';
import invitesRouter from './routes/invites.js';
import webhooksRouter from './routes/webhooks.js';
import emojisRouter from './routes/emojis.js';
import type { Application } from 'express';
import type { Server as HttpServer } from 'http';

/**
 * API Server instance type
 */
export interface ApiServerInstance {
    app: Application;
    httpServer: HttpServer;
    io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
}

// Store server instance for reuse
let serverInstance: ApiServerInstance | null = null;

/**
 * Create and configure the API server
 */
export function createApiServer(): ApiServerInstance {
    // Return existing instance if already created
    if (serverInstance) {
        return serverInstance;
    }

    const app = express();
    const httpServer = createServer(app);

    // Socket.IO setup
    const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(
        httpServer,
        {
            cors: {
                origin: '*',
                methods: ['GET', 'POST', 'PATCH', 'DELETE'],
            },
        }
    );

    // Middleware
    app.use(cors());
    app.use(express.json());

    // Health check endpoint (no auth required)
    app.get('/health', (req, res) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Apply rate limiting globally (before auth)
    app.use('/api', rateLimiter());

    // Apply authentication to all /api routes
    app.use('/api', authMiddleware);

    // Mount routes
    app.use('/api/guilds', guildsRouter);
    app.use('/api/guilds/:guildId/members', membersRouter);
    app.use('/api/guilds/:guildId/roles', rolesRouter);
    app.use('/api/channels/:channelId/messages', messagesRouter);
    app.use('/api/channels', channelsRouter);
    app.use('/api/guilds/:guildId/stickers', stickersRouter);
    app.use('/api/guilds/:guildId/scheduled-events', scheduledEventsRouter);
    app.use('/api/guilds/:guildId/auto-moderation', autoModRouter);
    app.use('/api/guilds/:guildId/emojis', emojisRouter);
    app.use('/api/stage-instances', stageInstancesRouter);
    app.use('/api/invites', invitesRouter);
    app.use('/api/webhooks', webhooksRouter);

    // Error handlers
    app.use(notFoundHandler);
    app.use(errorHandler);

    // Setup WebSocket events
    setupWebSocketEvents(io);

    // Connect socket server to Discord event broadcaster
    setSocketServer(io);

    // Store instance
    serverInstance = { app, httpServer, io };

    return serverInstance;
}

/**
 * Start the API server
 */
export function startApiServer(): Promise<void> {
    return new Promise((resolve) => {
        const { httpServer } = createApiServer();

        httpServer.listen(config.api.port, () => {
            console.log(`🌐 API server listening on port ${config.api.port}`);
            console.log(`   REST API: http://localhost:${config.api.port}/api`);
            console.log(`   WebSocket: ws://localhost:${config.api.port}`);
            console.log(`   Health check: http://localhost:${config.api.port}/health`);
            resolve();
        });
    });
}
