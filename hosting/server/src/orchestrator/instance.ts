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

function getEncryptionKey(): Buffer {
    return createHash('sha256').update(config.security.encryptionKey).digest();
}

function encrypt(text: string): string {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, getEncryptionKey(), iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag();

    // Format: iv:tag:encrypted
    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
}

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
 * Generate a cryptographically secure random string
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
 * Create a new HoloBridge instance
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
 * Get an instance by ID
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
 * List all instances for a user
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
 * Start an instance
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
 * Stop an instance
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
 * Restart an instance
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
 * Delete an instance
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
 * Update instance configuration
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
 * Get instance status with container stats
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
