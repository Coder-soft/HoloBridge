import { OpenAPIRegistry, OpenApiGeneratorV3, extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { CreateApplicationCommandSchema } from '../types/api.types.js';

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
registry.register('CreateApplicationCommand', CreateApplicationCommandSchema);

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
                    schema: { $ref: '#/components/schemas/SuccessResponse' },
                },
            },
        },
        500: {
            description: 'Internal Server Error',
            content: {
                'application/json': {
                    schema: { $ref: '#/components/schemas/ErrorResponse' },
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
                    schema: { $ref: '#/components/schemas/SuccessResponse' },
                },
            },
        },
        500: {
            description: 'Internal Server Error',
            content: {
                'application/json': {
                    schema: { $ref: '#/components/schemas/ErrorResponse' },
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
        200: {
            description: 'Guild details',
            content: {
                'application/json': {
                    schema: { $ref: '#/components/schemas/SuccessResponse' },
                },
            },
        },
        404: {
            description: 'Guild not found',
            content: {
                'application/json': {
                    schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
            },
        },
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
        200: {
            description: 'List of global commands',
            content: {
                'application/json': {
                    schema: { $ref: '#/components/schemas/SuccessResponse' },
                },
            },
        },
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
                    schema: { $ref: '#/components/schemas/CreateApplicationCommand' },
                },
            },
        },
    },
    responses: {
        201: {
            description: 'Command created',
            content: {
                'application/json': {
                    schema: { $ref: '#/components/schemas/SuccessResponse' },
                },
            },
        },
        400: {
            description: 'Validation error',
            content: {
                'application/json': {
                    schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
            },
        },
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
