/**
 * HoloBridge Hosting Server - Instance Manager
 * 
 * Business logic for managing HoloBridge instances.
 */

import { randomBytes, createCipheriv, createDecipheriv, createHash } from 'crypto';
import { supabase, logAudit, type Database } from '../auth/supabase.js';
import * as docker from './docker.js';
import {
    SECURITY_CODE_LENGTH,
    API_KEY_LENGTH,
    API_KEY_PREFIX,
    DEFAULT_INSTANCE_CONFIG
} from '../../../shared/src/constants.js';
import type { Instance, InstanceConfig, CreateInstanceRequest, InstanceStatus } from '../../../shared/src/types.js';
import { config } from '../config.js';

// Encryption helpers
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

/**
 * Derives a 256-bit encryption key from the configured security encryption key.
 *
 * @returns A 32-byte Buffer containing the derived AES-256 key.
 */
function getEncryptionKey(): Buffer {
    return createHash('sha256').update(config.security.encryptionKey).digest();
}

/**
 * Encrypts a UTF-8 string using AES-256-GCM and returns a single hex-encoded payload.
 *
 * @param text - The plaintext to encrypt.
 * @returns A string formatted as `iv:tag:encrypted` where each segment is hex-encoded (IV and auth tag are 16 bytes). */
function encrypt(text: string): string {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, getEncryptionKey(), iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag();

    // Format: iv:tag:encrypted
    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts a hex-encoded AES-256-GCM payload in the format `iv:tag:encrypted`.
 *
 * @param encryptedText - The encrypted payload as three colon-separated hex parts: initialization vector, auth tag, and ciphertext.
 * @returns The decrypted UTF-8 plaintext string.
 * @throws Error if `encryptedText` does not contain exactly three colon-separated parts.
 */
function decrypt(encryptedText: string): string {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
        throw new Error('Invalid encrypted format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const tag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    const decipher = createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}

/**
 * Create a cryptographically secure random alphanumeric token.
 *
 * @param length - Number of random alphanumeric characters to generate (does not include `prefix`)
 * @param prefix - Optional string to prepend to the generated token
 * @returns The generated token: `prefix` (if provided) followed by `length` random alphanumeric characters
 */
function generateSecureToken(length: number, prefix?: string): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const bytes = randomBytes(length);
    let result = prefix ?? '';

    for (let i = 0; i < length; i++) {
        result += chars.charAt(bytes[i] % chars.length);
    }

    return result;
}

/**
 * Create a new HoloBridge instance for a user with the provided name, Discord token, and configuration.
 *
 * @param userId - ID of the user who will own the instance
 * @param request - Instance creation payload (must include `name`, `discordToken`, and optional `config` overrides)
 * @returns The created Instance including its `id`, `userId`, `securityCode`, `name`, `containerId`, `status`, `port`, `config`, `createdAt`, and `updatedAt`
 * @throws Error - If the instance cannot be created (for example, database insert failure)
 */
export async function createInstance(
    userId: string,
    request: CreateInstanceRequest
): Promise<Instance> {
    // Generate security code and API key
    const securityCode = generateSecureToken(SECURITY_CODE_LENGTH);
    const apiKey = generateSecureToken(API_KEY_LENGTH, API_KEY_PREFIX);

    // Encrypt the Discord token
    const discordTokenEncrypted = encrypt(request.discordToken);

    // Merge with default config
    const instanceConfig: InstanceConfig = {
        ...DEFAULT_INSTANCE_CONFIG,
        ...request.config,
    };

    // Create the container
    const containerResult = await docker.createContainer({
        instanceId: securityCode.slice(0, 12), // Use part of security code as container suffix
        name: request.name,
        discordToken: request.discordToken,
        apiKey: apiKey,
        env: {
            DEBUG: instanceConfig.debug ? 'true' : 'false',
            PLUGINS_ENABLED: instanceConfig.pluginsEnabled ? 'true' : 'false',
            RATE_LIMIT_ENABLED: instanceConfig.rateLimitEnabled ? 'true' : 'false',
            RATE_LIMIT_MAX: String(instanceConfig.rateLimitMax ?? 100),
        },
    });

    // Insert into database
    const { data, error } = await supabase
        .from('instances')
        .insert({
            user_id: userId,
            security_code: securityCode,
            name: request.name,
            container_id: containerResult.containerId,
            status: 'stopped',
            port: containerResult.port,
            discord_token_encrypted: discordTokenEncrypted,
            config: instanceConfig as Record<string, unknown>,
        })
        .select()
        .select()
        .single();

    const row = data as Database['public']['Tables']['instances']['Row'] | null;

    if (error || !row) {
        // Cleanup container if database insert fails
        try {
            await docker.removeContainer(containerResult.containerId);
        } catch {
            // Ignore cleanup errors
        }
        throw new Error(`Failed to create instance: ${error?.message}`);
    }

    // Log the action
    await logAudit(userId, row.id, 'instance.create', { name: request.name });

    return {
        id: row.id,
        userId: row.user_id,
        securityCode: row.security_code,
        name: row.name,
        containerId: row.container_id,
        status: row.status as InstanceStatus,
        port: row.port,
        config: row.config as InstanceConfig,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
    };
}

/**
 * Retrieve an instance record by its ID.
 *
 * @returns The `Instance` mapped from the database row (with `createdAt` and `updatedAt` as `Date`), or `null` if the instance is not found or a query error occurs.
 */
export async function getInstance(instanceId: string): Promise<Instance | null> {
    const { data, error } = await supabase
        .from('instances')
        .select()
        .eq('id', instanceId)
        .single();

    const row = data as Database['public']['Tables']['instances']['Row'] | null;

    if (error || !row) {
        return null;
    }

    return {
        id: row.id,
        userId: row.user_id,
        securityCode: row.security_code,
        name: row.name,
        containerId: row.container_id,
        status: row.status as InstanceStatus,
        port: row.port,
        config: row.config as InstanceConfig,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
    };
}

/**
 * Retrieve all instances owned by a specific user, ordered by creation time (newest first).
 *
 * @param userId - The ID of the user whose instances should be returned
 * @returns An array of Instance objects for the user; returns an empty array if none are found or on query error
 */
export async function listInstances(userId: string): Promise<Instance[]> {
    const { data, error } = await supabase
        .from('instances')
        .select()
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error || !data) {
        return [];
    }

    return data.map((row: Database['public']['Tables']['instances']['Row']) => ({
        id: row.id,
        userId: row.user_id,
        securityCode: row.security_code,
        name: row.name,
        containerId: row.container_id,
        status: row.status as InstanceStatus,
        port: row.port,
        config: row.config as InstanceConfig,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
    }));
}

/**
 * Initiates startup of an instance's container, updates the instance status in the database, and records an audit event.
 *
 * @param instanceId - The identifier of the instance to start
 * @param userId - The identifier of the user performing the action; recorded in the audit log
 * @throws Error - If the instance does not exist or has no associated container (message: 'Instance not found')
 * @throws Error - Rethrows errors from Docker or database operations encountered while starting the container or updating status
 */
export async function startInstance(instanceId: string, userId: string): Promise<void> {
    const instance = await getInstance(instanceId);
    if (!instance || !instance.containerId) {
        throw new Error('Instance not found');
    }

    // Update status to starting
    await supabase
        .from('instances')
        .update({ status: 'starting', updated_at: new Date().toISOString() })
        .eq('id', instanceId);

    try {
        await docker.startContainer(instance.containerId);

        // Update status to running
        await supabase
            .from('instances')
            .update({ status: 'running', updated_at: new Date().toISOString() })
            .eq('id', instanceId);

        await logAudit(userId, instanceId, 'instance.start');
    } catch (error) {
        // Update status to error
        await supabase
            .from('instances')
            .update({ status: 'error', updated_at: new Date().toISOString() })
            .eq('id', instanceId);
        throw error;
    }
}

/**
 * Stop a running instance's container and update the instance status in the database.
 *
 * The instance's status is set to `stopping` before the stop action, then to `stopped`
 * on success or to `error` if stopping fails. An audit event of type `instance.stop`
 * is recorded on successful stop.
 *
 * @throws Error - If the instance does not exist or has no associated container (`"Instance not found"`).
 * @throws Error - Re-throws any error encountered while stopping the container after setting status to `error`.
 */
export async function stopInstance(instanceId: string, userId: string): Promise<void> {
    const instance = await getInstance(instanceId);
    if (!instance || !instance.containerId) {
        throw new Error('Instance not found');
    }

    // Update status to stopping
    await supabase
        .from('instances')
        .update({ status: 'stopping', updated_at: new Date().toISOString() })
        .eq('id', instanceId);

    try {
        await docker.stopContainer(instance.containerId);

        // Update status to stopped
        await supabase
            .from('instances')
            .update({ status: 'stopped', updated_at: new Date().toISOString() })
            .eq('id', instanceId);

        await logAudit(userId, instanceId, 'instance.stop');
    } catch (error) {
        await supabase
            .from('instances')
            .update({ status: 'error', updated_at: new Date().toISOString() })
            .eq('id', instanceId);
        throw error;
    }
}

/**
 * Restarts the instance's Docker container, updates the instance status to `running` in the database, and records an audit event.
 *
 * @param instanceId - ID of the instance to restart
 * @param userId - ID of the user performing the action (used for audit)
 * @throws Error - if the instance does not exist or has no associated container
 */
export async function restartInstance(instanceId: string, userId: string): Promise<void> {
    const instance = await getInstance(instanceId);
    if (!instance || !instance.containerId) {
        throw new Error('Instance not found');
    }

    await docker.restartContainer(instance.containerId);

    await supabase
        .from('instances')
        .update({ status: 'running', updated_at: new Date().toISOString() })
        .eq('id', instanceId);

    await logAudit(userId, instanceId, 'instance.restart');
}

/**
 * Deletes an instance and its associated container and database record.
 *
 * Removes the container if present, deletes the instance row (cascading related resources), and records an audit event.
 *
 * @param instanceId - The ID of the instance to delete.
 * @param userId - The ID of the user performing the deletion (used for audit logging).
 * @throws Error if the instance does not exist.
 */
export async function deleteInstance(instanceId: string, userId: string): Promise<void> {
    const instance = await getInstance(instanceId);
    if (!instance) {
        throw new Error('Instance not found');
    }

    // Remove container if exists
    if (instance.containerId) {
        try {
            await docker.removeContainer(instance.containerId);
        } catch {
            // Continue even if container removal fails
        }
    }

    // Delete from database (cascades to plugins and API keys)
    await supabase
        .from('instances')
        .delete()
        .eq('id', instanceId);

    await logAudit(userId, null, 'instance.delete', { instanceId, name: instance.name });
}

/**
 * Update an instance's name and/or configuration and return the updated instance.
 *
 * @param instanceId - The ID of the instance to update
 * @param userId - The ID of the user performing the update (used for audit logging)
 * @param updates - Partial updates: `name` replaces the instance name; `config` is merged into the existing configuration
 * @returns The updated `Instance`
 * @throws Error if the instance does not exist
 * @throws Error if the database update fails
 */
export async function updateInstanceConfig(
    instanceId: string,
    userId: string,
    updates: { name?: string; config?: Partial<InstanceConfig> }
): Promise<Instance> {
    const instance = await getInstance(instanceId);
    if (!instance) {
        throw new Error('Instance not found');
    }

    const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
    };

    if (updates.name) {
        updateData['name'] = updates.name;
    }

    if (updates.config) {
        updateData['config'] = { ...instance.config, ...updates.config };
    }

    const { data, error } = await supabase
        .from('instances')
        .update(updateData)
        .eq('id', instanceId)
        .select()
        .select()
        .single();

    const row = data as Database['public']['Tables']['instances']['Row'] | null;

    if (error || !row) {
        throw new Error(`Failed to update instance: ${error?.message}`);
    }

    await logAudit(userId, instanceId, 'instance.config.update', updates);

    return {
        id: row.id,
        userId: row.user_id,
        securityCode: row.security_code,
        name: row.name,
        containerId: row.container_id,
        status: row.status as InstanceStatus,
        port: row.port,
        config: row.config as InstanceConfig,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
    };
}

/**
 * Retrieve an instance along with its container status and runtime stats.
 *
 * @param instanceId - The ID of the instance to fetch
 * @returns An object containing:
 *  - `instance`: the requested Instance,
 *  - `containerStatus`: the container's current status, or `null` if the instance has no container,
 *  - `stats`: the container's runtime stats (`cpu` and `memory`) when the container is running, or `null` otherwise;
 * or `null` if no instance exists with the provided `instanceId`.
 */
export async function getInstanceWithStats(instanceId: string): Promise<{
    instance: Instance;
    containerStatus: docker.ContainerStatus | null;
    stats: { cpu: number; memory: number } | null;
} | null> {
    const instance = await getInstance(instanceId);
    if (!instance) {
        return null;
    }

    let containerStatus: docker.ContainerStatus | null = null;
    let stats: { cpu: number; memory: number } | null = null;

    if (instance.containerId) {
        containerStatus = await docker.getContainerStatus(instance.containerId);

        if (containerStatus?.state === 'running') {
            stats = await docker.getContainerStats(instance.containerId);
        }
    }

    return { instance, containerStatus, stats };
}