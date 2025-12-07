import { readdir, access, mkdir } from 'fs/promises';
import { constants } from 'fs';
import { join, resolve } from 'path';
import { pathToFileURL } from 'url';
import type { Client } from 'discord.js';
import type { Server as SocketIOServer } from 'socket.io';
import type { Config } from '../config/index.js';
import type {
    HoloPlugin,
    PluginContext,
    PluginExport,
} from '../types/plugin.types.js';
import type {
    ServerToClientEvents,
    ClientToServerEvents,
    InterServerEvents,
    SocketData,
} from '../types/events.types.js';

/**
 * Manages the lifecycle of HoloBridge plugins.
 */
export class PluginManager {
    private plugins: Map<string, HoloPlugin> = new Map();
    private context: PluginContext | null = null;
    private pluginsDir: string;

    constructor(pluginsDir?: string) {
        this.pluginsDir = pluginsDir ?? resolve(process.cwd(), 'plugins');
    }

    /**
     * Initialize the plugin context with core services.
     */
    setContext(
        client: Client,
        io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
        config: Config
    ): void {
        this.context = {
            client,
            io,
            config,
            log: (message: string) => console.log(`[Plugin] ${message}`),
        };
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

        // Call onLoad lifecycle hook
        if (plugin.onLoad) {
            await plugin.onLoad(this.context);
        }

        this.plugins.set(name, plugin);
        console.log(`  ✅ Loaded: ${name} v${version}`);
    }

    /**
     * Emit an event to all loaded plugins.
     */
    async emit(eventName: string, data: unknown): Promise<void> {
        for (const [name, plugin] of this.plugins) {
            if (plugin.onEvent) {
                try {
                    await plugin.onEvent(eventName, data);
                } catch (error) {
                    console.error(`❌ Plugin "${name}" error on event "${eventName}":`, error);
                }
            }
        }
    }

    /**
     * Unload all plugins (call onUnload handlers).
     */
    async unloadAll(): Promise<void> {
        for (const [name, plugin] of this.plugins) {
            if (plugin.onUnload) {
                try {
                    await plugin.onUnload();
                    console.log(`  🔌 Unloaded: ${name}`);
                } catch (error) {
                    console.error(`❌ Failed to unload plugin "${name}":`, error);
                }
            }
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
