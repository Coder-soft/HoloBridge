import { loginDiscord, waitForReady } from './discord/client.js';
import { registerDiscordEvents } from './discord/events/index.js';
import { startApiServer } from './api/server.js';

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
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down...');
    process.exit(0);
});

// Start the application
main();
