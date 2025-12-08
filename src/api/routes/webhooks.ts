import { Router } from 'express';
import { webhookService } from '../../discord/services/index.js';
import type { ApiResponse } from '../../types/api.types.js';
import type { SerializedWebhook } from '../../types/discord.types.js';

const router = Router();

/**
 * GET /api/webhooks/:webhookId
 * Get a specific webhook
 */
router.get('/:webhookId', async (req, res) => {
    try {
        const { webhookId } = req.params;
        const webhook = await webhookService.getWebhook(webhookId);

        if (!webhook) {
            res.status(404).json({ success: false, error: 'Webhook not found', code: 'WEBHOOK_NOT_FOUND' });
            return;
        }

        const response: ApiResponse<SerializedWebhook> = { success: true, data: webhook };
        res.json(response);
    } catch (error) {
        console.error('Error fetching webhook:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch webhook', code: 'WEBHOOK_FETCH_ERROR' });
        return;
    }
});

/**
 * PATCH /api/webhooks/:webhookId
 * Edit a webhook
 */
router.patch('/:webhookId', async (req, res) => {
    try {
        const { webhookId } = req.params;
        const webhook = await webhookService.editWebhook(webhookId, req.body);

        if (!webhook) {
            res.status(404).json({ success: false, error: 'Webhook not found or failed to update', code: 'WEBHOOK_NOT_FOUND' });
            return;
        }

        const response: ApiResponse<SerializedWebhook> = { success: true, data: webhook };
        res.json(response);
    } catch (error) {
        console.error('Error updating webhook:', error);
        res.status(500).json({ success: false, error: 'Failed to update webhook', code: 'WEBHOOK_UPDATE_ERROR' });
        return;
    }
});

/**
 * DELETE /api/webhooks/:webhookId
 * Delete a webhook
 */
router.delete('/:webhookId', async (req, res) => {
    try {
        const { webhookId } = req.params;
        const success = await webhookService.deleteWebhook(webhookId);

        if (!success) {
            res.status(404).json({ success: false, error: 'Webhook not found or failed to delete', code: 'WEBHOOK_DELETE_FAILED' });
            return;
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting webhook:', error);
        res.status(500).json({ success: false, error: 'Failed to delete webhook', code: 'WEBHOOK_DELETE_ERROR' });
        return;
    }
});

export default router;
