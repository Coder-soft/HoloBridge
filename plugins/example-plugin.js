/**
 * Example HoloBridge Plugin
 * 
 * This plugin demonstrates the plugin system capabilities including:
 * - Event subscriptions (both Discord and custom events)
 * - REST API endpoints
 * - Inter-plugin communication
 */

export default {
    metadata: {
        name: 'example-plugin',
        version: '2.0.0',
        author: 'HoloBridge',
        description: 'An example plugin demonstrating events and REST endpoints',
    },

    /**
     * Register REST API routes for this plugin.
     * Routes are mounted at /api/plugins/example-plugin/
     */
    routes(router, ctx) {
        // GET /api/plugins/example-plugin/status
        router.get('/status', (req, res) => {
            res.json({
                success: true,
                data: {
                    status: 'ok',
                    guilds: ctx.client.guilds.cache.size,
                    uptime: process.uptime(),
                },
            });
        });

        // GET /api/plugins/example-plugin/guilds
        router.get('/guilds', (req, res) => {
            const guilds = ctx.client.guilds.cache.map(g => ({
                id: g.id,
                name: g.name,
                memberCount: g.memberCount,
            }));
            res.json({ success: true, data: guilds });
        });

        // POST /api/plugins/example-plugin/emit-test
        router.post('/emit-test', (req, res) => {
            const { message } = req.body;
            // Emit a custom event that other plugins can listen to
            ctx.eventBus.emitCustom('example:test-event', {
                message: message || 'Hello from example plugin!',
                timestamp: Date.now(),
            });
            res.json({ success: true, message: 'Event emitted' });
        });
    },

    /**
     * Set up event subscriptions.
     * Return an array of subscriptions for automatic cleanup.
     */
    events(on, ctx) {
        return [
            // Subscribe to Discord message events
            on.onDiscord('messageCreate', (msg) => {
                if (msg.author?.bot) return;

                if (msg.content === '!ping') {
                    ctx.logger.info(`Received ping from ${msg.author.username}`);
                }
            }),

            // Subscribe to guild member join events
            on.onDiscord('guildMemberAdd', (member) => {
                ctx.logger.info(`New member joined: ${member.user?.username}`);
                // Emit a custom event for other plugins
                on.emit('example:member-joined', {
                    userId: member.user?.id,
                    username: member.user?.username,
                    guildId: member.guildId,
                });
            }),

            // Listen for events from other plugins
            on.onCustom('other-plugin:action', (data) => {
                ctx.logger.debug('Received event from another plugin:', data);
            }),

            // React when another plugin loads
            on.onPluginLoaded((data) => {
                ctx.logger.info(`Plugin loaded: ${data.name} v${data.version}`);
            }),
        ];
    },

    /**
     * Called when the plugin is loaded.
     */
    onLoad(ctx) {
        ctx.logger.info('Example plugin v2.0.0 loaded!');
        ctx.logger.info(`Connected to ${ctx.client.guilds.cache.size} guild(s)`);
        ctx.logger.info(`Other plugins: ${ctx.listPlugins().join(', ') || 'none yet'}`);
    },

    /**
     * Called when the plugin is unloaded.
     */
    onUnload() {
        console.log('[example-plugin] Goodbye!');
    },
};
