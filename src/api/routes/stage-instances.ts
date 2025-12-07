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
    const stageInstance = await stageInstanceService.getStageInstance(channelId);

    if (!stageInstance) {
        res.status(404).json({ success: false, error: 'Stage instance not found', code: 'STAGE_INSTANCE_NOT_FOUND' });
        return;
    }

    const response: ApiResponse<SerializedStageInstance> = { success: true, data: stageInstance };
    res.json(response);
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

    const stageInstance = await stageInstanceService.createStageInstance(channelId, topic, options);

    if (!stageInstance) {
        res.status(400).json({ success: false, error: 'Failed to create stage instance', code: 'STAGE_INSTANCE_CREATE_FAILED' });
        return;
    }

    const response: ApiResponse<SerializedStageInstance> = { success: true, data: stageInstance };
    res.status(201).json(response);
});

/**
 * PATCH /api/stage-instances/:channelId
 * Edit a stage instance
 */
router.patch('/:channelId', async (req, res) => {
    const { channelId } = req.params;
    const stageInstance = await stageInstanceService.editStageInstance(channelId, req.body);

    if (!stageInstance) {
        res.status(404).json({ success: false, error: 'Stage instance not found or failed to update', code: 'STAGE_INSTANCE_UPDATE_FAILED' });
        return;
    }

    const response: ApiResponse<SerializedStageInstance> = { success: true, data: stageInstance };
    res.json(response);
});

/**
 * DELETE /api/stage-instances/:channelId
 * Delete a stage instance
 */
router.delete('/:channelId', async (req, res) => {
    const { channelId } = req.params;
    const success = await stageInstanceService.deleteStageInstance(channelId);

    if (!success) {
        res.status(404).json({ success: false, error: 'Stage instance not found or failed to delete', code: 'STAGE_INSTANCE_DELETE_FAILED' });
        return;
    }

    res.json({ success: true });
});

export default router;
