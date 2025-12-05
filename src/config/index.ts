import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const configSchema = z.object({
    discord: z.object({
        token: z.string().min(1, 'Discord token is required'),
    }),
    api: z.object({
        port: z.number().int().positive().default(3000),
        apiKey: z.string().min(1, 'API key is required'),
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

export const config = loadConfig();
