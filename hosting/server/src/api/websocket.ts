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
 * Create and configure a Socket.IO server attached to the given HTTP server.
 *
 * Configures connection authentication, per-socket data, connection and disconnect handlers, and starts instance status polling.
 *
 * @param httpServer - The HTTP server to attach the WebSocket server to
 * @returns The initialized Socket.IO Server instance
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
 * Process a client event to manage this socket's instance-status and log subscriptions.
 *
 * Only permits subscribing to the instance bound to the socket's authenticated `instanceId`.
 *
 * @param socket - The client's Socket.IO socket (expects `socket.data.instanceId` to be set)
 * @param event - The client event instructing subscribe/unsubscribe actions for instance status or logs
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
 * Ensure the given socket ID is recorded as subscribed to the specified instance.
 *
 * Adds `socketId` to the set of subscribers for `instanceId` within `map`, creating the set if it does not exist.
 *
 * @param map - Mapping from instance IDs to sets of subscribed socket IDs
 * @param instanceId - The instance ID whose subscription set will be updated
 * @param socketId - The socket ID to add to the subscription set
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
 * Remove a socket ID subscription for a specific instance and remove the instance entry if no subscribers remain.
 *
 * @param map - Map from instance ID to a set of subscribed socket IDs
 * @param instanceId - The instance ID whose subscription should be removed
 * @param socketId - The socket ID to remove from the instance's subscription set
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
 * Remove a socket from all instance and log subscription sets.
 *
 * @param socketId - The socket ID to remove from every subscription mapping
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
 * Emit a server event to all sockets subscribed to a given instance.
 *
 * @param map - Map from instance ID to the set of subscribed socket IDs
 * @param instanceId - The instance ID whose subscribers should receive the event
 * @param event - The server event to emit to each subscriber
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
 * Broadcasts an instance status update to all sockets subscribed to the given instance.
 *
 * @param instanceId - The instance identifier whose subscribers will receive the status update
 * @param status - One of: `'running'`, `'stopped'`, `'starting'`, `'stopping'`, or `'error'`
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
 * Broadcasts CPU and memory usage for an instance to all subscribers of that instance.
 *
 * @param instanceId - The ID of the instance whose stats are being broadcast
 * @param cpu - The instance CPU usage value
 * @param memory - The instance memory usage value
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
 * Periodically polls Docker for status and resource usage of currently subscribed instances and broadcasts updates.
 *
 * Polls only instanceIds that have active subscriptions, runs every 5 seconds, emits instance status events and, when a container is running, emits CPU and memory stats. Errors encountered during polling are logged to the console.
 */
function startStatusPolling(): void {
    setInterval(async () => {
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
    }, 5000); // Poll every 5 seconds
}

/**
 * Stream a container's logs to a connected client's socket for the specified instance.
 *
 * Streams recent and live log lines from the container that matches `instanceId` and emits them to `socket` as messages of type `instance.logs`. If no container is found a single message with `[Container not found]` is emitted. The stream stops automatically if the socket unsubscribes from the instance; when the stream ends or errors, a corresponding line (`[Log stream ended]` or `[Error: <message>]`) is emitted.
 *
 * @param instanceId - The instance identifier whose container logs should be streamed
 * @param socket - The client's Socket.IO socket that will receive log messages
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