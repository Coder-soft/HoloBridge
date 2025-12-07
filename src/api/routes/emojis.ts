import { Router } from 'express';
import { emojiService } from '../../discord/services/index.js';
import type { ApiResponse } from '../../types/api.types.js';
import type { SerializedEmoji } from '../../types/discord.types.js';

const router = Router({ mergeParams: true });

/**
 * GET /api/guilds/:guildId/emojis
 * List all emojis in a guild
 */
router.get('/', async (req, res) => {
    const { guildId } = req.params as any;
    const emojis = await emojiService.getGuildEmojis(guildId as string);
    const response: ApiResponse<SerializedEmoji[]> = { success: true, data: emojis };
    res.json(response);
});

/**
 * GET /api/guilds/:guildId/emojis/:emojiId
 * Get a specific emoji
 */
router.get('/:emojiId', async (req, res) => {
    const { guildId, emojiId } = req.params as any;
    const emoji = await emojiService.getEmoji(guildId as string, emojiId as string);

    if (!emoji) {
        res.status(404).json({ success: false, error: 'Emoji not found', code: 'EMOJI_NOT_FOUND' });
        return;
    }

    const response: ApiResponse<SerializedEmoji> = { success: true, data: emoji };
    res.json(response);
});

/**
 * POST /api/guilds/:guildId/emojis
 * Create a new emoji
 */
router.post('/', async (req, res) => {
    const { guildId } = req.params as any;
    const emoji = await emojiService.createEmoji(guildId as string, req.body);

    if (!emoji) {
        res.status(400).json({ success: false, error: 'Failed to create emoji', code: 'EMOJI_CREATE_FAILED' });
        return;
    }

    const response: ApiResponse<SerializedEmoji> = { success: true, data: emoji };
    res.status(201).json(response);
});

/**
 * PATCH /api/guilds/:guildId/emojis/:emojiId
 * Edit an emoji
 */
router.patch('/:emojiId', async (req, res) => {
    const { guildId, emojiId } = req.params as any;
    const emoji = await emojiService.editEmoji(guildId as string, emojiId as string, req.body);

    if (!emoji) {
        res.status(404).json({ success: false, error: 'Emoji not found or failed to update', code: 'EMOJI_UPDATE_FAILED' });
        return;
    }

    const response: ApiResponse<SerializedEmoji> = { success: true, data: emoji };
    res.json(response);
});

/**
 * DELETE /api/guilds/:guildId/emojis/:emojiId
 * Delete an emoji
 */
router.delete('/:emojiId', async (req, res) => {
    const { guildId, emojiId } = req.params as any;
    const success = await emojiService.deleteEmoji(guildId as string, emojiId as string);

    if (!success) {
        res.status(404).json({ success: false, error: 'Emoji not found or failed to delete', code: 'EMOJI_DELETE_FAILED' });
        return;
    }

    res.json({ success: true });
});

export default router;
