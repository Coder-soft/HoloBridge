import { loginDiscord, waitForReady, discordClient } from './discord/client.js';
import { registerDiscordEvents } from './discord/events/index.js';
import { createApiServer, startApiServer } from './api/server.js';
import { pluginManager } from './plugins/manager.js';
import { config } from './config/index.js';

async function main(): Promise<void> {
    console.log('🚀 Starting Holo Bridge...\n');

    try {
        // Login to Discord
        console.log('📡 Connecting to Discord...');
        await loginDiscord();
        await waitForReady();
        console.log('');

        // Register Discord event handlers
        registerDiscordEvents();
        console.log('');

        // Create API server (needed for plugin context)
        const { io } = createApiServer();

        // Initialize and load plugins
        if (config.plugins.enabled) {
            console.log('🔌 Initializing plugin system...');
            pluginManager.setContext(discordClient, io, config);
            await pluginManager.loadPlugins();
            console.log('');
        }

        // Start API server
        await startApiServer();
        console.log('');

        console.log('✨ Holo Bridge is ready!\n');
    } catch (error) {
        console.error('❌ Failed to start Holo Bridge:', error);
        process.exit(1);
    }
}

// Handle graceful shutdown
async function shutdown(): Promise<void> {
    console.log('\n🛑 Shutting down...');

    // Unload plugins gracefully
    if (pluginManager.count > 0) {
        console.log('🔌 Unloading plugins...');
        await pluginManager.unloadAll();
    }

    process.exit(0);
}

process.on('SIGINT', () => void shutdown());
process.on('SIGTERM', () => void shutdown());

// Start the application
main();

