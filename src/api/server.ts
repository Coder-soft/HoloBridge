import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { config } from '../config/index.js';
import { authMiddleware, errorHandler, notFoundHandler } from './middleware/auth.js';
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

/**
 * Create and configure the API server
 */
export function createApiServer() {
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

    // Apply authentication to all /api routes
    app.use('/api', authMiddleware);

    // Mount routes
    app.use('/api/guilds', guildsRouter);
    app.use('/api/guilds/:guildId/members', membersRouter);
    app.use('/api/guilds/:guildId/roles', rolesRouter);
    app.use('/api/channels/:channelId/messages', messagesRouter);
    app.use('/api/channels', channelsRouter);

    // Error handlers
    app.use(notFoundHandler);
    app.use(errorHandler);

    // Setup WebSocket events
    setupWebSocketEvents(io);

    // Connect socket server to Discord event broadcaster
    setSocketServer(io);

    return { app, httpServer, io };
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
