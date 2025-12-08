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
import { supabase, logAudit, type Database } from '../auth/supabase.js';
import {
    API_KEY_PREFIX,
    API_KEY_LENGTH,
    ALL_SCOPES
} from '../../../shared/src/constants.js';
import { randomBytes, createHash } from 'crypto';

export const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Health check handler
export const healthHandler = (_req: Request, res: Response) => {
    res.json({ status: 'ok', version: '1.0.0' });
};

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

// List API keys
router.get('/instances/:id/keys', requireInstanceOwnership, async (req: Request, res: Response) => {
    const { data, error } = await supabase
        .from('instance_api_keys')
        .select('id, name, created_at, last_used_at, scopes')
        .eq('instance_id', req.params['id']!)
        .order('created_at', { ascending: false });

    // Explicit cast for Supabase result
    const keys = (data as unknown) as Database['public']['Tables']['instance_api_keys']['Row'][] | null;

    if (error) {
        res.status(500).json({
            success: false,
            error: { code: 'LIST_KEYS_FAILED', message: 'Failed to list API keys' },
        });
        return;
    }

    res.json({
        success: true,
        data: keys,
    });
});

// Create API key
const createKeySchema = z.object({
    name: z.string().min(1).max(50),
    scopes: z.array(z.string()).optional(),
});

router.post('/instances/:id/keys', requireInstanceOwnership, async (req: Request, res: Response) => {
    const parsed = createKeySchema.safeParse(req.body);
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
    const rawKey = `${API_KEY_PREFIX}${randomBytes(API_KEY_LENGTH).toString('hex')}`;
    const keyHash = createHash('sha256').update(rawKey).digest('hex');

    const { data, error } = await supabase
        .from('instance_api_keys')
        .insert({
            instance_id: req.params['id']!,
            name: parsed.data.name,
            key_hash: keyHash,
            scopes: parsed.data.scopes ?? ALL_SCOPES,
        } as any)
        .select()
        .single();

    // Explicit cast for Supabase result
    const row = data as Database['public']['Tables']['instance_api_keys']['Row'] | null;

    if (error || !row) {
        res.status(500).json({
            success: false,
            error: { code: 'CREATE_KEY_FAILED', message: 'Failed to create API key' },
        });
        return;
    }

    await logAudit(req.auth!.userId, req.params['id']!, 'apikey.create', { name: parsed.data.name });

    // Return the raw key only once
    res.status(201).json({
        success: true,
        data: {
            ...row,
            key: rawKey,
        },
    });
});

// Delete API key
router.delete('/instances/:id/keys/:keyId', requireInstanceOwnership, async (req: Request, res: Response) => {
    const { error } = await supabase
        .from('instance_api_keys')
        .delete()
        .eq('id', req.params['keyId']!)
        .eq('instance_id', req.params['id']!);

    if (error) {
        res.status(500).json({
            success: false,
            error: { code: 'DELETE_KEY_FAILED', message: 'Failed to delete API key' },
        });
        return;
    }

    await logAudit(req.auth!.userId, req.params['id']!, 'apikey.delete', { keyId: req.params['keyId'] });

    res.json({
        success: true,
        data: { message: 'API key deleted' },
    });
});

// ============ Plugin Routes ============

// List plugins
router.get('/instances/:id/plugins', requireInstanceOwnership, async (req: Request, res: Response) => {
    const { data, error } = await supabase
        .from('instance_plugins')
        .select('*')
        .eq('instance_id', req.params['id']!)
        .order('name');

    // Explicit cast for Supabase result
    const plugins = (data as unknown) as Database['public']['Tables']['instance_plugins']['Row'][] | null;

    if (error) {
        res.status(500).json({
            success: false,
            error: { code: 'LIST_PLUGINS_FAILED', message: 'Failed to list plugins' },
        });
        return;
    }

    res.json({
        success: true,
        data: plugins,
    });
});

// Add plugin (Metadata only for now, would involve file upload in real implementation)
const addPluginSchema = z.object({
    name: z.string().min(1),
    version: z.string().optional(),
    config: z.record(z.unknown()).optional(),
});

router.post('/instances/:id/plugins', requireInstanceOwnership, async (req: Request, res: Response) => {
    const parsed = addPluginSchema.safeParse(req.body);
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

    const { data, error } = await supabase
        .from('instance_plugins')
        .insert({
            instance_id: req.params['id']!,
            name: parsed.data.name,
            version: parsed.data.version ?? null,
            config: parsed.data.config ?? {},
            enabled: true,
        })
        .select()
        .single();

    // Explicit cast for Supabase result
    const row = data as Database['public']['Tables']['instance_plugins']['Row'] | null;

    if (error || !row) {
        if (error?.code === '23505') { // Unique violation
            res.status(409).json({
                success: false,
                error: { code: 'PLUGIN_EXISTS', message: 'Plugin already exists' },
            });
            return;
        }
        res.status(500).json({
            success: false,
            error: { code: 'ADD_PLUGIN_FAILED', message: 'Failed to add plugin' },
        });
        return;
    }

    await logAudit(req.auth!.userId, req.params['id']!, 'plugin.add', { name: parsed.data.name });

    res.status(201).json({
        success: true,
        data: row,
    });
});

// Toggle plugin
router.patch('/instances/:id/plugins/:pluginId', requireInstanceOwnership, async (req: Request, res: Response) => {
    const { enabled } = req.body;

    if (typeof enabled !== 'boolean') {
        res.status(400).json({
            success: false,
            error: { code: 'INVALID_INPUT', message: 'enabled must be a boolean' },
        });
        return;
    }

    const { data, error } = await supabase
        .from('instance_plugins')
        .update({ enabled })
        .eq('id', req.params['pluginId']!)
        .eq('instance_id', req.params['id']!)
        .select()
        .single();

    // Explicit cast for Supabase result
    const row = data as Database['public']['Tables']['instance_plugins']['Row'] | null;

    if (error || !row) {
        res.status(500).json({
            success: false,
            error: { code: 'UPDATE_PLUGIN_FAILED', message: 'Failed to update plugin' },
        });
        return;
    }

    await logAudit(req.auth!.userId, req.params['id']!, 'plugin.toggle', {
        pluginId: req.params['pluginId'],
        enabled
    });

    res.json({
        success: true,
        data: row,
    });
});

// Delete plugin
router.delete('/instances/:id/plugins/:pluginId', requireInstanceOwnership, async (req: Request, res: Response) => {
    const { error } = await supabase
        .from('instance_plugins')
        .delete()
        .eq('id', req.params['pluginId']!)
        .eq('instance_id', req.params['id']!);

    if (error) {
        res.status(500).json({
            success: false,
            error: { code: 'DELETE_PLUGIN_FAILED', message: 'Failed to delete plugin' },
        });
        return;
    }

    await logAudit(req.auth!.userId, req.params['id']!, 'plugin.delete', { pluginId: req.params['pluginId'] });

    res.json({
        success: true,
        data: { message: 'Plugin deleted' },
    });
});
