import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Mock config schema for testing
const configSchema = z.object({
    discordToken: z.string().min(1),
    apiKey: z.string().min(1),
    port: z.number().int().positive().default(3000),
    debug: z.boolean().default(false),
});

describe('Config Validation', () => {
    it('should accept valid configuration', () => {
        const validConfig = {
            discordToken: 'test-token',
            apiKey: 'test-api-key',
            port: 3000,
            debug: false,
        };

        const result = configSchema.safeParse(validConfig);
        expect(result.success).toBe(true);
    });

    it('should reject missing discordToken', () => {
        const invalidConfig = {
            apiKey: 'test-api-key',
        };

        const result = configSchema.safeParse(invalidConfig);
        expect(result.success).toBe(false);
    });

    it('should reject empty discordToken', () => {
        const invalidConfig = {
            discordToken: '',
            apiKey: 'test-api-key',
        };

        const result = configSchema.safeParse(invalidConfig);
        expect(result.success).toBe(false);
    });

    it('should apply default values', () => {
        const minimalConfig = {
            discordToken: 'test-token',
            apiKey: 'test-api-key',
        };

        const result = configSchema.parse(minimalConfig);
        expect(result.port).toBe(3000);
        expect(result.debug).toBe(false);
    });

    it('should reject invalid port', () => {
        const invalidConfig = {
            discordToken: 'test-token',
            apiKey: 'test-api-key',
            port: -1,
        };

        const result = configSchema.safeParse(invalidConfig);
        expect(result.success).toBe(false);
    });
});
