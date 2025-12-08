/**
 * HoloBridge Hosting CLI - API Client
 * 
 * HTTP client for communicating with the hosting server.
 */

import { loadSession } from '../auth/session.js';
import type {
    Instance,
    ApiResponse,
    InstanceApiKey,
    InstancePlugin,
    CreateInstanceRequest,
    CreateApiKeyRequest,
    CreateApiKeyResponse,
} from '../../../shared/src/types.js';
import { HEADER_SECURITY_CODE } from '../../../shared/src/constants.js';

let serverUrl: string | null = null;
let securityCode: string | null = null;

/**
 * Initialize the API client with session
 */
export async function initApiClient(): Promise<boolean> {
    const session = await loadSession();
    if (!session) {
        return false;
    }
    serverUrl = session.serverUrl;
    securityCode = session.securityCode;
    return true;
}

/**
 * Make an authenticated request to the API
 */
async function request<T>(
    method: string,
    path: string,
    body?: unknown
): Promise<ApiResponse<T>> {
    if (!serverUrl || !securityCode) {
        throw new Error('API client not initialized');
    }

    const response = await fetch(`${serverUrl}${path}`, {
        method,
        headers: {
            'Content-Type': 'application/json',
            [HEADER_SECURITY_CODE]: securityCode,
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    return response.json() as Promise<ApiResponse<T>>;
}

// ============ Instance Operations ============

export interface InstanceWithStats extends Instance {
    stats: { cpu: number; memory: number } | null;
}

export async function listInstances(): Promise<InstanceWithStats[]> {
    const response = await request<InstanceWithStats[]>('GET', '/instances');
    if (!response.success || !response.data) {
        throw new Error(response.error?.message ?? 'Failed to list instances');
    }
    return response.data;
}

export async function createInstance(data: CreateInstanceRequest): Promise<Instance> {
    const response = await request<Instance>('POST', '/instances', data);
    if (!response.success || !response.data) {
        throw new Error(response.error?.message ?? 'Failed to create instance');
    }
    return response.data;
}

export async function getInstance(id: string): Promise<{
    instance: Instance;
    containerStatus: unknown;
    stats: { cpu: number; memory: number } | null;
}> {
    const response = await request<{
        instance: Instance;
        containerStatus: unknown;
        stats: { cpu: number; memory: number } | null;
    }>('GET', `/instances/${id}`);
    if (!response.success || !response.data) {
        throw new Error(response.error?.message ?? 'Failed to get instance');
    }
    return response.data;
}

export async function deleteInstance(id: string): Promise<void> {
    const response = await request<{ message: string }>('DELETE', `/instances/${id}`);
    if (!response.success) {
        throw new Error(response.error?.message ?? 'Failed to delete instance');
    }
}

export async function startInstance(id: string): Promise<void> {
    const response = await request<{ message: string }>('POST', `/instances/${id}/start`);
    if (!response.success) {
        throw new Error(response.error?.message ?? 'Failed to start instance');
    }
}

export async function stopInstance(id: string): Promise<void> {
    const response = await request<{ message: string }>('POST', `/instances/${id}/stop`);
    if (!response.success) {
        throw new Error(response.error?.message ?? 'Failed to stop instance');
    }
}

export async function restartInstance(id: string): Promise<void> {
    const response = await request<{ message: string }>('POST', `/instances/${id}/restart`);
    if (!response.success) {
        throw new Error(response.error?.message ?? 'Failed to restart instance');
    }
}

export async function updateInstanceConfig(
    id: string,
    updates: { name?: string; config?: Record<string, unknown> }
): Promise<Instance> {
    const response = await request<Instance>('PATCH', `/instances/${id}/config`, updates);
    if (!response.success || !response.data) {
        throw new Error(response.error?.message ?? 'Failed to update instance');
    }
    return response.data;
}

// ============ API Key Operations ============

export async function listApiKeys(instanceId: string): Promise<InstanceApiKey[]> {
    const response = await request<InstanceApiKey[]>('GET', `/instances/${instanceId}/keys`);
    if (!response.success || !response.data) {
        throw new Error(response.error?.message ?? 'Failed to list API keys');
    }
    return response.data;
}

export async function createApiKey(
    instanceId: string,
    data: CreateApiKeyRequest
): Promise<CreateApiKeyResponse> {
    const response = await request<CreateApiKeyResponse>('POST', `/instances/${instanceId}/keys`, data);
    if (!response.success || !response.data) {
        throw new Error(response.error?.message ?? 'Failed to create API key');
    }
    return response.data;
}

export async function deleteApiKey(instanceId: string, keyId: string): Promise<void> {
    const response = await request<{ message: string }>('DELETE', `/instances/${instanceId}/keys/${keyId}`);
    if (!response.success) {
        throw new Error(response.error?.message ?? 'Failed to delete API key');
    }
}

// ============ Plugin Operations ============

export async function listPlugins(instanceId: string): Promise<InstancePlugin[]> {
    const response = await request<InstancePlugin[]>('GET', `/instances/${instanceId}/plugins`);
    if (!response.success || !response.data) {
        throw new Error(response.error?.message ?? 'Failed to list plugins');
    }
    return response.data;
}

export async function installPlugin(
    instanceId: string,
    data: { name: string; content: string; config?: Record<string, unknown> }
): Promise<InstancePlugin> {
    const response = await request<InstancePlugin>('POST', `/instances/${instanceId}/plugins`, data);
    if (!response.success || !response.data) {
        throw new Error(response.error?.message ?? 'Failed to install plugin');
    }
    return response.data;
}

export async function togglePlugin(
    instanceId: string,
    pluginId: string,
    enabled: boolean
): Promise<InstancePlugin> {
    const response = await request<InstancePlugin>('PATCH', `/instances/${instanceId}/plugins/${pluginId}`, { enabled });
    if (!response.success || !response.data) {
        throw new Error(response.error?.message ?? 'Failed to toggle plugin');
    }
    return response.data;
}

export async function deletePlugin(instanceId: string, pluginId: string): Promise<void> {
    const response = await request<{ message: string }>('DELETE', `/instances/${instanceId}/plugins/${pluginId}`);
    if (!response.success) {
        throw new Error(response.error?.message ?? 'Failed to delete plugin');
    }
}

// ============ Health Check ============

export async function checkHealth(): Promise<{ status: string; docker: boolean }> {
    if (!serverUrl) {
        throw new Error('API client not initialized');
    }

    const response = await fetch(`${serverUrl.replace('/api/v1', '')}/health`);
    const data = await response.json() as ApiResponse<{ status: string; docker: boolean }>;

    if (!data.success || !data.data) {
        throw new Error('Server health check failed');
    }

    return data.data;
}
