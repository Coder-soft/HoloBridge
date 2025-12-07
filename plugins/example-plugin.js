/**
 * Example HoloBridge Plugin
 * 
 * This plugin demonstrates the plugin system capabilities.
 * It logs events and provides a simple "ping" response.
 */

export default {
    metadata: {
        name: 'example-plugin',
        version: '1.0.0',
        author: 'HoloBridge',
        description: 'An example plugin that logs events and responds to "!ping"',
    },

    onLoad(ctx) {
        ctx.log('Example plugin loaded!');
        ctx.log(`Connected to ${ctx.client.guilds.cache.size} guild(s)`);
    },

    onUnload() {
        console.log('[Example Plugin] Goodbye!');
    },

    async onEvent(eventName, data) {
        // Only process messageCreate events
        if (eventName !== 'messageCreate') return;

        const message = data;

        // Ignore bot messages
        if (message.author?.bot) return;

        // Simple ping command
        if (message.content === '!ping') {
            console.log(`[Example Plugin] Received ping from ${message.author.username}`);
            // Note: To respond, you would use the REST API or Discord.js client
        }
    },
};
