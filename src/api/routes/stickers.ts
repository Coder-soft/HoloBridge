import { Router } from 'express';
import { stickerService } from '../../discord/services/index.js';
import type { ApiResponse } from '../../types/api.types.js';
import type { SerializedSticker } from '../../types/discord.types.js';

const router = Router({ mergeParams: true });

/**
 * GET /api/guilds/:guildId/stickers
 * List all stickers in a guild
 */
router.get('/', async (req, res) => {
    const { guildId } = req.params as any;
    const stickers = await stickerService.getGuildStickers(guildId as string);
    const response: ApiResponse<SerializedSticker[]> = { success: true, data: stickers };
    res.json(response);
});

/**
 * GET /api/guilds/:guildId/stickers/:stickerId
 * Get a specific sticker
 */
router.get('/:stickerId', async (req, res) => {
    const { guildId, stickerId } = req.params as any;
    const sticker = await stickerService.getSticker(guildId as string, stickerId as string);

    if (!sticker) {
        res.status(404).json({ success: false, error: 'Sticker not found', code: 'STICKER_NOT_FOUND' });
        return;
    }

    const response: ApiResponse<SerializedSticker> = { success: true, data: sticker };
    res.json(response);
});

/**
 * POST /api/guilds/:guildId/stickers
 * Create a new sticker
 */
router.post('/', async (req, res) => {
    const { guildId } = req.params as any;
    const sticker = await stickerService.createSticker(guildId as string, req.body);

    if (!sticker) {
        res.status(400).json({ success: false, error: 'Failed to create sticker', code: 'STICKER_CREATE_FAILED' });
        return;
    }

    const response: ApiResponse<SerializedSticker> = { success: true, data: sticker };
    res.status(201).json(response);
});

/**
 * PATCH /api/guilds/:guildId/stickers/:stickerId
 * Edit a sticker
 */
router.patch('/:stickerId', async (req, res) => {
    const { guildId, stickerId } = req.params as any;
    const sticker = await stickerService.editSticker(guildId as string, stickerId as string, req.body);

    if (!sticker) {
        res.status(404).json({ success: false, error: 'Sticker not found or failed to update', code: 'STICKER_UPDATE_FAILED' });
        return;
    }

    const response: ApiResponse<SerializedSticker> = { success: true, data: sticker };
    res.json(response);
});

/**
 * DELETE /api/guilds/:guildId/stickers/:stickerId
 * Delete a sticker
 */
router.delete('/:stickerId', async (req, res) => {
    const { guildId, stickerId } = req.params as any;
    const success = await stickerService.deleteSticker(guildId as string, stickerId as string);

    if (!success) {
        res.status(404).json({ success: false, error: 'Sticker not found or failed to delete', code: 'STICKER_DELETE_FAILED' });
        return;
    }

    res.json({ success: true });
});

export default router;
