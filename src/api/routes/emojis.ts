import { Router } from 'express';
import type { Request } from 'express';
import { emojiService } from '../../discord/services/index.js';
import type { ApiResponse } from '../../types/api.types.js';
import type { SerializedEmoji } from '../../types/discord.types.js';

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
router.get('/', async (req: Request<GuildParams>, res) => {
    try {
        const { guildId } = req.params;
        const emojis = await emojiService.getGuildEmojis(guildId);
        const response: ApiResponse<SerializedEmoji[]> = { success: true, data: emojis };
        res.json(response);
    } catch (error) {
        console.error('Error fetching emojis:', error);
        res.status(500).json({ success: false, error: 'Internal server error', code: 'INTERNAL_SERVER_ERROR' });
    }
});

/**
 * GET /api/guilds/:guildId/emojis/:emojiId
 * Get a specific emoji
 */
router.get('/:emojiId', async (req: Request<GuildEmojiParams>, res) => {
    try {
        const { guildId, emojiId } = req.params;
        const emoji = await emojiService.getEmoji(guildId, emojiId);

        if (!emoji) {
            res.status(404).json({ success: false, error: 'Emoji not found', code: 'EMOJI_NOT_FOUND' });
            return;
        }

        const response: ApiResponse<SerializedEmoji> = { success: true, data: emoji };
        res.json(response);
    } catch (error) {
        console.error('Error fetching emoji:', error);
        res.status(500).json({ success: false, error: 'Internal server error', code: 'INTERNAL_SERVER_ERROR' });
    }
});

/**
 * POST /api/guilds/:guildId/emojis
 * Create a new emoji
 */
router.post('/', async (req: Request<GuildParams>, res) => {
    try {
        const { guildId } = req.params;
        const emoji = await emojiService.createEmoji(guildId, req.body);

        if (!emoji) {
            res.status(400).json({ success: false, error: 'Failed to create emoji', code: 'EMOJI_CREATE_FAILED' });
            return;
        }

        const response: ApiResponse<SerializedEmoji> = { success: true, data: emoji };
        res.status(201).json(response);
    } catch (error) {
        console.error('Error creating emoji:', error);
        res.status(500).json({ success: false, error: 'Internal server error', code: 'INTERNAL_SERVER_ERROR' });
    }
});

/**
 * PATCH /api/guilds/:guildId/emojis/:emojiId
 * Edit an emoji
 */
router.patch('/:emojiId', async (req: Request<GuildEmojiParams>, res) => {
    try {
        const { guildId, emojiId } = req.params;
        const emoji = await emojiService.editEmoji(guildId, emojiId, req.body);

        if (!emoji) {
            res.status(404).json({ success: false, error: 'Emoji not found or failed to update', code: 'EMOJI_UPDATE_FAILED' });
            return;
        }

        const response: ApiResponse<SerializedEmoji> = { success: true, data: emoji };
        res.json(response);
    } catch (error) {
        console.error('Error updating emoji:', error);
        res.status(500).json({ success: false, error: 'Internal server error', code: 'INTERNAL_SERVER_ERROR' });
    }
});

/**
 * DELETE /api/guilds/:guildId/emojis/:emojiId
 * Delete an emoji
 */
router.delete('/:emojiId', async (req: Request<GuildEmojiParams>, res) => {
    try {
        const { guildId, emojiId } = req.params;
        const success = await emojiService.deleteEmoji(guildId, emojiId);

        if (!success) {
            res.status(404).json({ success: false, error: 'Emoji not found or failed to delete', code: 'EMOJI_DELETE_FAILED' });
            return;
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting emoji:', error);
        res.status(500).json({ success: false, error: 'Internal server error', code: 'INTERNAL_SERVER_ERROR' });
    }
});

export default router;

