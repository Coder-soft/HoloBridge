import { describe, it, expect } from 'vitest';
import { configSchema } from '../../src/config/index.js';

describe('Config Validation', () => {
    it('should accept valid configuration', () => {
        const validConfig = {
            discord: {
                token: 'test-token',
            },
            api: {
                port: 3000,
                apiKey: 'test-api-key',
                apiKeys: [],
            },
            plugins: {
                enabled: true,
                directory: 'plugins',
            },
            rateLimit: {
                enabled: true,
                windowMs: 60000,
                maxRequests: 100,
            },
            debug: false,
        };

        const result = configSchema.safeParse(validConfig);
        expect(result.success).toBe(true);
    });

    it('should reject missing discord token', () => {
        const invalidConfig = {
            discord: {}, // Missing token
            api: {
                port: 3000,
                apiKey: 'test-api-key',
            },
            plugins: { enabled: true, directory: 'plugins' },
            rateLimit: { enabled: true, windowMs: 60000, maxRequests: 100 },
            debug: false,
        };

        const result = configSchema.safeParse(invalidConfig);
        expect(result.success).toBe(false);
    });

    it('should reject empty discord token', () => {
        const invalidConfig = {
            discord: {
                token: '',
            },
            api: {
                port: 3000,
                apiKey: 'test-api-key',
            },
            plugins: { enabled: true, directory: 'plugins' },
            rateLimit: { enabled: true, windowMs: 60000, maxRequests: 100 },
            debug: false,
        };

        const result = configSchema.safeParse(invalidConfig);
        expect(result.success).toBe(false);
    });

    it('should apply default values', () => {
        const minimalConfig = {
            discord: {
                token: 'test-token',
            },
            api: {
                apiKey: 'test-api-key',
            },
            // Other fields should be defaulted
            plugins: {},
            rateLimit: {},
        };

        const result = configSchema.parse(minimalConfig);
        expect(result.api.port).toBe(3000);
        expect(result.debug).toBe(false);
        expect(result.plugins.enabled).toBe(true);
        expect(result.rateLimit.maxRequests).toBe(100);
    });

    it('should reject invalid port', () => {
        const invalidConfig = {
            discord: { token: 'test-token' },
            api: {
                apiKey: 'test-api-key',
                port: -1,
            },
            plugins: { enabled: true, directory: 'plugins' },
            rateLimit: { enabled: true, windowMs: 60000, maxRequests: 100 },
            debug: false,
        };

        const result = configSchema.safeParse(invalidConfig);
        expect(result.success).toBe(false);
    });
});
