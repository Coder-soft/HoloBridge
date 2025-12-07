import type { Client } from 'discord.js';
import type { Server as SocketIOServer } from 'socket.io';
import type { Config } from '../config/index.js';
import type {
    ServerToClientEvents,
    ClientToServerEvents,
    InterServerEvents,
    SocketData,
} from './events.types.js';

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
    /** Logger utility */
    log: (message: string) => void;
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
     */
    onEvent?: (eventName: string, data: unknown) => Promise<void> | void;
}

/**
 * Type for plugin module exports.
 */
export type PluginExport = HoloPlugin | { default: HoloPlugin };
