import { Router } from 'express';
import { stageInstanceService } from '../../discord/services/index.js';
import type { ApiResponse } from '../../types/api.types.js';
import type { SerializedStageInstance } from '../../types/discord.types.js';

const router = Router();

/**
 * GET /api/stage-instances/:channelId
 * Get stage instance for a channel
 */
router.get('/:channelId', async (req, res) => {
    const { channelId } = req.params;

    try {
        const stageInstance = await stageInstanceService.getStageInstance(channelId);

        if (!stageInstance) {
            res.status(404).json({ success: false, error: 'Stage instance not found', code: 'STAGE_INSTANCE_NOT_FOUND' });
            return;
        }

        const response: ApiResponse<SerializedStageInstance> = { success: true, data: stageInstance };
        res.json(response);
    } catch (error) {
        console.error('Error fetching stage instance:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch stage instance', code: 'STAGE_INSTANCE_FETCH_ERROR' });
    }
});

/**
 * POST /api/stage-instances
 * Create a new stage instance
 */
router.post('/', async (req, res) => {
    const { channelId, topic, ...options } = req.body;

    if (!channelId || !topic) {
        res.status(400).json({ success: false, error: 'Missing channelId or topic', code: 'MISSING_FIELDS' });
        return;
    }

    try {
        const stageInstance = await stageInstanceService.createStageInstance(channelId, topic, options);

        if (!stageInstance) {
            res.status(400).json({ success: false, error: 'Failed to create stage instance', code: 'STAGE_INSTANCE_CREATE_FAILED' });
            return;
        }

        const response: ApiResponse<SerializedStageInstance> = { success: true, data: stageInstance };
        res.status(201).json(response);
    } catch (error) {
        console.error('Error creating stage instance:', error);
        res.status(500).json({ success: false, error: 'Failed to create stage instance', code: 'STAGE_INSTANCE_CREATE_ERROR' });
    }
});

/**
 * PATCH /api/stage-instances/:channelId
 * Edit a stage instance
 */
router.patch('/:channelId', async (req, res) => {
    const { channelId } = req.params;

    // Validate request body - only allow valid fields
    const allowedFields = ['topic', 'privacyLevel'];
    const updates: Record<string, unknown> = {};

    for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
            updates[field] = req.body[field];
        }
    }

    if (Object.keys(updates).length === 0) {
        res.status(400).json({ success: false, error: 'No valid fields provided', code: 'INVALID_REQUEST_BODY' });
        return;
    }

    try {
        const stageInstance = await stageInstanceService.editStageInstance(channelId, updates);

        if (!stageInstance) {
            res.status(404).json({ success: false, error: 'Stage instance not found or failed to update', code: 'STAGE_INSTANCE_UPDATE_FAILED' });
            return;
        }

        const response: ApiResponse<SerializedStageInstance> = { success: true, data: stageInstance };
        res.json(response);
    } catch (error) {
        console.error('Error updating stage instance:', error);
        res.status(500).json({ success: false, error: 'Failed to update stage instance', code: 'STAGE_INSTANCE_UPDATE_ERROR' });
    }
});

/**
 * DELETE /api/stage-instances/:channelId
 * Delete a stage instance
 */
router.delete('/:channelId', async (req, res) => {
    const { channelId } = req.params;

    try {
        const success = await stageInstanceService.deleteStageInstance(channelId);

        if (!success) {
            res.status(404).json({ success: false, error: 'Stage instance not found or failed to delete', code: 'STAGE_INSTANCE_DELETE_FAILED' });
            return;
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting stage instance:', error);
        res.status(500).json({ success: false, error: 'Failed to delete stage instance', code: 'STAGE_INSTANCE_DELETE_ERROR' });
    }
});

export default router;
