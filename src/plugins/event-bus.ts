import { EventEmitter } from 'events';
import type { DiscordEventType } from '../types/events.types.js';

/**
 * Event categories for the plugin event bus
 */
export type PluginEventCategory = 'discord' | 'plugin' | 'custom';

/**
 * Plugin lifecycle events
 */
export interface PluginLifecycleEvents {
    'plugin:loaded': { name: string; version: string };
    'plugin:unloaded': { name: string };
    'plugin:error': { name: string; error: Error };
}

/**
 * Custom event payload - plugins can emit any data
 */
export type CustomEventPayload = Record<string, unknown>;

/**
 * Event subscription returned when subscribing to events
 */
export interface EventSubscription {
    unsubscribe: () => void;
    eventName: string;
}

/**
 * Typed event bus for inter-plugin communication.
 * 
 * Provides three categories of events:
 * - `discord:*` - Discord events forwarded from the gateway
 * - `plugin:*` - Plugin lifecycle events (loaded, unloaded, error)
 * - `custom:*` - Custom events emitted by plugins
 * 
 * @example
 * ```typescript
 * // Subscribe to Discord events
 * eventBus.on('discord:messageCreate', (data) => {
 *     console.log('New message:', data.content);
 * });
 * 
 * // Emit custom events
 * eventBus.emit('custom:user-warned', { userId: '123', reason: 'spam' });
 * 
 * // Subscribe to custom events from other plugins
 * eventBus.on('custom:user-warned', (data) => {
 *     console.log(`User ${data.userId} was warned for ${data.reason}`);
 * });
 * ```
 */
export class PluginEventBus extends EventEmitter {
    private subscriptions: Map<string, Set<(...args: unknown[]) => void>> = new Map();
    private debugMode: boolean = false;

    constructor(debug: boolean = false) {
        super();
        this.debugMode = debug;
        // Increase max listeners to avoid warnings with many plugins
        this.setMaxListeners(100);
    }

    /**
     * Enable or disable debug logging
     */
    setDebug(enabled: boolean): void {
        this.debugMode = enabled;
    }

    /**
     * Emit a Discord event to all subscribed plugins
     */
    emitDiscord<T = unknown>(eventName: DiscordEventType, data: T): boolean {
        const fullEventName = `discord:${eventName}`;
        if (this.debugMode) {
            console.log(`[EventBus] Discord event: ${fullEventName}`);
        }
        return this.emit(fullEventName, data);
    }

    /**
     * Emit a plugin lifecycle event
     */
    emitPlugin<K extends keyof PluginLifecycleEvents>(
        eventName: K,
        data: PluginLifecycleEvents[K]
    ): boolean {
        if (this.debugMode) {
            console.log(`[EventBus] Plugin event: ${eventName}`, data);
        }
        return this.emit(eventName, data);
    }

    /**
     * Emit a custom event that other plugins can listen to
     */
    emitCustom<T extends CustomEventPayload>(eventName: string, data: T): boolean {
        const fullEventName = eventName.startsWith('custom:') ? eventName : `custom:${eventName}`;
        if (this.debugMode) {
            console.log(`[EventBus] Custom event: ${fullEventName}`);
        }
        return this.emit(fullEventName, data);
    }

    /**
     * Subscribe to a Discord event
     */
    onDiscord<T = unknown>(
        eventName: DiscordEventType,
        listener: (data: T) => void
    ): EventSubscription {
        const fullEventName = `discord:${eventName}`;
        return this.subscribe(fullEventName, listener as (...args: unknown[]) => void);
    }

    /**
     * Subscribe to a plugin lifecycle event
     */
    onPlugin<K extends keyof PluginLifecycleEvents>(
        eventName: K,
        listener: (data: PluginLifecycleEvents[K]) => void
    ): EventSubscription {
        return this.subscribe(eventName, listener as (...args: unknown[]) => void);
    }

    /**
     * Subscribe to a custom event
     */
    onCustom<T extends CustomEventPayload>(
        eventName: string,
        listener: (data: T) => void
    ): EventSubscription {
        const fullEventName = eventName.startsWith('custom:') ? eventName : `custom:${eventName}`;
        return this.subscribe(fullEventName, listener as (...args: unknown[]) => void);
    }

    /**
     * Subscribe to any event and return a subscription object
     */
    subscribe(eventName: string, listener: (...args: unknown[]) => void): EventSubscription {
        this.on(eventName, listener);

        // Track subscription for cleanup
        if (!this.subscriptions.has(eventName)) {
            this.subscriptions.set(eventName, new Set());
        }
        this.subscriptions.get(eventName)!.add(listener);

        return {
            eventName,
            unsubscribe: () => {
                this.off(eventName, listener);
                this.subscriptions.get(eventName)?.delete(listener);
            },
        };
    }

    /**
     * Subscribe to an event once
     */
    subscribeOnce(eventName: string, listener: (...args: unknown[]) => void): EventSubscription {
        const wrappedListener = (...args: unknown[]) => {
            this.subscriptions.get(eventName)?.delete(wrappedListener);
            listener(...args);
        };

        this.once(eventName, wrappedListener);

        if (!this.subscriptions.has(eventName)) {
            this.subscriptions.set(eventName, new Set());
        }
        this.subscriptions.get(eventName)!.add(wrappedListener);

        return {
            eventName,
            unsubscribe: () => {
                this.off(eventName, wrappedListener);
                this.subscriptions.get(eventName)?.delete(wrappedListener);
            },
        };
    }

    /**
     * Unsubscribe all listeners for a specific plugin
     * Called when a plugin is unloaded
     */
    unsubscribeAll(subscriptions: EventSubscription[]): void {
        for (const sub of subscriptions) {
            sub.unsubscribe();
        }
    }

    /**
     * Get count of listeners for debugging
     */
    getListenerCounts(): Record<string, number> {
        const counts: Record<string, number> = {};
        for (const [eventName, listeners] of this.subscriptions) {
            counts[eventName] = listeners.size;
        }
        return counts;
    }
}

// Singleton instance
export const pluginEventBus = new PluginEventBus();
