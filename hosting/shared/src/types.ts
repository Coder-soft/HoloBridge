/**
 * HoloBridge Hosting - Shared Types
 * 
 * Type definitions shared between the server and CLI components.
 */

// ============ User & Auth ============

export interface User {
    id: string;
    discordId: string;
    username: string;
    discriminator: string;
    avatar: string | null;
    email?: string;
    createdAt: Date;
}

export interface Session {
    userId: string;
    securityCode: string;
    expiresAt: Date;
}

// ============ Instance ============

export type InstanceStatus = 'stopped' | 'starting' | 'running' | 'stopping' | 'error';

export interface Instance {
    id: string;
    userId: string;
    securityCode: string;
    name: string;
    containerId: string | null;
    status: InstanceStatus;
    port: number | null;
    config: InstanceConfig;
    createdAt: Date;
    updatedAt: Date;
}

export interface InstanceConfig {
    discordTokenEncrypted?: string;
    debug?: boolean;
    pluginsEnabled?: boolean;
    rateLimitEnabled?: boolean;
    rateLimitMax?: number;
    rateLimitWindowMs?: number;
}

export interface CreateInstanceRequest {
    name: string;
    discordToken: string;
    config?: Partial<InstanceConfig>;
}

export interface UpdateInstanceRequest {
    name?: string;
    discordToken?: string;
    config?: Partial<InstanceConfig>;
}

// ============ Plugins ============

export interface InstancePlugin {
    id: string;
    instanceId: string;
    name: string;
    version: string | null;
    enabled: boolean;
    config: Record<string, unknown>;
    createdAt: Date;
}

export interface CreatePluginRequest {
    name: string;
    content: string; // Base64 encoded plugin file
    config?: Record<string, unknown>;
}

// ============ API Keys ============

export type ApiKeyScope =
    | 'read:guilds'
    | 'read:channels'
    | 'read:members'
    | 'read:messages'
    | 'write:messages'
    | 'write:members'
    | 'write:channels'
    | 'write:roles'
    | 'events'
    | 'admin';

export interface InstanceApiKey {
    id: string;
    instanceId: string;
    name: string;
    keyPrefix: string; // First 8 chars for display
    scopes: ApiKeyScope[];
    createdAt: Date;
    lastUsedAt: Date | null;
}

export interface CreateApiKeyRequest {
    name: string;
    scopes: ApiKeyScope[];
}

export interface CreateApiKeyResponse {
    id: string;
    name: string;
    key: string; // Full key, only shown once
    scopes: ApiKeyScope[];
}

// ============ Audit Log ============

export type AuditAction =
    | 'instance.create'
    | 'instance.start'
    | 'instance.stop'
    | 'instance.restart'
    | 'instance.delete'
    | 'instance.config.update'
    | 'plugin.install'
    | 'plugin.uninstall'
    | 'plugin.toggle'
    | 'apikey.create'
    | 'apikey.delete';

export interface AuditLogEntry {
    id: string;
    userId: string;
    instanceId: string | null;
    action: AuditAction;
    details: Record<string, unknown>;
    createdAt: Date;
}

// ============ API Responses ============

export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
    };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

// ============ WebSocket Events ============

export type ServerEvent =
    | { type: 'instance.status'; data: { instanceId: string; status: InstanceStatus } }
    | { type: 'instance.logs'; data: { instanceId: string; line: string } }
    | { type: 'instance.stats'; data: { instanceId: string; cpu: number; memory: number } };

export type ClientEvent =
    | { type: 'subscribe.instance'; instanceId: string }
    | { type: 'unsubscribe.instance'; instanceId: string }
    | { type: 'subscribe.logs'; instanceId: string }
    | { type: 'unsubscribe.logs'; instanceId: string };
