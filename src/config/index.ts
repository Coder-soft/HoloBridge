import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

// Schema for individual API keys with scopes
const apiKeySchema = z.object({
    id: z.string(),
    name: z.string(),
    key: z.string(),
    scopes: z.array(z.string()),
});

const configSchema = z.object({
    discord: z.object({
        token: z.string().min(1, 'Discord token is required'),
    }),
    api: z.object({
        port: z.number().int().positive().default(3000),
        // Legacy single key (still supported for backwards compatibility)
        apiKey: z.string().min(1, 'API key is required'),
        // New: Multiple API keys with scopes
        apiKeys: z.array(apiKeySchema).default([]),
    }),
    plugins: z.object({
        enabled: z.boolean().default(true),
        directory: z.string().default('plugins'),
    }),
    rateLimit: z.object({
        enabled: z.boolean().default(true),
        windowMs: z.number().default(60000), // 1 minute
        maxRequests: z.number().default(100), // 100 requests per minute
    }),
    debug: z.boolean().default(false),
});

export type Config = z.infer<typeof configSchema>;

function loadConfig(): Config {
    const rawConfig = {
        discord: {
            token: process.env['DISCORD_TOKEN'] ?? '',
        },
        api: {
            port: parseInt(process.env['PORT'] ?? '3000', 10),
            apiKey: process.env['API_KEY'] ?? '',
            // API keys can be loaded from a JSON file or environment variable
            apiKeys: parseApiKeys(process.env['API_KEYS']),
        },
        plugins: {
            enabled: process.env['PLUGINS_ENABLED'] !== 'false',
            directory: process.env['PLUGINS_DIR'] ?? 'plugins',
        },
        rateLimit: {
            enabled: process.env['RATE_LIMIT_ENABLED'] !== 'false',
            windowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] ?? '60000', 10),
            maxRequests: parseInt(process.env['RATE_LIMIT_MAX'] ?? '100', 10),
        },
        debug: process.env['DEBUG'] === 'true',
    };

    const result = configSchema.safeParse(rawConfig);

    if (!result.success) {
        console.error('❌ Configuration Error:');
        result.error.issues.forEach((issue) => {
            console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
        });
        process.exit(1);
    }

    return result.data;
}

/**
 * Parse API_KEYS environment variable (JSON array)
 */
function parseApiKeys(envVar: string | undefined): z.infer<typeof apiKeySchema>[] {
    if (!envVar) return [];
    try {
        return JSON.parse(envVar);
    } catch {
        console.warn('⚠️ Failed to parse API_KEYS env var. Using empty array.');
        return [];
    }
}

export const config = loadConfig();

