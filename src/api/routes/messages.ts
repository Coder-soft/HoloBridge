import { Router, type Request } from 'express';
import { messageService } from '../../discord/services/index.js';
import { SendMessageSchema, EditMessageSchema, GetMessagesSchema } from '../../types/api.types.js';

/** Route params for message endpoints (merged from parent router) */
interface MessageParams {
    channelId?: string;
    messageId?: string;
    emoji?: string;
}

const router = Router({ mergeParams: true });

/**
 * Helper to get merged params with type safety.
 * Express mergeParams merges parent route params, so channelId comes from the parent router.
 */
function getParams(req: Request): { channelId: string; messageId?: string; emoji?: string } {
    // Params are merged from parent router via mergeParams: true
    const params = req.params as MessageParams;
    return { channelId: params.channelId ?? '', messageId: params.messageId, emoji: params.emoji };
}

/**
 * GET /api/channels/:channelId/messages
 * Get messages from a channel
 */
router.get('/', async (req, res) => {
    const { channelId } = getParams(req);

    const result = GetMessagesSchema.safeParse(req.query);
    if (!result.success) {
        res.status(400).json({ success: false, error: 'Invalid query parameters', details: result.error.issues });
        return;
    }

    const messages = await messageService.getMessages(channelId, result.data);
    res.json({ success: true, data: messages });
});

/**
 * GET /api/channels/:channelId/messages/pinned
 * Get pinned messages in a channel
 */
router.get('/pinned', async (req, res) => {
    const { channelId } = getParams(req);
    const messages = await messageService.getPinnedMessages(channelId);
    res.json({ success: true, data: messages });
});

/**
 * GET /api/channels/:channelId/messages/:messageId
 * Get a specific message
 */
router.get('/:messageId', async (req, res) => {
    const { channelId, messageId } = getParams(req);
    const message = await messageService.getMessage(channelId, messageId ?? '');

    if (!message) {
        res.status(404).json({ success: false, error: 'Message not found', code: 'MESSAGE_NOT_FOUND' });
        return;
    }

    res.json({ success: true, data: message });
});

/**
 * POST /api/channels/:channelId/messages
 * Send a message
 */
router.post('/', async (req, res) => {
    const { channelId } = getParams(req);

    const result = SendMessageSchema.safeParse(req.body);
    if (!result.success) {
        res.status(400).json({ success: false, error: 'Invalid request body', details: result.error.issues });
        return;
    }

    const message = await messageService.sendMessage(channelId, result.data);

    if (!message) {
        res.status(400).json({ success: false, error: 'Failed to send message', code: 'SEND_FAILED' });
        return;
    }

    res.status(201).json({ success: true, data: message });
});

/**
 * PATCH /api/channels/:channelId/messages/:messageId
 * Edit a message
 */
router.patch('/:messageId', async (req, res) => {
    const { channelId, messageId } = getParams(req);

    const result = EditMessageSchema.safeParse(req.body);
    if (!result.success) {
        res.status(400).json({ success: false, error: 'Invalid request body', details: result.error.issues });
        return;
    }

    const message = await messageService.editMessage(channelId, messageId ?? '', result.data);

    if (!message) {
        res.status(400).json({ success: false, error: 'Failed to edit message', code: 'EDIT_FAILED' });
        return;
    }

    res.json({ success: true, data: message });
});

/**
 * DELETE /api/channels/:channelId/messages/:messageId
 * Delete a message
 */
router.delete('/:messageId', async (req, res) => {
    const { channelId, messageId } = getParams(req);

    const success = await messageService.deleteMessage(channelId, messageId ?? '');

    if (!success) {
        res.status(400).json({ success: false, error: 'Failed to delete message', code: 'DELETE_FAILED' });
        return;
    }

    res.json({ success: true, data: { deleted: true } });
});

/**
 * POST /api/channels/:channelId/messages/bulk-delete
 * Bulk delete messages
 */
router.post('/bulk-delete', async (req, res) => {
    const { channelId } = getParams(req);
    const { messageIds } = req.body as { messageIds?: string[] };

    if (!messageIds || !Array.isArray(messageIds)) {
        res.status(400).json({ success: false, error: 'messageIds array is required', code: 'MISSING_MESSAGE_IDS' });
        return;
    }

    const result = await messageService.bulkDelete(channelId, messageIds);
    res.json({ success: true, data: result });
});

/**
 * POST /api/channels/:channelId/messages/:messageId/reactions/:emoji
 * Add a reaction
 */
router.post('/:messageId/reactions/:emoji', async (req, res) => {
    const { channelId, messageId, emoji } = getParams(req);

    const success = await messageService.addReaction(channelId, messageId ?? '', decodeURIComponent(emoji ?? ''));

    if (!success) {
        res.status(400).json({ success: false, error: 'Failed to add reaction', code: 'REACTION_FAILED' });
        return;
    }

    res.json({ success: true, data: { reacted: true } });
});

/**
 * DELETE /api/channels/:channelId/messages/:messageId/reactions/:emoji
 * Remove a reaction
 */
router.delete('/:messageId/reactions/:emoji', async (req, res) => {
    const { channelId, messageId, emoji } = getParams(req);
    const userId = req.query['userId'] as string | undefined;

    const success = await messageService.removeReaction(
        channelId,
        messageId ?? '',
        decodeURIComponent(emoji ?? ''),
        userId
    );

    if (!success) {
        res.status(400).json({ success: false, error: 'Failed to remove reaction', code: 'REACTION_REMOVE_FAILED' });
        return;
    }

    res.json({ success: true, data: { removed: true } });
});

/**
 * DELETE /api/channels/:channelId/messages/:messageId/reactions
 * Remove all reactions from a message
 */
router.delete('/:messageId/reactions', async (req, res) => {
    const { channelId, messageId } = getParams(req);

    const success = await messageService.removeAllReactions(channelId, messageId ?? '');

    if (!success) {
        res.status(400).json({ success: false, error: 'Failed to remove reactions', code: 'REACTIONS_REMOVE_FAILED' });
        return;
    }

    res.json({ success: true, data: { removed: true } });
});

/**
 * GET /api/channels/:channelId/messages/:messageId/reactions/:emoji/users
 * Get users who reacted with a specific emoji
 */
router.get('/:messageId/reactions/:emoji/users', async (req, res) => {
    const { channelId, messageId, emoji } = getParams(req);
    const limit = parseInt(req.query['limit'] as string) || 100;

    const users = await messageService.getReactionUsers(
        channelId,
        messageId ?? '',
        decodeURIComponent(emoji ?? ''),
        limit
    );

    res.json({ success: true, data: users });
});

/**
 * POST /api/channels/:channelId/messages/:messageId/pin
 * Pin a message
 */
router.post('/:messageId/pin', async (req, res) => {
    const { channelId, messageId } = getParams(req);

    const success = await messageService.pinMessage(channelId, messageId ?? '');

    if (!success) {
        res.status(400).json({ success: false, error: 'Failed to pin message', code: 'PIN_FAILED' });
        return;
    }

    res.json({ success: true, data: { pinned: true } });
});

/**
 * DELETE /api/channels/:channelId/messages/:messageId/pin
 * Unpin a message
 */
router.delete('/:messageId/pin', async (req, res) => {
    const { channelId, messageId } = getParams(req);

    const success = await messageService.unpinMessage(channelId, messageId ?? '');

    if (!success) {
        res.status(400).json({ success: false, error: 'Failed to unpin message', code: 'UNPIN_FAILED' });
        return;
    }

    res.json({ success: true, data: { unpinned: true } });
});

/**
 * POST /api/channels/:channelId/messages/:messageId/crosspost
 * Crosspost a message (for announcement channels)
 */
router.post('/:messageId/crosspost', async (req, res) => {
    const { channelId, messageId } = getParams(req);

    const success = await messageService.crosspostMessage(channelId, messageId ?? '');

    if (!success) {
        res.status(400).json({ success: false, error: 'Failed to crosspost message', code: 'CROSSPOST_FAILED' });
        return;
    }

    res.json({ success: true, data: { crossposted: true } });
});

export default router;
