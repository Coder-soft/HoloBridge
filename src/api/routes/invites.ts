import { Router } from 'express';
import { inviteService } from '../../discord/services/index.js';
import type { ApiResponse } from '../../types/api.types.js';
import type { SerializedInvite } from '../../types/discord.types.js';

const router = Router();

/**
 * GET /api/invites/:code
 * Get an invite by code
 */
router.get('/:code', async (req, res) => {
    try {
        const { code } = req.params;
        const invite = await inviteService.getInvite(code);

        if (!invite) {
            res.status(404).json({ success: false, error: 'Invite not found', code: 'INVITE_NOT_FOUND' });
            return;
        }

        const response: ApiResponse<SerializedInvite> = { success: true, data: invite };
        res.json(response);
    } catch (error) {
        console.error('Error fetching invite:', error);
        const isDev = process.env.NODE_ENV !== 'production';
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            code: 'INTERNAL_ERROR',
            ...(isDev && error instanceof Error && { details: error.message })
        });
        return;
    }
});

/**
 * DELETE /api/invites/:code
 * Delete an invite
 */
router.delete('/:code', async (req, res) => {
    try {
        const { code } = req.params;
        const success = await inviteService.deleteInvite(code);

        if (!success) {
            res.status(404).json({ success: false, error: 'Invite not found or failed to delete', code: 'INVITE_DELETE_FAILED' });
            return;
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting invite:', error);
        const isDev = process.env.NODE_ENV !== 'production';
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            code: 'INTERNAL_ERROR',
            ...(isDev && error instanceof Error && { details: error.message })
        });
        return;
    }
});

export default router;
