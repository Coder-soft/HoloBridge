import type { Client } from 'discord.js';
import type { Server as SocketIOServer } from 'socket.io';
import type { Application } from 'express';
import type { Config } from '../config/index.js';
import type {
    ServerToClientEvents,
    ClientToServerEvents,
    InterServerEvents,
    SocketData,
} from './events.types.js';
import type { PluginEventBus, EventSubscription } from '../plugins/event-bus.js';
import type { PluginRouter, PluginLogger, EventHelpers } from '../plugins/sdk.js';

/**
 * The context passed to plugins on load.
 * Provides access to core HoloBridge services.
 */
export interface PluginContext {
    /** The Discord.js client instance */
    client: Client;
    /** The Socket.IO server for real-time events */
    io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
    /** Application configuration */
    config: Config;
    /** Express application (for advanced use cases) */
    app: Application;
    /** Event bus for inter-plugin communication */
    eventBus: PluginEventBus;
    /** Logger utility (legacy) */
    log: (message: string) => void;
    /** Enhanced logger with levels */
    logger: PluginLogger;
    /** Get metadata of a loaded plugin */
    getPlugin: (name: string) => PluginMetadata | undefined;
    /** List all loaded plugin names */
    listPlugins: () => string[];
}

/**
 * Metadata for a HoloBridge plugin.
 */
export interface PluginMetadata {
    /** Unique plugin name */
    name: string;
    /** Semantic version (e.g., "1.0.0") */
    version: string;
    /** Plugin author */
    author?: string;
    /** Short description */
    description?: string;
}

/**
 * The interface that all HoloBridge plugins must implement.
 */
export interface HoloPlugin {
    /** Plugin metadata */
    metadata: PluginMetadata;

    /**
     * Register REST API routes for this plugin.
     * Routes will be mounted at /api/plugins/{plugin-name}/
     * 
     * @example
     * ```typescript
     * routes: (router, ctx) => {
     *     router.get('/status', (req, res) => {
     *         res.json({ status: 'ok' });
     *     });
     *     router.post('/action', (req, res) => {
     *         // Handle POST request
     *     });
     * }
     * ```
     */
    routes?: (router: PluginRouter, ctx: PluginContext) => void;

    /**
     * Set up event subscriptions for inter-plugin communication.
     * Return an array of subscriptions for automatic cleanup on unload.
     * 
     * @example
     * ```typescript
     * events: (helpers, ctx) => [
     *     helpers.onDiscord('messageCreate', (msg) => {
     *         console.log('New message:', msg.content);
     *     }),
     *     helpers.onCustom('other-plugin:action', (data) => {
     *         // Handle custom event from another plugin
     *     }),
     * ]
     * ```
     */
    events?: (
        helpers: EventHelpers,
        ctx: PluginContext
    ) => EventSubscription[];

    /**
     * Called when the plugin is loaded.
     * Use this to set up event listeners, initialize state, etc.
     */
    onLoad?: (ctx: PluginContext) => Promise<void> | void;

    /**
     * Called when the plugin is unloaded (e.g., on shutdown).
     * Use this for cleanup.
     */
    onUnload?: () => Promise<void> | void;

    /**
     * Called for every Discord event that HoloBridge broadcasts.
     * @param eventName - The Discord event name (e.g., "messageCreate")
     * @param data - The serialized event data
     * @deprecated Use the `events` hook with typed subscriptions instead
     */
    onEvent?: (eventName: string, data: unknown) => Promise<void> | void;
}

/**
 * Type for plugin module exports.
 */
export type PluginExport = HoloPlugin | { default: HoloPlugin };
