import { OpenAPIRegistry, OpenApiGeneratorV3, extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

// Extend Zod with OpenAPI support
extendZodWithOpenApi(z);

// Create OpenAPI registry
const registry = new OpenAPIRegistry();

// Define reusable schemas
const ErrorResponseSchema = z.object({
    success: z.literal(false),
    error: z.string(),
    code: z.string(),
});

const SuccessResponseSchema = z.object({
    success: z.literal(true),
    data: z.unknown(),
});

// Register schemas
registry.register('ErrorResponse', ErrorResponseSchema);
registry.register('SuccessResponse', SuccessResponseSchema);

// --- Health Endpoint ---
registry.registerPath({
    method: 'get',
    path: '/health',
    summary: 'Health check',
    description: 'Check if the API server is running. No authentication required.',
    tags: ['System'],
    security: [],
    responses: {
        200: {
            description: 'Server is healthy',
            content: {
                'application/json': {
                    schema: z.object({
                        status: z.literal('ok'),
                        timestamp: z.string(),
                    }),
                },
            },
        },
    },
});

// --- Guilds Endpoints ---
registry.registerPath({
    method: 'get',
    path: '/api/guilds',
    summary: 'List all guilds',
    description: 'Get a list of all guilds the bot is connected to.',
    tags: ['Guilds'],
    responses: {
        200: {
            description: 'List of guilds',
            content: {
                'application/json': {
                    schema: z.object({
                        success: z.literal(true),
                        data: z.array(z.object({
                            id: z.string(),
                            name: z.string(),
                            icon: z.string().nullable(),
                            memberCount: z.number(),
                        })),
                    }),
                },
            },
        },
    },
});

registry.registerPath({
    method: 'get',
    path: '/api/guilds/{guildId}',
    summary: 'Get guild details',
    description: 'Get detailed information about a specific guild.',
    tags: ['Guilds'],
    request: {
        params: z.object({
            guildId: z.string().describe('The ID of the guild'),
        }),
    },
    responses: {
        200: { description: 'Guild details' },
        404: { description: 'Guild not found' },
    },
});

// --- Commands Endpoints ---
registry.registerPath({
    method: 'get',
    path: '/api/commands',
    summary: 'List global commands',
    description: 'Get all global application commands.',
    tags: ['Commands'],
    responses: {
        200: { description: 'List of global commands' },
    },
});

registry.registerPath({
    method: 'post',
    path: '/api/commands',
    summary: 'Create global command',
    description: 'Create a new global application command.',
    tags: ['Commands'],
    request: {
        body: {
            content: {
                'application/json': {
                    schema: z.object({
                        name: z.string().min(1).max(32),
                        description: z.string().min(1).max(100),
                        type: z.number().optional(),
                        options: z.array(z.unknown()).optional(),
                    }),
                },
            },
        },
    },
    responses: {
        201: { description: 'Command created' },
        400: { description: 'Validation error' },
    },
});

// Generate OpenAPI document
const generator = new OpenApiGeneratorV3(registry.definitions);

export const openApiDocument = generator.generateDocument({
    openapi: '3.0.0',
    info: {
        title: 'HoloBridge API',
        version: '1.1.0',
        description: 'REST API for interacting with Discord through HoloBridge.',
        contact: {
            name: 'HoloBridge',
            url: 'https://github.com/Coder-soft/HoloBridge',
        },
    },
    servers: [
        {
            url: 'http://localhost:3000',
            description: 'Local development server',
        },
    ],
    security: [
        { ApiKeyAuth: [] },
    ],
});

// Add security scheme manually
openApiDocument.components = {
    ...openApiDocument.components,
    securitySchemes: {
        ApiKeyAuth: {
            type: 'apiKey',
            in: 'header',
            name: 'X-API-Key',
            description: 'API key for authentication',
        },
    },
};
