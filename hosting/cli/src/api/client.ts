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
 * Load the saved session and configure the API client's server URL and security code.
 *
 * @returns `true` if a session was loaded and the client configured, `false` if no session was available.
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
 * Send an authenticated HTTP request to the initialized API server.
 *
 * @param method - The HTTP method to use (e.g., "GET", "POST", "PATCH", "DELETE")
 * @param path - The request path appended to the configured server URL (must start with `/`)
 * @param body - Optional JSON-serializable request body; omitted for requests without a body
 * @returns The parsed API response as an `ApiResponse<T>`
 * @throws Error if the API client has not been initialized
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

/**
 * Retrieve the list of instances along with their runtime stats when available.
 *
 * @returns An array of instances where each entry includes a `stats` field (`{ cpu: number; memory: number }` or `null`).
 * @throws Error if the API response indicates failure or does not include data.
 */
export async function listInstances(): Promise<InstanceWithStats[]> {
    const response = await request<InstanceWithStats[]>('GET', '/instances');
    if (!response.success || !response.data) {
        throw new Error(response.error?.message ?? 'Failed to list instances');
    }
    return response.data;
}

/**
 * Create a new instance on the server.
 *
 * @param data - Parameters for the instance to create
 * @returns The created `Instance`
 * @throws Error if the API responds with a failure or missing data
 */
export async function createInstance(data: CreateInstanceRequest): Promise<Instance> {
    const response = await request<Instance>('POST', '/instances', data);
    if (!response.success || !response.data) {
        throw new Error(response.error?.message ?? 'Failed to create instance');
    }
    return response.data;
}

/**
 * Retrieve details for a specific instance by ID.
 *
 * @returns An object containing the `instance`, its `containerStatus`, and `stats` with `cpu` and `memory` (or `null` if stats are unavailable).
 * @throws When the API response indicates failure or does not contain data.
 */
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

/**
 * Deletes the instance identified by the given ID.
 *
 * @param id - The instance identifier to delete
 * @throws Error - If the server responds with a failure; the error message will be the server-provided message or 'Failed to delete instance'
 */
export async function deleteInstance(id: string): Promise<void> {
    const response = await request<{ message: string }>('DELETE', `/instances/${id}`);
    if (!response.success) {
        throw new Error(response.error?.message ?? 'Failed to delete instance');
    }
}

/**
 * Start the instance with the given identifier.
 *
 * @param id - The instance identifier
 * @throws Error if the server reports failure while starting the instance
 */
export async function startInstance(id: string): Promise<void> {
    const response = await request<{ message: string }>('POST', `/instances/${id}/start`);
    if (!response.success) {
        throw new Error(response.error?.message ?? 'Failed to start instance');
    }
}

/**
 * Stops a hosting instance by its identifier.
 *
 * @param id - The instance identifier to stop
 * @throws Error when the server reports failure to stop the instance
 */
export async function stopInstance(id: string): Promise<void> {
    const response = await request<{ message: string }>('POST', `/instances/${id}/stop`);
    if (!response.success) {
        throw new Error(response.error?.message ?? 'Failed to stop instance');
    }
}

/**
 * Restart the specified instance on the server.
 *
 * @param id - The instance identifier to restart
 * @throws Error if the server responds with a failure or does not confirm the restart
 */
export async function restartInstance(id: string): Promise<void> {
    const response = await request<{ message: string }>('POST', `/instances/${id}/restart`);
    if (!response.success) {
        throw new Error(response.error?.message ?? 'Failed to restart instance');
    }
}

/**
 * Update an instance's configuration and return the updated instance.
 *
 * @param id - The identifier of the instance to update
 * @param updates - Fields to update: `name` to change the instance name, `config` to replace the instance configuration
 * @returns The updated Instance
 */
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

/**
 * Fetches the API keys associated with the specified instance.
 *
 * @param instanceId - The ID of the instance whose API keys to retrieve
 * @returns An array of `InstanceApiKey` objects
 */

export async function listApiKeys(instanceId: string): Promise<InstanceApiKey[]> {
    const response = await request<InstanceApiKey[]>('GET', `/instances/${instanceId}/keys`);
    if (!response.success || !response.data) {
        throw new Error(response.error?.message ?? 'Failed to list API keys');
    }
    return response.data;
}

/**
 * Create a new API key for the specified instance.
 *
 * @param instanceId - The ID of the instance to create the key for
 * @param data - Parameters for the API key creation (name, permissions, etc.)
 * @returns The created API key record
 * @throws Error when the server responds with failure or the response lacks key data
 */
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

/**
 * Delete an API key for a specific instance.
 *
 * @param instanceId - The instance identifier whose API key will be deleted
 * @param keyId - The identifier of the API key to delete
 * @throws Error when the server responds with a failure or the deletion does not succeed
 */
export async function deleteApiKey(instanceId: string, keyId: string): Promise<void> {
    const response = await request<{ message: string }>('DELETE', `/instances/${instanceId}/keys/${keyId}`);
    if (!response.success) {
        throw new Error(response.error?.message ?? 'Failed to delete API key');
    }
}

/**
 * Retrieve the plugins installed for a given hosting instance.
 *
 * @param instanceId - The instance identifier to query
 * @returns An array of `InstancePlugin` objects representing the instance's installed plugins
 * @throws If the API response indicates failure or contains no plugin data
 */

export async function listPlugins(instanceId: string): Promise<InstancePlugin[]> {
    const response = await request<InstancePlugin[]>('GET', `/instances/${instanceId}/plugins`);
    if (!response.success || !response.data) {
        throw new Error(response.error?.message ?? 'Failed to list plugins');
    }
    return response.data;
}

/**
 * Installs a plugin for the specified instance.
 *
 * @param instanceId - ID of the instance to install the plugin into
 * @param data - Plugin payload containing `name`, `content`, and optional `config`
 * @returns The installed `InstancePlugin`
 * @throws Error if the server responds with a failure or the response lacks plugin data
 */
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

/**
 * Toggle a plugin's enabled state for a specific instance.
 *
 * @returns The updated `InstancePlugin` object.
 * @throws Error if the API response indicates failure or lacks the updated plugin data.
 */
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

/**
 * Deletes a plugin from the specified instance.
 *
 * @param instanceId - The ID of the instance that owns the plugin
 * @param pluginId - The ID of the plugin to delete
 * @throws Error if the server responds with a failure or deletion is not allowed
 */
export async function deletePlugin(instanceId: string, pluginId: string): Promise<void> {
    const response = await request<{ message: string }>('DELETE', `/instances/${instanceId}/plugins/${pluginId}`);
    if (!response.success) {
        throw new Error(response.error?.message ?? 'Failed to delete plugin');
    }
}

/**
 * Checks the hosting server's health and returns its reported status.
 *
 * @returns The server health object containing `status` (server-reported status string) and `docker` (`true` if Docker is available, `false` otherwise).
 * @throws If the API client has not been initialized.
 * @throws If the server responds with a failure or missing health data.
 */

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