/**
 * HoloBridge Hosting Server
 * 
 * Main entry point for the hosting API server.
 */

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { config } from './config.js';
import { router, healthHandler } from './api/routes.js';
import { initWebSocket } from './api/websocket.js';
import { checkDockerHealth } from './orchestrator/docker.js';

async function main(): Promise<void> {
    console.log('🚀 Starting HoloBridge Hosting Server...\n');

    // Check Docker availability
    console.log('🐳 Checking Docker connection...');
    const dockerAvailable = await checkDockerHealth();
    if (!dockerAvailable) {
        console.error('❌ Docker is not available. Please ensure Docker is running.');
        process.exit(1);
    }
    console.log('✓ Docker is connected\n');

    // Create Express app
    const app = express();

    // Middleware
    app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:3000' }));
    app.use(express.json({ limit: '10mb' }));

    // Health check (no auth)
    app.get('/health', healthHandler);

    // API routes
    app.use('/api/v1', router);

    // Error handler
    app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
        console.error('Unhandled error:', err);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An unexpected error occurred',
            },
        });
    });

    // Create HTTP server
    const httpServer = createServer(app);

    // Initialize WebSocket
    console.log('🔌 Initializing WebSocket server...');
    initWebSocket(httpServer);
    console.log('✓ WebSocket server ready\n');

    // Start server
    httpServer.listen(config.server.port, config.server.host, () => {
        console.log('✨ HoloBridge Hosting Server is ready!\n');
        console.log(`   📡 API:       http://${config.server.host}:${config.server.port}/api/v1`);
        console.log(`   🔌 WebSocket: ws://${config.server.host}:${config.server.port}`);
        console.log(`   💚 Health:    http://${config.server.host}:${config.server.port}/health\n`);
    });
}

// Graceful shutdown
function shutdown(): void {
    console.log('\n🛑 Shutting down...');
    process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start
main().catch((error) => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
});
