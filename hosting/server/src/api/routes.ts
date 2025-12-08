/**
 * HoloBridge Hosting Server - API Routes
 * 
 * REST API endpoints for instance management.
 */

import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { authMiddleware, requireInstanceOwnership } from '../auth/middleware.js';
import * as instanceManager from '../orchestrator/instance.js';
import * as docker from '../orchestrator/docker.js';
import { supabase, logAudit } from '../auth/supabase.js';
import {
    API_KEY_PREFIX,
    API_KEY_LENGTH,
    ALL_SCOPES
} from '../../shared/src/constants.js';
import { randomBytes, createHash } from 'crypto';

export const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// ============ Instance Routes ============

// List user's instances
router.get('/instances', async (req: Request, res: Response) => {
    try {
        const instances = await instanceManager.listInstances(req.auth!.userId);

        // Get container stats for each running instance
        const instancesWithStats = await Promise.all(
            instances.map(async (instance) => {
                if (instance.containerId && instance.status === 'running') {
                    const stats = await docker.getContainerStats(instance.containerId);
                    return { ...instance, stats };
                }
                return { ...instance, stats: null };
            })
        );

        res.json({
            success: true,
            data: instancesWithStats,
        });
    } catch (error) {
        console.error('Error listing instances:', error);
        res.status(500).json({
            success: false,
            error: { code: 'LIST_FAILED', message: 'Failed to list instances' },
        });
    }
});

// Create instance schema
const createInstanceSchema = z.object({
    name: z.string().min(1).max(50),
    discordToken: z.string().min(50),
    config: z.object({
        debug: z.boolean().optional(),
        pluginsEnabled: z.boolean().optional(),
        rateLimitEnabled: z.boolean().optional(),
        rateLimitMax: z.number().int().positive().optional(),
    }).optional(),
});

// Create a new instance
router.post('/instances', async (req: Request, res: Response) => {
    try {
        const parsed = createInstanceSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: parsed.error.issues.map(i => i.message).join(', ')
                },
            });
            return;
        }

        const instance = await instanceManager.createInstance(req.auth!.userId, parsed.data);

        res.status(201).json({
            success: true,
            data: instance,
        });
    } catch (error) {
        console.error('Error creating instance:', error);
        res.status(500).json({
            success: false,
            error: { code: 'CREATE_FAILED', message: 'Failed to create instance' },
        });
    }
});

// Get instance details
router.get('/instances/:id', requireInstanceOwnership, async (req: Request, res: Response) => {
    try {
        const result = await instanceManager.getInstanceWithStats(req.params['id']!);

        if (!result) {
            res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Instance not found' },
            });
            return;
        }

        res.json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error('Error getting instance:', error);
        res.status(500).json({
            success: false,
            error: { code: 'GET_FAILED', message: 'Failed to get instance' },
        });
    }
});

// Delete instance
router.delete('/instances/:id', requireInstanceOwnership, async (req: Request, res: Response) => {
    try {
        await instanceManager.deleteInstance(req.params['id']!, req.auth!.userId);

        res.json({
            success: true,
            data: { message: 'Instance deleted' },
        });
    } catch (error) {
        console.error('Error deleting instance:', error);
        res.status(500).json({
            success: false,
            error: { code: 'DELETE_FAILED', message: 'Failed to delete instance' },
        });
    }
});

// Start instance
router.post('/instances/:id/start', requireInstanceOwnership, async (req: Request, res: Response) => {
    try {
        await instanceManager.startInstance(req.params['id']!, req.auth!.userId);

        res.json({
            success: true,
            data: { message: 'Instance started' },
        });
    } catch (error) {
        console.error('Error starting instance:', error);
        res.status(500).json({
            success: false,
            error: { code: 'START_FAILED', message: 'Failed to start instance' },
        });
    }
});

// Stop instance
router.post('/instances/:id/stop', requireInstanceOwnership, async (req: Request, res: Response) => {
    try {
        await instanceManager.stopInstance(req.params['id']!, req.auth!.userId);

        res.json({
            success: true,
            data: { message: 'Instance stopped' },
        });
    } catch (error) {
        console.error('Error stopping instance:', error);
        res.status(500).json({
            success: false,
            error: { code: 'STOP_FAILED', message: 'Failed to stop instance' },
        });
    }
});

// Restart instance
router.post('/instances/:id/restart', requireInstanceOwnership, async (req: Request, res: Response) => {
    try {
        await instanceManager.restartInstance(req.params['id']!, req.auth!.userId);

        res.json({
            success: true,
            data: { message: 'Instance restarted' },
        });
    } catch (error) {
        console.error('Error restarting instance:', error);
        res.status(500).json({
            success: false,
            error: { code: 'RESTART_FAILED', message: 'Failed to restart instance' },
        });
    }
});

// Update instance config
const updateInstanceSchema = z.object({
    name: z.string().min(1).max(50).optional(),
    config: z.object({
        debug: z.boolean().optional(),
        pluginsEnabled: z.boolean().optional(),
        rateLimitEnabled: z.boolean().optional(),
        rateLimitMax: z.number().int().positive().optional(),
    }).optional(),
});

router.patch('/instances/:id/config', requireInstanceOwnership, async (req: Request, res: Response) => {
    try {
        const parsed = updateInstanceSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: parsed.error.issues.map(i => i.message).join(', ')
                },
            });
            return;
        }

        const instance = await instanceManager.updateInstanceConfig(
            req.params['id']!,
            req.auth!.userId,
            parsed.data
        );

        res.json({
            success: true,
            data: instance,
        });
    } catch (error) {
        console.error('Error updating instance:', error);
        res.status(500).json({
            success: false,
            error: { code: 'UPDATE_FAILED', message: 'Failed to update instance' },
        });
    }
});

// ============ API Key Routes ============

// List API keys for an instance
router.get('/instances/:id/keys', requireInstanceOwnership, async (req: Request, res: Response) => {
    try {
        const { data, error } = await supabase
            .from('instance_api_keys')
            .select('id, instance_id, name, key_hash, scopes, created_at, last_used_at')
            .eq('instance_id', req.params['id'])
            .order('created_at', { ascending: false });

        if (error) {
            throw error;
        }

        // Don't expose full key hash, just a prefix
        const keys = data.map(key => ({
            id: key.id,
            instanceId: key.instance_id,
            name: key.name,
            keyPrefix: key.key_hash.slice(0, 8),
            scopes: key.scopes,
            createdAt: key.created_at,
            lastUsedAt: key.last_used_at,
        }));

        res.json({
            success: true,
            data: keys,
        });
    } catch (error) {
        console.error('Error listing API keys:', error);
        res.status(500).json({
            success: false,
            error: { code: 'LIST_FAILED', message: 'Failed to list API keys' },
        });
    }
});

// Create API key schema
const createApiKeySchema = z.object({
    name: z.string().min(1).max(50),
    scopes: z.array(z.enum(ALL_SCOPES as unknown as [string, ...string[]])),
});

// Create a new API key
router.post('/instances/:id/keys', requireInstanceOwnership, async (req: Request, res: Response) => {
    try {
        const parsed = createApiKeySchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: parsed.error.issues.map(i => i.message).join(', ')
                },
            });
            return;
        }

        // Generate key
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const bytes = randomBytes(API_KEY_LENGTH);
        let key = API_KEY_PREFIX;
        for (let i = 0; i < API_KEY_LENGTH; i++) {
            key += chars.charAt(bytes[i] % chars.length);
        }

        // Hash for storage
        const keyHash = createHash('sha256').update(key).digest('hex');

        const { data, error } = await supabase
            .from('instance_api_keys')
            .insert({
                instance_id: req.params['id']!,
                name: parsed.data.name,
                key_hash: keyHash,
                scopes: parsed.data.scopes,
            })
            .select()
            .single();

        if (error || !data) {
            throw error;
        }

        await logAudit(req.auth!.userId, req.params['id']!, 'apikey.create', { name: parsed.data.name });

        // Return the full key ONLY on creation
        res.status(201).json({
            success: true,
            data: {
                id: data.id,
                name: data.name,
                key: key, // Full key, only shown once
                scopes: data.scopes,
            },
        });
    } catch (error) {
        console.error('Error creating API key:', error);
        res.status(500).json({
            success: false,
            error: { code: 'CREATE_FAILED', message: 'Failed to create API key' },
        });
    }
});

// Delete API key
router.delete('/instances/:id/keys/:keyId', requireInstanceOwnership, async (req: Request, res: Response) => {
    try {
        const { error } = await supabase
            .from('instance_api_keys')
            .delete()
            .eq('id', req.params['keyId'])
            .eq('instance_id', req.params['id']);

        if (error) {
            throw error;
        }

        await logAudit(req.auth!.userId, req.params['id']!, 'apikey.delete', { keyId: req.params['keyId'] });

        res.json({
            success: true,
            data: { message: 'API key deleted' },
        });
    } catch (error) {
        console.error('Error deleting API key:', error);
        res.status(500).json({
            success: false,
            error: { code: 'DELETE_FAILED', message: 'Failed to delete API key' },
        });
    }
});

// ============ Plugin Routes ============

// List plugins for an instance
router.get('/instances/:id/plugins', requireInstanceOwnership, async (req: Request, res: Response) => {
    try {
        const { data, error } = await supabase
            .from('instance_plugins')
            .select()
            .eq('instance_id', req.params['id'])
            .order('created_at', { ascending: false });

        if (error) {
            throw error;
        }

        res.json({
            success: true,
            data: data.map(p => ({
                id: p.id,
                instanceId: p.instance_id,
                name: p.name,
                version: p.version,
                enabled: p.enabled,
                config: p.config,
                createdAt: p.created_at,
            })),
        });
    } catch (error) {
        console.error('Error listing plugins:', error);
        res.status(500).json({
            success: false,
            error: { code: 'LIST_FAILED', message: 'Failed to list plugins' },
        });
    }
});

// Create plugin schema
const createPluginSchema = z.object({
    name: z.string().min(1).max(50),
    content: z.string().min(1), // Base64 encoded
    config: z.record(z.unknown()).optional(),
});

// Add a plugin
router.post('/instances/:id/plugins', requireInstanceOwnership, async (req: Request, res: Response) => {
    try {
        const parsed = createPluginSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: parsed.error.issues.map(i => i.message).join(', ')
                },
            });
            return;
        }

        // TODO: Save plugin file to container volume
        // For now, just save metadata

        const { data, error } = await supabase
            .from('instance_plugins')
            .insert({
                instance_id: req.params['id']!,
                name: parsed.data.name,
                version: '1.0.0',
                enabled: true,
                config: parsed.data.config ?? {},
            })
            .select()
            .single();

        if (error || !data) {
            throw error;
        }

        await logAudit(req.auth!.userId, req.params['id']!, 'plugin.install', { name: parsed.data.name });

        res.status(201).json({
            success: true,
            data: {
                id: data.id,
                instanceId: data.instance_id,
                name: data.name,
                version: data.version,
                enabled: data.enabled,
                config: data.config,
                createdAt: data.created_at,
            },
        });
    } catch (error) {
        console.error('Error adding plugin:', error);
        res.status(500).json({
            success: false,
            error: { code: 'CREATE_FAILED', message: 'Failed to add plugin' },
        });
    }
});

// Toggle plugin
router.patch('/instances/:id/plugins/:pluginId', requireInstanceOwnership, async (req: Request, res: Response) => {
    try {
        const { enabled } = req.body;

        if (typeof enabled !== 'boolean') {
            res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'enabled must be a boolean' },
            });
            return;
        }

        const { data, error } = await supabase
            .from('instance_plugins')
            .update({ enabled })
            .eq('id', req.params['pluginId'])
            .eq('instance_id', req.params['id'])
            .select()
            .single();

        if (error || !data) {
            throw error;
        }

        await logAudit(req.auth!.userId, req.params['id']!, 'plugin.toggle', {
            pluginId: req.params['pluginId'],
            enabled
        });

        res.json({
            success: true,
            data: {
                id: data.id,
                instanceId: data.instance_id,
                name: data.name,
                version: data.version,
                enabled: data.enabled,
                config: data.config,
                createdAt: data.created_at,
            },
        });
    } catch (error) {
        console.error('Error toggling plugin:', error);
        res.status(500).json({
            success: false,
            error: { code: 'UPDATE_FAILED', message: 'Failed to toggle plugin' },
        });
    }
});

// Delete plugin
router.delete('/instances/:id/plugins/:pluginId', requireInstanceOwnership, async (req: Request, res: Response) => {
    try {
        const { error } = await supabase
            .from('instance_plugins')
            .delete()
            .eq('id', req.params['pluginId'])
            .eq('instance_id', req.params['id']);

        if (error) {
            throw error;
        }

        await logAudit(req.auth!.userId, req.params['id']!, 'plugin.uninstall', { pluginId: req.params['pluginId'] });

        res.json({
            success: true,
            data: { message: 'Plugin deleted' },
        });
    } catch (error) {
        console.error('Error deleting plugin:', error);
        res.status(500).json({
            success: false,
            error: { code: 'DELETE_FAILED', message: 'Failed to delete plugin' },
        });
    }
});

// ============ Health & Status Routes ============

// Health check (no auth required - mounted separately)
export async function healthHandler(_req: Request, res: Response): Promise<void> {
    const dockerHealthy = await docker.checkDockerHealth();

    res.json({
        success: true,
        data: {
            status: dockerHealthy ? 'healthy' : 'degraded',
            docker: dockerHealthy,
            timestamp: new Date().toISOString(),
        },
    });
}
