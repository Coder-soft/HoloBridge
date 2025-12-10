import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer, Server } from 'http';
import express from 'express';

// Create a minimal test server
const app = express();
let server: Server;

app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

beforeAll(() => {
    server = createServer(app).listen(0); // Random port
});

afterAll(() => {
    server.close();
});

describe('Health Endpoint', () => {
    it('GET /health should return status ok', async () => {
        const address = server.address();
        if (!address || typeof address === 'string') {
            throw new Error('Server not started');
        }

        const response = await fetch(`http://localhost:${address.port}/health`);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.status).toBe('ok');
        expect(data.timestamp).toBeDefined();
    });

    it('GET /api/health should return status ok', async () => {
        const address = server.address();
        if (!address || typeof address === 'string') {
            throw new Error('Server not started');
        }

        const response = await fetch(`http://localhost:${address.port}/api/health`);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.status).toBe('ok');
    });
});
