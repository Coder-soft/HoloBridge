/**
 * HoloBridge Hosting Server - Docker Orchestrator
 * 
 * Manages Docker containers for HoloBridge instances.
 */

import Docker from 'dockerode';
import { Readable } from 'stream';
import { config } from '../config.js';
import {
    CONTAINER_NAME_PREFIX,
    DOCKER_NETWORK_NAME,
    DEFAULT_INSTANCE_PORT_RANGE
} from '../../../shared/src/constants.js';

// Initialize Docker client
const docker = new Docker({ socketPath: config.docker.socketPath });

// Track allocated ports
const allocatedPorts = new Set<number>();

/**
 * Container creation options
 */
export interface ContainerCreateOptions {
    instanceId: string;
    name: string;
    discordToken: string;
    apiKey: string;
    port?: number;
    env?: Record<string, string>;
}

/**
 * Container status information
 */
export interface ContainerStatus {
    id: string;
    name: string;
    state: 'running' | 'exited' | 'paused' | 'restarting' | 'dead' | 'created';
    health?: 'healthy' | 'unhealthy' | 'starting' | 'none';
    port: number | null;
    startedAt?: Date;
    cpu?: number;
    memory?: number;
}

/**
 * Ensure the HoloBridge network exists
 */
async function ensureNetwork(): Promise<void> {
    const networks = await docker.listNetworks({
        filters: { name: [DOCKER_NETWORK_NAME] },
    });

    if (networks.length === 0) {
        await docker.createNetwork({
            Name: DOCKER_NETWORK_NAME,
            Driver: 'bridge',
            Internal: false,
        });
        console.log(`Created Docker network: ${DOCKER_NETWORK_NAME}`);
    }
}

/**
 * Selects an unused host port from the configured instance port range.
 *
 * Scans current containers that match the instance name prefix to refresh the internal allocation set, then returns the first port within DEFAULT_INSTANCE_PORT_RANGE that is not already allocated and marks it allocated.
 *
 * @returns A host port number reserved for a new container
 * @throws Error if no available ports exist in the configured range
 */
async function findAvailablePort(): Promise<number> {
    // Refresh allocated ports from running containers
    const containers = await docker.listContainers({
        all: true,
        filters: { name: [CONTAINER_NAME_PREFIX] },
    });

    allocatedPorts.clear();
    for (const container of containers) {
        const ports = container.Ports;
        for (const port of ports) {
            if (port.PublicPort) {
                allocatedPorts.add(port.PublicPort);
            }
        }
    }

    // Find first available port in range
    for (let port = DEFAULT_INSTANCE_PORT_RANGE.start; port <= DEFAULT_INSTANCE_PORT_RANGE.end; port++) {
        if (!allocatedPorts.has(port)) {
            allocatedPorts.add(port);
            return port;
        }
    }

    throw new Error('No available ports in configured range');
}

/**
 * Create a new Docker container configured for a HoloBridge instance.
 *
 * Creates a container using the configured image with environment variables (including `DISCORD_TOKEN` and `API_KEY`), exposes container port 3000 mapped to a host port, applies labels, resource limits, and a healthcheck.
 *
 * @param options - Configuration for the container (instanceId, name, discordToken, apiKey, optional `port` and `env`).
 * @returns The created container's ID and the host port mapped to container port 3000.
 */
export async function createContainer(options: ContainerCreateOptions): Promise<{ containerId: string; port: number }> {
    await ensureNetwork();

    const port = options.port ?? await findAvailablePort();
    const containerName = `${CONTAINER_NAME_PREFIX}${options.instanceId}`;

    // Build environment variables
    const env = [
        `DISCORD_TOKEN=${options.discordToken}`,
        `API_KEY=${options.apiKey}`,
        `PORT=3000`,
        ...Object.entries(options.env ?? {}).map(([k, v]) => `${k}=${v}`),
    ];

    // Create container
    const container = await docker.createContainer({
        Image: config.docker.image,
        name: containerName,
        Env: env,
        ExposedPorts: {
            '3000/tcp': {},
        },
        HostConfig: {
            PortBindings: {
                '3000/tcp': [{ HostPort: port.toString() }],
            },
            NetworkMode: DOCKER_NETWORK_NAME,
            RestartPolicy: {
                Name: 'unless-stopped',
            },
            // Resource limits
            Memory: 256 * 1024 * 1024, // 256MB
            MemorySwap: 512 * 1024 * 1024, // 512MB
            CpuQuota: 50000, // 50% of one CPU
        },
        Labels: {
            'holobridge.instance': options.instanceId,
            'holobridge.name': options.name,
        },
        Healthcheck: {
            Test: ['CMD', 'wget', '--no-verbose', '--tries=1', '--spider', 'http://localhost:3000/health'],
            Interval: 30 * 1e9, // 30 seconds in nanoseconds
            Timeout: 10 * 1e9,
            Retries: 3,
            StartPeriod: 10 * 1e9,
        },
    });

    return {
        containerId: container.id,
        port,
    };
}

/**
 * Start a container
 */
export async function startContainer(containerId: string): Promise<void> {
    const container = docker.getContainer(containerId);
    await container.start();
}

/**
 * Stop a container
 */
export async function stopContainer(containerId: string): Promise<void> {
    const container = docker.getContainer(containerId);
    await container.stop({ t: 10 }); // 10 second timeout
}

/**
 * Restart the Docker container identified by `containerId`.
 *
 * @param containerId - The Docker container ID to restart
 */
export async function restartContainer(containerId: string): Promise<void> {
    const container = docker.getContainer(containerId);
    await container.restart({ t: 10 });
}

/**
 * Remove a Docker container and forcefully delete it.
 *
 * Attempts to stop the container with a 5-second timeout (errors while stopping are ignored),
 * then removes the container using a forced removal.
 *
 * @param containerId - The Docker container ID to remove
 */
export async function removeContainer(containerId: string): Promise<void> {
    const container = docker.getContainer(containerId);

    // Try to stop if running
    try {
        await container.stop({ t: 5 });
    } catch {
        // Ignore if already stopped
    }

    await container.remove({ force: true });
}

/**
 * Retrieve the current status and metadata for a container.
 *
 * @returns A `ContainerStatus` object containing `id`, `name`, `state`, optional `health`, `port`, and optional `startedAt` when available; `null` if the container cannot be inspected.
 */
export async function getContainerStatus(containerId: string): Promise<ContainerStatus | null> {
    try {
        const container = docker.getContainer(containerId);
        const info = await container.inspect();

        // Get port from port bindings
        let port: number | null = null;
        const portBindings = info.HostConfig?.PortBindings?.['3000/tcp'];
        if (portBindings && portBindings.length > 0) {
            port = parseInt(portBindings[0].HostPort ?? '0', 10) || null;
        }

        return {
            id: info.Id,
            name: info.Name.replace(/^\//, ''),
            state: info.State?.Status as ContainerStatus['state'] ?? 'created',
            health: info.State?.Health?.Status as ContainerStatus['health'],
            port,
            startedAt: info.State?.StartedAt ? new Date(info.State.StartedAt) : undefined,
        };
    } catch {
        return null;
    }
}

/**
 * Return a readable stream of a container's logs.
 *
 * The stream contains both stdout and stderr with timestamps. When `options.follow`
 * is `true` the stream follows live logs; when `false` the stream contains the
 * last `options.tail` lines and then ends.
 *
 * @param containerId - Docker container ID
 * @param options - Log retrieval options
 * @param options.tail - Number of lines to include when not following (default: 100)
 * @param options.follow - Whether to follow logs in real time (default: false)
 * @returns A Readable stream that yields the requested log output
 */
export async function getContainerLogs(
    containerId: string,
    options: { tail?: number; follow?: boolean } = {}
): Promise<Readable> {
    const container = docker.getContainer(containerId);

    const logStream = await container.logs({
        stdout: true,
        stderr: true,
        tail: options.tail ?? 100,
        follow: options.follow ?? false,
        timestamps: true,
    } as any) as any;

    // Docker logs come with a multiplexed stream, convert to readable
    if (logStream && (logStream as any).on) {
        return logStream as Readable;
    }

    // If it's a string (non-follow mode), wrap in readable
    const readable = new Readable({
        read() {
            this.push(logStream as unknown as string);
            this.push(null);
        },
    });

    return readable;
}

/**
 * Retrieve CPU and memory usage for a Docker container.
 *
 * @param containerId - The Docker container ID or name to query.
 * @returns An object with `cpu` (CPU usage percentage, rounded to two decimals) and `memory` (memory usage in megabytes, rounded to two decimals), or `null` if statistics cannot be retrieved.
 */
export async function getContainerStats(containerId: string): Promise<{ cpu: number; memory: number } | null> {
    try {
        const container = docker.getContainer(containerId);
        const stats = await container.stats({ stream: false });

        // Calculate CPU percentage
        const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
        const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
        const cpuCount = stats.cpu_stats.online_cpus || 1;
        const cpuPercent = (cpuDelta / systemDelta) * cpuCount * 100;

        // Memory in MB
        const memoryUsage = stats.memory_stats.usage / (1024 * 1024);

        return {
            cpu: Math.round(cpuPercent * 100) / 100,
            memory: Math.round(memoryUsage * 100) / 100,
        };
    } catch {
        return null;
    }
}

/**
 * Retrieve a summary list of HoloBridge-managed containers.
 *
 * @returns An array of `ContainerStatus` objects for containers matching the HoloBridge name prefix; each entry includes id, name, state, and the host port mapped to container port 3000 (or `null` if not mapped).
 */
export async function listContainers(): Promise<ContainerStatus[]> {
    const containers = await docker.listContainers({
        all: true,
        filters: { name: [CONTAINER_NAME_PREFIX] },
    });

    return containers.map((c) => ({
        id: c.Id,
        name: c.Names[0]?.replace(/^\//, '') ?? '',
        state: c.State as ContainerStatus['state'],
        port: c.Ports.find((p) => p.PrivatePort === 3000)?.PublicPort ?? null,
    }));
}

/**
 * Verifies connectivity to the Docker daemon.
 *
 * @returns `true` if the Docker daemon responds to a ping, `false` otherwise.
 */
export async function checkDockerHealth(): Promise<boolean> {
    try {
        await docker.ping();
        return true;
    } catch {
        return false;
    }
}