import { readdir, access, mkdir } from 'fs/promises';
import { constants } from 'fs';
import { join, resolve } from 'path';
import { pathToFileURL } from 'url';
import { Router } from 'express';
import type { Application } from 'express';
import type { Client } from 'discord.js';
import type { Server as SocketIOServer } from 'socket.io';
import type { Config } from '../config/index.js';
import type {
    HoloPlugin,
    PluginContext,
    PluginExport,
    PluginMetadata,
} from '../types/plugin.types.js';
import type {
    ServerToClientEvents,
    ClientToServerEvents,
    InterServerEvents,
    SocketData,
} from '../types/events.types.js';
import { pluginEventBus, type EventSubscription } from './event-bus.js';
import { createLogger, createEventHelpers, withErrorHandler, type PluginRouter } from './sdk.js';

/**
 * Internal plugin record with runtime state
 */
interface LoadedPlugin {
    plugin: HoloPlugin;
    router: Router | null;
    eventSubscriptions: EventSubscription[];
}

/**
 * Manages the lifecycle of HoloBridge plugins.
 */
export class PluginManager {
    private plugins: Map<string, LoadedPlugin> = new Map();
    private context: PluginContext | null = null;
    private pluginsDir: string;
    private app: Application | null = null;
    private pluginRouter: Router;

    constructor(pluginsDir?: string) {
        this.pluginsDir = pluginsDir ?? resolve(process.cwd(), 'plugins');
        this.pluginRouter = Router();
    }

    /**
     * Get the main plugin router (mounted at /api/plugins)
     */
    getPluginRouter(): Router {
        return this.pluginRouter;
    }

    /**
     * Initialize the plugin context with core services.
     */
    setContext(
        client: Client,
        io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
        config: Config,
        app: Application
    ): void {
        this.app = app;

        this.context = {
            client,
            io,
            config,
            app,
            eventBus: pluginEventBus,
            log: (message: string) => console.log(`[Plugin] ${message}`),
            logger: createLogger('Plugin', config.debug),
            getPlugin: (name: string) => this.getPluginMetadata(name),
            listPlugins: () => this.loadedPlugins,
        };

        // Set debug mode on event bus
        pluginEventBus.setDebug(config.debug);
    }

    /**
     * Get metadata for a loaded plugin
     */
    getPluginMetadata(name: string): PluginMetadata | undefined {
        const loaded = this.plugins.get(name);
        return loaded?.plugin.metadata;
    }

    /**
     * Load all plugins from the plugins directory.
     */
    async loadPlugins(): Promise<void> {
        // Ensure plugins directory exists
        try {
            await access(this.pluginsDir, constants.R_OK);
        } catch {
            console.log(`📁 Creating plugins directory: ${this.pluginsDir}`);
            await mkdir(this.pluginsDir, { recursive: true });
            return;
        }

        // Read plugin files
        const entries = await readdir(this.pluginsDir, { withFileTypes: true });
        const pluginFiles = entries.filter(
            (e) => e.isFile() && (e.name.endsWith('.js') || e.name.endsWith('.mjs'))
        );

        if (pluginFiles.length === 0) {
            console.log('📦 No plugins found in plugins/ directory');
            return;
        }

        console.log(`📦 Loading ${pluginFiles.length} plugin(s)...`);

        for (const file of pluginFiles) {
            try {
                await this.loadPlugin(join(this.pluginsDir, file.name));
            } catch (error) {
                console.error(`❌ Failed to load plugin ${file.name}:`, error);
            }
        }
    }

    /**
     * Load a single plugin from a file path.
     */
    private async loadPlugin(filePath: string): Promise<void> {
        if (!this.context) {
            throw new Error('Plugin context not initialized. Call setContext() first.');
        }

        // Dynamic import using file URL (required for ESM)
        const fileUrl = pathToFileURL(filePath).href;
        const module = (await import(fileUrl)) as PluginExport;

        // Support both default export and direct export
        const plugin: HoloPlugin = 'default' in module ? module.default : module;

        if (!plugin.metadata?.name || !plugin.metadata?.version) {
            throw new Error(`Plugin at ${filePath} is missing required metadata (name, version)`);
        }

        const { name, version } = plugin.metadata;

        // Check for duplicate
        if (this.plugins.has(name)) {
            throw new Error(`Plugin "${name}" is already loaded`);
        }

        // Create plugin-specific context with logger
        const pluginContext: PluginContext = {
            ...this.context,
            log: (message: string) => console.log(`[${name}] ${message}`),
            logger: createLogger(name, this.context.config.debug),
        };

        // Set up event subscriptions
        let eventSubscriptions: EventSubscription[] = [];
        if (plugin.events) {
            const helpers = createEventHelpers(pluginEventBus);
            try {
                eventSubscriptions = plugin.events(helpers, pluginContext) || [];
            } catch (error) {
                console.error(`❌ Plugin "${name}" failed to set up events:`, error);
            }
        }

        // Set up routes
        let pluginSubRouter: Router | null = null;
        if (plugin.routes) {
            pluginSubRouter = Router();

            // Create wrapper that adds error handling
            const wrappedRouter: PluginRouter = {
                get: (path, ...handlers) => {
                    pluginSubRouter!.get(path, ...handlers.map(h => withErrorHandler(h, name)));
                },
                post: (path, ...handlers) => {
                    pluginSubRouter!.post(path, ...handlers.map(h => withErrorHandler(h, name)));
                },
                put: (path, ...handlers) => {
                    pluginSubRouter!.put(path, ...handlers.map(h => withErrorHandler(h, name)));
                },
                patch: (path, ...handlers) => {
                    pluginSubRouter!.patch(path, ...handlers.map(h => withErrorHandler(h, name)));
                },
                delete: (path, ...handlers) => {
                    pluginSubRouter!.delete(path, ...handlers.map(h => withErrorHandler(h, name)));
                },
                use: (...args: unknown[]) => {
                    // Helper to wrap a single handler function
                    const wrapHandler = (handler: unknown): unknown => {
                        if (typeof handler === 'function') {
                            return withErrorHandler(handler as Parameters<typeof withErrorHandler>[0], name);
                        }
                        if (Array.isArray(handler)) {
                            return handler.map(wrapHandler);
                        }
                        return handler;
                    };

                    // Determine if first argument is a path
                    const firstArg = args[0];
                    const isPath = typeof firstArg === 'string' || firstArg instanceof RegExp;

                    let normalizedArgs: unknown[];
                    if (isPath) {
                        // First arg is path, rest are handlers
                        normalizedArgs = [firstArg, ...args.slice(1).map(wrapHandler)];
                    } else {
                        // All args are handlers (or arrays of handlers)
                        normalizedArgs = args.map(wrapHandler);
                    }

                    pluginSubRouter!.use(...normalizedArgs as Parameters<typeof pluginSubRouter.use>);
                },
            };

            try {
                plugin.routes(wrappedRouter, pluginContext);
                // Mount plugin routes under /api/plugins/{plugin-name}/
                this.pluginRouter.use(`/${name}`, pluginSubRouter);
                console.log(`    🛤️  Routes registered at /api/plugins/${name}/`);
            } catch (error) {
                console.error(`❌ Plugin "${name}" failed to register routes:`, error);
                pluginSubRouter = null;
            }
        }

        // Call onLoad lifecycle hook
        if (plugin.onLoad) {
            await plugin.onLoad(pluginContext);
        }

        // Store plugin state
        this.plugins.set(name, {
            plugin,
            router: pluginSubRouter,
            eventSubscriptions,
        });

        // Emit plugin loaded event
        pluginEventBus.emitPlugin('plugin:loaded', { name, version });

        console.log(`  ✅ Loaded: ${name} v${version}`);
    }

    /**
     * Emit an event to all loaded plugins.
     */
    async emit(eventName: string, data: unknown): Promise<void> {
        // Emit to event bus for new-style subscriptions
        pluginEventBus.emitDiscord(eventName as never, data);

        // Also call legacy onEvent handlers
        for (const [name, { plugin }] of this.plugins) {
            if (plugin.onEvent) {
                try {
                    await plugin.onEvent(eventName, data);
                } catch (error) {
                    console.error(`❌ Plugin "${name}" error on event "${eventName}":`, error);
                    pluginEventBus.emitPlugin('plugin:error', {
                        name,
                        error: error instanceof Error ? error : new Error(String(error)),
                    });
                }
            }
        }
    }

    /**
     * Unload all plugins (call onUnload handlers).
     */
    async unloadAll(): Promise<void> {
        for (const [name, { plugin, eventSubscriptions }] of this.plugins) {
            // Unsubscribe from all events
            for (const sub of eventSubscriptions) {
                sub.unsubscribe();
            }

            // Call onUnload handler
            if (plugin.onUnload) {
                try {
                    await plugin.onUnload();
                    console.log(`  🔌 Unloaded: ${name}`);
                } catch (error) {
                    console.error(`❌ Failed to unload plugin "${name}":`, error);
                }
            }

            // Emit plugin unloaded event
            pluginEventBus.emitPlugin('plugin:unloaded', { name });
        }
        this.plugins.clear();
    }

    /**
     * Get the count of loaded plugins.
     */
    get count(): number {
        return this.plugins.size;
    }

    /**
     * Get list of loaded plugin names.
     */
    get loadedPlugins(): string[] {
        return Array.from(this.plugins.keys());
    }
}

// Singleton instance
export const pluginManager = new PluginManager();
