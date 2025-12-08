/**
 * HoloBridge Hosting Server - Configuration
 * 
 * Loads and validates environment variables.
 */

import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const configSchema = z.object({
    server: z.object({
        port: z.number().int().positive().default(4000),
        host: z.string().default('0.0.0.0'),
    }),
    supabase: z.object({
        url: z.string().url(),
        serviceKey: z.string().min(1),
    }),
    docker: z.object({
        socketPath: z.string().default('/var/run/docker.sock'),
        image: z.string().default('holobridge:latest'),
    }),
    security: z.object({
        encryptionKey: z.string().min(32, 'Encryption key must be at least 32 characters'),
    }),
    discord: z.object({
        clientId: z.string().optional(),
        clientSecret: z.string().optional(),
    }),
});

export type Config = z.infer<typeof configSchema>;

function loadConfig(): Config {
    const rawConfig = {
        server: {
            port: parseInt(process.env['PORT'] ?? '4000', 10),
            host: process.env['HOST'] ?? '0.0.0.0',
        },
        supabase: {
            url: process.env['SUPABASE_URL'] ?? '',
            serviceKey: process.env['SUPABASE_SERVICE_KEY'] ?? '',
        },
        docker: {
            socketPath: process.env['DOCKER_SOCKET'] ?? '/var/run/docker.sock',
            image: process.env['HOLOBRIDGE_IMAGE'] ?? 'holobridge:latest',
        },
        security: {
            encryptionKey: process.env['ENCRYPTION_KEY'] ?? '',
        },
        discord: {
            clientId: process.env['DISCORD_CLIENT_ID'],
            clientSecret: process.env['DISCORD_CLIENT_SECRET'],
        },
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

export const config = loadConfig();
