import { Router } from 'express';
import { channelService } from '../../discord/services/index.js';
import { CreateChannelSchema, EditChannelSchema, CreateThreadSchema } from '../../types/api.types.js';

const router = Router();

/**
 * GET /api/channels/:channelId
 * Get a channel by ID
 */
router.get('/:channelId', async (req, res) => {
    const { channelId } = req.params;
    const channel = await channelService.getChannel(channelId);

    if (!channel) {
        res.status(404).json({ success: false, error: 'Channel not found', code: 'CHANNEL_NOT_FOUND' });
        return;
    }

    res.json({ success: true, data: channel });
});

/**
 * POST /api/guilds/:guildId/channels
 * Create a new channel
 */
router.post('/guilds/:guildId/channels', async (req, res) => {
    const { guildId } = req.params;

    const result = CreateChannelSchema.safeParse(req.body);
    if (!result.success) {
        res.status(400).json({ success: false, error: 'Invalid request body', details: result.error.issues });
        return;
    }

    const channel = await channelService.createChannel(guildId, result.data);

    if (!channel) {
        res.status(400).json({ success: false, error: 'Failed to create channel', code: 'CREATE_FAILED' });
        return;
    }

    res.status(201).json({ success: true, data: channel });
});

/**
 * PATCH /api/channels/:channelId
 * Edit a channel
 */
router.patch('/:channelId', async (req, res) => {
    const { channelId } = req.params;

    const result = EditChannelSchema.safeParse(req.body);
    if (!result.success) {
        res.status(400).json({ success: false, error: 'Invalid request body', details: result.error.issues });
        return;
    }

    const channel = await channelService.editChannel(channelId, result.data);

    if (!channel) {
        res.status(400).json({ success: false, error: 'Failed to edit channel', code: 'EDIT_FAILED' });
        return;
    }

    res.json({ success: true, data: channel });
});

/**
 * DELETE /api/channels/:channelId
 * Delete a channel
 */
router.delete('/:channelId', async (req, res) => {
    const { channelId } = req.params;
    const reason = req.body?.reason as string | undefined;

    const success = await channelService.deleteChannel(channelId, reason);

    if (!success) {
        res.status(400).json({ success: false, error: 'Failed to delete channel', code: 'DELETE_FAILED' });
        return;
    }

    res.json({ success: true, data: { deleted: true } });
});

/**
 * POST /api/channels/:channelId/threads
 * Create a thread
 */
router.post('/:channelId/threads', async (req, res) => {
    const { channelId } = req.params;
    const messageId = req.query['messageId'] as string | undefined;

    const result = CreateThreadSchema.safeParse(req.body);
    if (!result.success) {
        res.status(400).json({ success: false, error: 'Invalid request body', details: result.error.issues });
        return;
    }

    const thread = await channelService.createThread(channelId, result.data, messageId);

    if (!thread) {
        res.status(400).json({ success: false, error: 'Failed to create thread', code: 'THREAD_CREATE_FAILED' });
        return;
    }

    res.status(201).json({ success: true, data: thread });
});

/**
 * GET /api/channels/:channelId/threads
 * Get all threads in a channel
 */
router.get('/:channelId/threads', async (req, res) => {
    const { channelId } = req.params;
    const threads = await channelService.getThreads(channelId);
    res.json({ success: true, data: threads });
});

/**
 * POST /api/channels/:channelId/archive
 * Archive a thread
 */
router.post('/:channelId/archive', async (req, res) => {
    const { channelId } = req.params;
    const success = await channelService.archiveThread(channelId, true);

    if (!success) {
        res.status(400).json({ success: false, error: 'Failed to archive thread', code: 'ARCHIVE_FAILED' });
        return;
    }

    res.json({ success: true, data: { archived: true } });
});

/**
 * DELETE /api/channels/:channelId/archive
 * Unarchive a thread
 */
router.delete('/:channelId/archive', async (req, res) => {
    const { channelId } = req.params;
    const success = await channelService.archiveThread(channelId, false);

    if (!success) {
        res.status(400).json({ success: false, error: 'Failed to unarchive thread', code: 'UNARCHIVE_FAILED' });
        return;
    }

    res.json({ success: true, data: { archived: false } });
});

/**
 * POST /api/channels/:channelId/lock
 * Lock a thread
 */
router.post('/:channelId/lock', async (req, res) => {
    const { channelId } = req.params;
    const success = await channelService.lockThread(channelId, true);

    if (!success) {
        res.status(400).json({ success: false, error: 'Failed to lock thread', code: 'LOCK_FAILED' });
        return;
    }

    res.json({ success: true, data: { locked: true } });
});

/**
 * DELETE /api/channels/:channelId/lock
 * Unlock a thread
 */
router.delete('/:channelId/lock', async (req, res) => {
    const { channelId } = req.params;
    const success = await channelService.lockThread(channelId, false);

    if (!success) {
        res.status(400).json({ success: false, error: 'Failed to unlock thread', code: 'UNLOCK_FAILED' });
        return;
    }

    res.json({ success: true, data: { locked: false } });
});

/**
 * POST /api/channels/:channelId/clone
 * Clone a channel
 */
router.post('/:channelId/clone', async (req, res) => {
    const { channelId } = req.params;
    const name = req.body?.name as string | undefined;

    const channel = await channelService.cloneChannel(channelId, name);

    if (!channel) {
        res.status(400).json({ success: false, error: 'Failed to clone channel', code: 'CLONE_FAILED' });
        return;
    }

    res.status(201).json({ success: true, data: channel });
});

/**
 * GET /api/channels/:channelId/webhooks
 * Get webhooks for a channel
 */
router.get('/:channelId/webhooks', async (req, res) => {
    const { channelId } = req.params;
    const webhooks = await channelService.getWebhooks(channelId);
    res.json({ success: true, data: webhooks });
});

export default router;
