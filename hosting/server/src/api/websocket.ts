/**
 * HoloBridge Hosting Server - WebSocket Handler
 * 
 * Real-time updates for instance status and logs.
 */

import type { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifySecurityCode } from '../auth/supabase.js';
import * as docker from '../orchestrator/docker.js';
import type { ServerEvent, ClientEvent } from '../../../shared/src/types.js';

let io: Server | null = null;

// Track subscriptions
const instanceSubscriptions = new Map<string, Set<string>>(); // instanceId -> Set<socketId>
const logSubscriptions = new Map<string, Set<string>>(); // instanceId -> Set<socketId>

/**
 * Initialize WebSocket server
 */
export function initWebSocket(httpServer: HttpServer): Server {
    io = new Server(httpServer, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
        },
    });

    io.use(async (socket, next) => {
        const securityCode = socket.handshake.auth['securityCode'] as string | undefined;

        if (!securityCode) {
            return next(new Error('Security code required'));
        }

        const result = await verifySecurityCode(securityCode);
        if (!result) {
            return next(new Error('Invalid security code'));
        }

        // Attach auth info to socket
        socket.data['userId'] = result.userId;
        socket.data['instanceId'] = result.instanceId;

        next();
    });

    io.on('connection', (socket: Socket) => {
        console.log(`WebSocket connected: ${socket.id}`);

        socket.on('message', (event: ClientEvent) => {
            handleClientEvent(socket, event);
        });

        socket.on('disconnect', () => {
            console.log(`WebSocket disconnected: ${socket.id}`);
            cleanupSubscriptions(socket.id);
        });
    });

    // Start status polling
    startStatusPolling();

    return io;
}

/**
 * Handle client events
 */
function handleClientEvent(socket: Socket, event: ClientEvent): void {
    const userInstanceId = socket.data['instanceId'] as string;

    switch (event.type) {
        case 'subscribe.instance':
            // Only allow subscribing to own instance
            if (event.instanceId === userInstanceId) {
                addSubscription(instanceSubscriptions, event.instanceId, socket.id);
            }
            break;

        case 'unsubscribe.instance':
            removeSubscription(instanceSubscriptions, event.instanceId, socket.id);
            break;

        case 'subscribe.logs':
            if (event.instanceId === userInstanceId) {
                addSubscription(logSubscriptions, event.instanceId, socket.id);
                startLogStreaming(event.instanceId, socket);
            }
            break;

        case 'unsubscribe.logs':
            removeSubscription(logSubscriptions, event.instanceId, socket.id);
            break;
    }
}

/**
 * Add a subscription
 */
function addSubscription(
    map: Map<string, Set<string>>,
    instanceId: string,
    socketId: string
): void {
    if (!map.has(instanceId)) {
        map.set(instanceId, new Set());
    }
    map.get(instanceId)!.add(socketId);
}

/**
 * Remove a subscription
 */
function removeSubscription(
    map: Map<string, Set<string>>,
    instanceId: string,
    socketId: string
): void {
    const sockets = map.get(instanceId);
    if (sockets) {
        sockets.delete(socketId);
        if (sockets.size === 0) {
            map.delete(instanceId);
        }
    }
}

/**
 * Clean up all subscriptions for a socket
 */
function cleanupSubscriptions(socketId: string): void {
    for (const sockets of instanceSubscriptions.values()) {
        sockets.delete(socketId);
    }
    for (const sockets of logSubscriptions.values()) {
        sockets.delete(socketId);
    }
}

/**
 * Emit an event to subscribed sockets
 */
function emitToSubscribers(
    map: Map<string, Set<string>>,
    instanceId: string,
    event: ServerEvent
): void {
    const sockets = map.get(instanceId);
    if (!sockets || !io) return;

    for (const socketId of sockets) {
        io.to(socketId).emit('message', event);
    }
}

/**
 * Broadcast instance status update
 */
export function broadcastInstanceStatus(instanceId: string, status: string): void {
    emitToSubscribers(instanceSubscriptions, instanceId, {
        type: 'instance.status',
        data: {
            instanceId,
            status: status as 'running' | 'stopped' | 'starting' | 'stopping' | 'error'
        },
    });
}

/**
 * Broadcast instance stats update
 */
export function broadcastInstanceStats(
    instanceId: string,
    cpu: number,
    memory: number
): void {
    emitToSubscribers(instanceSubscriptions, instanceId, {
        type: 'instance.stats',
        data: { instanceId, cpu, memory },
    });
}

/**
 * Start polling for instance status updates
 */
function startStatusPolling(): void {
let statusPollInterval: NodeJS.Timeout | null = null;

function startStatusPolling(): void {
    statusPollInterval = setInterval(async () => {
        for (const instanceId of instanceSubscriptions.keys()) {
            try {
                // Get container info (would need to look up containerId from instanceId)
                const containers = await docker.listContainers();
                const container = containers.find(c =>
                    c.name.includes(instanceId.slice(0, 12))
                );

                if (container) {
                    broadcastInstanceStatus(instanceId, container.state);

                    if (container.state === 'running') {
                        const stats = await docker.getContainerStats(container.id);
                        if (stats) {
                            broadcastInstanceStats(instanceId, stats.cpu, stats.memory);
                        }
                    }
                }
            } catch (error) {
                console.error(`Error polling status for ${instanceId}:`, error);
            }
        }
    }, 5000);
}

// Add cleanup function
export function cleanup(): void {
    if (statusPollInterval) {
        clearInterval(statusPollInterval);
    }
}
}

/**
 * Start streaming logs for an instance
 */
async function startLogStreaming(instanceId: string, socket: Socket): Promise<void> {
    try {
        // Would need to look up containerId from instanceId
        const containers = await docker.listContainers();
        const container = containers.find(c =>
            c.name.includes(instanceId.slice(0, 12))
        );

        if (!container) {
            socket.emit('message', {
                type: 'instance.logs',
                data: { instanceId, line: '[Container not found]' },
            });
            return;
        }

        const logStream = await docker.getContainerLogs(container.id, {
            tail: 50,
            follow: true
        });

        logStream.on('data', (chunk: Buffer) => {
            // Check if socket is still subscribed
            const sockets = logSubscriptions.get(instanceId);
            if (!sockets?.has(socket.id)) {
                logStream.destroy();
                return;
            }

            socket.emit('message', {
                type: 'instance.logs',
                data: { instanceId, line: chunk.toString('utf8') },
            });
        });

        logStream.on('end', () => {
            socket.emit('message', {
                type: 'instance.logs',
                data: { instanceId, line: '[Log stream ended]' },
            });
        });

        logStream.on('error', (error: Error) => {
            socket.emit('message', {
                type: 'instance.logs',
                data: { instanceId, line: `[Error: ${error.message}]` },
            });
        });
    } catch (error) {
        console.error(`Error streaming logs for ${instanceId}:`, error);
    }
}
