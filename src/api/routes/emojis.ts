import { Router } from 'express';
import type { Request } from 'express';
import { emojiService } from '../../discord/services/index.js';
import type { ApiResponse } from '../../types/api.types.js';
import type { SerializedEmoji } from '../../types/discord.types.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

/** Route params for guild-level endpoints */
interface GuildParams {
    guildId: string;
}

/** Route params for emoji-specific endpoints */
interface GuildEmojiParams extends GuildParams {
    emojiId: string;
}

const router = Router({ mergeParams: true });

/**
 * GET /api/guilds/:guildId/emojis
 * List all emojis in a guild
 */
router.get('/', asyncHandler(async (req: Request<GuildParams>, res) => {
    const { guildId } = req.params;
    const emojis = await emojiService.getGuildEmojis(guildId);
    const response: ApiResponse<SerializedEmoji[]> = { success: true, data: emojis };
    res.json(response);
}));

/**
 * GET /api/guilds/:guildId/emojis/:emojiId
 * Get a specific emoji
 */
router.get('/:emojiId', asyncHandler(async (req: Request<GuildEmojiParams>, res) => {
    const { guildId, emojiId } = req.params;
    const emoji = await emojiService.getEmoji(guildId, emojiId);

    if (!emoji) {
        res.status(404).json({ success: false, error: 'Emoji not found', code: 'EMOJI_NOT_FOUND' });
        return;
    }

    const response: ApiResponse<SerializedEmoji> = { success: true, data: emoji };
    res.json(response);
}));

/**
 * POST /api/guilds/:guildId/emojis
 * Create a new emoji
 */
router.post('/', asyncHandler(async (req: Request<GuildParams>, res) => {
    const { guildId } = req.params;
    const emoji = await emojiService.createEmoji(guildId, req.body);

    if (!emoji) {
        res.status(400).json({ success: false, error: 'Failed to create emoji', code: 'EMOJI_CREATE_FAILED' });
        return;
    }

    const response: ApiResponse<SerializedEmoji> = { success: true, data: emoji };
    res.status(201).json(response);
}));

/**
 * PATCH /api/guilds/:guildId/emojis/:emojiId
 * Edit an emoji
 */
router.patch('/:emojiId', asyncHandler(async (req: Request<GuildEmojiParams>, res) => {
    const { guildId, emojiId } = req.params;
    const emoji = await emojiService.editEmoji(guildId, emojiId, req.body);

    if (!emoji) {
        res.status(404).json({ success: false, error: 'Emoji not found or failed to update', code: 'EMOJI_UPDATE_FAILED' });
        return;
    }

    const response: ApiResponse<SerializedEmoji> = { success: true, data: emoji };
    res.json(response);
}));

/**
 * DELETE /api/guilds/:guildId/emojis/:emojiId
 * Delete an emoji
 */
router.delete('/:emojiId', asyncHandler(async (req: Request<GuildEmojiParams>, res) => {
    const { guildId, emojiId } = req.params;
    const success = await emojiService.deleteEmoji(guildId, emojiId);

    if (!success) {
        res.status(404).json({ success: false, error: 'Emoji not found or failed to delete', code: 'EMOJI_DELETE_FAILED' });
        return;
    }

    res.json({ success: true });
}));

export default router;

