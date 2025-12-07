import { Router } from 'express';
import { scheduledEventService } from '../../discord/services/index.js';
import type { ApiResponse } from '../../types/api.types.js';
import type { SerializedScheduledEvent, SerializedUser } from '../../types/discord.types.js';

const router = Router({ mergeParams: true });

/**
 * GET /api/guilds/:guildId/scheduled-events
 * List all scheduled events in a guild
 */
router.get('/', async (req, res) => {
    const { guildId } = req.params as any;
    const events = await scheduledEventService.getGuildEvents(guildId as string);
    const response: ApiResponse<SerializedScheduledEvent[]> = { success: true, data: events };
    res.json(response);
});

/**
 * GET /api/guilds/:guildId/scheduled-events/:eventId
 * Get a specific scheduled event
 */
router.get('/:eventId', async (req, res) => {
    const { guildId, eventId } = req.params as any;
    const event = await scheduledEventService.getEvent(guildId as string, eventId as string);

    if (!event) {
        res.status(404).json({ success: false, error: 'Event not found', code: 'EVENT_NOT_FOUND' });
        return;
    }

    const response: ApiResponse<SerializedScheduledEvent> = { success: true, data: event };
    res.json(response);
});

/**
 * POST /api/guilds/:guildId/scheduled-events
 * Create a new scheduled event
 */
router.post('/', async (req, res) => {
    const { guildId } = req.params as any;
    const event = await scheduledEventService.createEvent(guildId as string, req.body);

    if (!event) {
        res.status(400).json({ success: false, error: 'Failed to create event', code: 'EVENT_CREATE_FAILED' });
        return;
    }

    const response: ApiResponse<SerializedScheduledEvent> = { success: true, data: event };
    res.status(201).json(response);
});

/**
 * PATCH /api/guilds/:guildId/scheduled-events/:eventId
 * Edit a scheduled event
 */
router.patch('/:eventId', async (req, res) => {
    const { guildId, eventId } = req.params as any;
    const event = await scheduledEventService.editEvent(guildId as string, eventId as string, req.body);

    if (!event) {
        res.status(404).json({ success: false, error: 'Event not found or failed to update', code: 'EVENT_UPDATE_FAILED' });
        return;
    }

    const response: ApiResponse<SerializedScheduledEvent> = { success: true, data: event };
    res.json(response);
});

/**
 * DELETE /api/guilds/:guildId/scheduled-events/:eventId
 * Delete a scheduled event
 */
router.delete('/:eventId', async (req, res) => {
    const { guildId, eventId } = req.params as any;
    const success = await scheduledEventService.deleteEvent(guildId as string, eventId as string);

    if (!success) {
        res.status(404).json({ success: false, error: 'Event not found or failed to delete', code: 'EVENT_DELETE_FAILED' });
        return;
    }

    res.json({ success: true });
});

/**
 * GET /api/guilds/:guildId/scheduled-events/:eventId/users
 * Get users subscribed to an event
 */
router.get('/:eventId/users', async (req, res) => {
    const { guildId, eventId } = req.params as any;
    const users = await scheduledEventService.getEventUsers(guildId as string, eventId as string);
    const response: ApiResponse<SerializedUser[]> = { success: true, data: users };
    res.json(response);
});

export default router;
