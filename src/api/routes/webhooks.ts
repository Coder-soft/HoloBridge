import { Router } from 'express';
import { webhookService } from '../../discord/services/index.js';
import type { ApiResponse } from '../../types/api.types.js';
import type { SerializedWebhook } from '../../types/discord.types.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

/**
 * GET /api/webhooks/:webhookId
 * Get a specific webhook
 */
router.get('/:webhookId', asyncHandler(async (req, res) => {
    const { webhookId } = req.params;
    const webhook = await webhookService.getWebhook(webhookId);

    if (!webhook) {
        res.status(404).json({ success: false, error: 'Webhook not found', code: 'WEBHOOK_NOT_FOUND' });
        return;
    }

    const response: ApiResponse<SerializedWebhook> = { success: true, data: webhook };
    res.json(response);
}));

/**
 * PATCH /api/webhooks/:webhookId
 * Edit a webhook
 */
router.patch('/:webhookId', asyncHandler(async (req, res) => {
    const { webhookId } = req.params;
    const webhook = await webhookService.editWebhook(webhookId, req.body);

    if (!webhook) {
        res.status(404).json({ success: false, error: 'Webhook not found or failed to update', code: 'WEBHOOK_NOT_FOUND' });
        return;
    }

    const response: ApiResponse<SerializedWebhook> = { success: true, data: webhook };
    res.json(response);
}));

/**
 * DELETE /api/webhooks/:webhookId
 * Delete a webhook
 */
router.delete('/:webhookId', asyncHandler(async (req, res) => {
    const { webhookId } = req.params;
    const success = await webhookService.deleteWebhook(webhookId);

    if (!success) {
        res.status(404).json({ success: false, error: 'Webhook not found or failed to delete', code: 'WEBHOOK_DELETE_FAILED' });
        return;
    }

    res.json({ success: true });
}));

export default router;
