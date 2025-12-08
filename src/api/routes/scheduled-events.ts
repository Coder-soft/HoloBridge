import { Router } from 'express';
import type { Request } from 'express';
import { scheduledEventService } from '../../discord/services/index.js';
import type { ApiResponse } from '../../types/api.types.js';
import type { SerializedScheduledEvent, SerializedUser } from '../../types/discord.types.js';

/** Route params for guild-level endpoints */
interface GuildParams {
    guildId: string;
}

/** Route params for event-specific endpoints */
interface GuildEventParams extends GuildParams {
    eventId: string;
}

const router = Router({ mergeParams: true });

/**
 * GET /api/guilds/:guildId/scheduled-events
 * List all scheduled events in a guild
 */
router.get('/', async (req: Request<GuildParams>, res) => {
    try {
        const { guildId } = req.params;
        const events = await scheduledEventService.getGuildEvents(guildId);
        const response: ApiResponse<SerializedScheduledEvent[]> = { success: true, data: events };
        res.json(response);
    } catch (error) {
        console.error('Error fetching scheduled events:', error);
        res.status(500).json({ success: false, error: 'Internal server error', code: 'INTERNAL_SERVER_ERROR' });
    }
});

/**
 * GET /api/guilds/:guildId/scheduled-events/:eventId
 * Get a specific scheduled event
 */
router.get('/:eventId', async (req: Request<GuildEventParams>, res) => {
    try {
        const { guildId, eventId } = req.params;
        const event = await scheduledEventService.getEvent(guildId, eventId);

        if (!event) {
            res.status(404).json({ success: false, error: 'Event not found', code: 'EVENT_NOT_FOUND' });
            return;
        }

        const response: ApiResponse<SerializedScheduledEvent> = { success: true, data: event };
        res.json(response);
    } catch (error) {
        console.error('Error fetching scheduled event:', error);
        res.status(500).json({ success: false, error: 'Internal server error', code: 'INTERNAL_SERVER_ERROR' });
    }
});

/**
 * POST /api/guilds/:guildId/scheduled-events
 * Create a new scheduled event
 */
router.post('/', async (req: Request<GuildParams>, res) => {
    try {
        const { guildId } = req.params;
        const event = await scheduledEventService.createEvent(guildId, req.body);

        if (!event) {
            res.status(400).json({ success: false, error: 'Failed to create event', code: 'EVENT_CREATE_FAILED' });
            return;
        }

        const response: ApiResponse<SerializedScheduledEvent> = { success: true, data: event };
        res.status(201).json(response);
    } catch (error) {
        console.error('Error creating scheduled event:', error);
        res.status(500).json({ success: false, error: 'Internal server error', code: 'INTERNAL_SERVER_ERROR' });
    }
});

/**
 * PATCH /api/guilds/:guildId/scheduled-events/:eventId
 * Edit a scheduled event
 */
router.patch('/:eventId', async (req: Request<GuildEventParams>, res) => {
    try {
        const { guildId, eventId } = req.params;
        const event = await scheduledEventService.editEvent(guildId, eventId, req.body);

        if (!event) {
            res.status(404).json({ success: false, error: 'Event not found or failed to update', code: 'EVENT_UPDATE_FAILED' });
            return;
        }

        const response: ApiResponse<SerializedScheduledEvent> = { success: true, data: event };
        res.json(response);
    } catch (error) {
        console.error('Error updating scheduled event:', error);
        res.status(500).json({ success: false, error: 'Internal server error', code: 'INTERNAL_SERVER_ERROR' });
    }
});

/**
 * DELETE /api/guilds/:guildId/scheduled-events/:eventId
 * Delete a scheduled event
 */
router.delete('/:eventId', async (req: Request<GuildEventParams>, res) => {
    try {
        const { guildId, eventId } = req.params;
        const success = await scheduledEventService.deleteEvent(guildId, eventId);

        if (!success) {
            res.status(404).json({ success: false, error: 'Event not found or failed to delete', code: 'EVENT_DELETE_FAILED' });
            return;
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting scheduled event:', error);
        res.status(500).json({ success: false, error: 'Internal server error', code: 'INTERNAL_SERVER_ERROR' });
    }
});

/**
 * GET /api/guilds/:guildId/scheduled-events/:eventId/users
 * Get users subscribed to an event
 */
router.get('/:eventId/users', async (req: Request<GuildEventParams>, res) => {
    try {
        const { guildId, eventId } = req.params;
        const users = await scheduledEventService.getEventUsers(guildId, eventId);
        const response: ApiResponse<SerializedUser[]> = { success: true, data: users };
        res.json(response);
    } catch (error) {
        console.error('Error fetching event users:', error);
        res.status(500).json({ success: false, error: 'Internal server error', code: 'INTERNAL_SERVER_ERROR' });
    }
});

export default router;

