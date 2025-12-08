/**
 * HoloBridge Plugin SDK
 * 
 * This module provides utilities for creating HoloBridge plugins with
 * type-safe event handling, REST endpoints, and inter-plugin communication.
 * 
 * @example
 * ```typescript
 * import { definePlugin, PluginContext } from 'holobridge/sdk';
 * 
 * export default definePlugin({
 *     metadata: {
 *         name: 'my-plugin',
 *         version: '1.0.0',
 *     },
 *     routes: (router) => {
 *         router.get('/status', (req, res) => {
 *             res.json({ status: 'ok' });
 *         });
 *     },
 *     onLoad: (ctx) => {
 *         ctx.logger.info('Plugin loaded!');
 *     },
 * });
 * ```
 */

import type { Request, Response, NextFunction, Router } from 'express';
import type { PluginEventBus, EventSubscription, CustomEventPayload } from './event-bus.js';
import type { DiscordEventType } from '../types/events.types.js';

// Re-export types for convenience
export type { EventSubscription, CustomEventPayload } from './event-bus.js';
export type { PluginContext, PluginMetadata, HoloPlugin } from '../types/plugin.types.js';
export type { DiscordEventType } from '../types/events.types.js';

/**
 * Route handler type
 */
export type RouteHandler = (
    req: Request,
    res: Response,
    next: NextFunction
) => void | Promise<void>;

/**
 * Plugin router interface for registering REST endpoints
 */
export interface PluginRouter {
    /** Register a GET endpoint */
    get(path: string, ...handlers: RouteHandler[]): void;
    /** Register a POST endpoint */
    post(path: string, ...handlers: RouteHandler[]): void;
    /** Register a PUT endpoint */
    put(path: string, ...handlers: RouteHandler[]): void;
    /** Register a PATCH endpoint */
    patch(path: string, ...handlers: RouteHandler[]): void;
    /** Register a DELETE endpoint */
    delete(path: string, ...handlers: RouteHandler[]): void;
    /** Use middleware */
    use(...handlers: RouteHandler[]): void;
}

/**
 * Enhanced logger with plugin context
 */
export interface PluginLogger {
    /** Log an info message */
    info(message: string, ...args: unknown[]): void;
    /** Log a warning message */
    warn(message: string, ...args: unknown[]): void;
    /** Log an error message */
    error(message: string, ...args: unknown[]): void;
    /** Log a debug message (only in debug mode) */
    debug(message: string, ...args: unknown[]): void;
}

/**
 * Create a logger instance for a plugin
 */
export function createLogger(pluginName: string, debug: boolean = false): PluginLogger {
    const prefix = `[${pluginName}]`;
    return {
        info: (message: string, ...args: unknown[]) => {
            console.log(`${prefix} ${message}`, ...args);
        },
        warn: (message: string, ...args: unknown[]) => {
            console.warn(`${prefix} ⚠️ ${message}`, ...args);
        },
        error: (message: string, ...args: unknown[]) => {
            console.error(`${prefix} ❌ ${message}`, ...args);
        },
        debug: (message: string, ...args: unknown[]) => {
            if (debug) {
                console.log(`${prefix} 🔍 ${message}`, ...args);
            }
        },
    };
}

/**
 * Wrap a route handler with error handling
 */
export function withErrorHandler(
    handler: RouteHandler,
    pluginName: string
): RouteHandler {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            await handler(req, res, next);
        } catch (error) {
            console.error(`[${pluginName}] Route error:`, error);
            if (!res.headersSent) {
                res.status(500).json({
                    success: false,
                    error: 'Internal plugin error',
                    code: 'PLUGIN_ERROR',
                    plugin: pluginName,
                });
            }
        }
    };
}

/**
 * Create a type-safe event listener helper
 */
export function createEventHelpers(eventBus: PluginEventBus) {
    return {
        /**
         * Subscribe to Discord events
         */
        onDiscord<T = unknown>(
            event: DiscordEventType,
            handler: (data: T) => void | Promise<void>
        ): EventSubscription {
            return eventBus.onDiscord(event, handler);
        },

        /**
         * Subscribe to custom events from other plugins
         */
        onCustom<T extends CustomEventPayload = CustomEventPayload>(
            event: string,
            handler: (data: T) => void | Promise<void>
        ): EventSubscription {
            return eventBus.onCustom(event, handler);
        },

        /**
         * Emit a custom event for other plugins
         */
        emit<T extends CustomEventPayload>(event: string, data: T): void {
            eventBus.emitCustom(event, data);
        },

        /**
         * Subscribe to plugin lifecycle events
         */
        onPluginLoaded(handler: (data: { name: string; version: string }) => void): EventSubscription {
            return eventBus.onPlugin('plugin:loaded', handler);
        },

        onPluginUnloaded(handler: (data: { name: string }) => void): EventSubscription {
            return eventBus.onPlugin('plugin:unloaded', handler);
        },
    };
}

/**
 * Plugin definition options for definePlugin helper
 */
export interface PluginDefinition {
    /** Plugin metadata */
    metadata: {
        name: string;
        version: string;
        author?: string;
        description?: string;
    };

    /** Register REST API routes */
    routes?: (router: PluginRouter, ctx: import('../types/plugin.types.js').PluginContext) => void;

    /** Setup event subscriptions */
    events?: (
        helpers: ReturnType<typeof createEventHelpers>,
        ctx: import('../types/plugin.types.js').PluginContext
    ) => EventSubscription[];

    /** Called when plugin is loaded */
    onLoad?: (ctx: import('../types/plugin.types.js').PluginContext) => void | Promise<void>;

    /** Called when plugin is unloaded */
    onUnload?: () => void | Promise<void>;

    /** Called for every Discord event (legacy support) */
    onEvent?: (eventName: string, data: unknown) => void | Promise<void>;
}

/**
 * Define a plugin with enhanced type safety and features.
 * 
 * This is the recommended way to create HoloBridge plugins.
 * 
 * @example
 * ```typescript
 * export default definePlugin({
 *     metadata: { name: 'my-plugin', version: '1.0.0' },
 *     
 *     routes: (router) => {
 *         router.get('/hello', (req, res) => {
 *             res.json({ message: 'Hello from my plugin!' });
 *         });
 *     },
 *     
 *     events: (on) => [
 *         on.onDiscord('messageCreate', (msg) => {
 *             console.log('New message:', msg.content);
 *         }),
 *         on.onCustom('other-plugin:event', (data) => {
 *             console.log('Received:', data);
 *         }),
 *     ],
 *     
 *     onLoad: (ctx) => {
 *         ctx.logger.info('Plugin loaded!');
 *     },
 * });
 * ```
 */
export function definePlugin(definition: PluginDefinition): PluginDefinition {
    // Validate required fields
    if (!definition.metadata?.name || !definition.metadata?.version) {
        throw new Error('Plugin must have metadata with name and version');
    }

    return definition;
}

/**
 * Standard API response format for plugin endpoints
 */
export interface PluginApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    code?: string;
}

/**
 * Create a successful API response
 */
export function success<T>(data: T): PluginApiResponse<T> {
    return { success: true, data };
}

/**
 * Create an error API response
 */
export function error(message: string, code?: string): PluginApiResponse<never> {
    return { success: false, error: message, code };
}

/**
 * Validate request body against required fields
 */
export function validateBody<T extends Record<string, unknown>>(
    body: unknown,
    requiredFields: (keyof T)[]
): body is T {
    if (typeof body !== 'object' || body === null) {
        return false;
    }
    const obj = body as Record<string, unknown>;
    return requiredFields.every((field) => field in obj);
}
