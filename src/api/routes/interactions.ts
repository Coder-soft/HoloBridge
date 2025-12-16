import { Router } from 'express';
import { z } from 'zod';

import { ApiError } from '../middleware/errorHandler.js';

const router = Router();

// Validation schema for interaction callback
const InteractionCallbackSchema = z.object({
    interactionId: z.string(),
    token: z.string(),
    type: z.enum(['reply', 'defer', 'update', 'deferUpdate', 'modal']),
    data: z.unknown().optional(), // Flexible data based on response type
});

/**
 * Handle interaction callbacks (responding to buttons, modals, etc.)
 * POST /api/interactions/callback
 */
router.post('/callback', async (req, res, next) => {
    try {
        const { interactionId, token, type, data } = InteractionCallbackSchema.parse(req.body);

        // We can't fetch the interaction object directly nicely without keeping a cache
        // or using the raw REST API.
        // Since Discord interactions require a response within 3s, and we might be crossing boundaries,
        // it's safest to use the REST API via the client.

        // However, discord.js "Interaction" objects are ephemeral.
        // We rely on the fact that we can hit the interaction callback endpoint using the token.

        // Construct the Discord API URL for the callback
        // Docs: https://discord.com/developers/docs/interactions/receiving-and-responding#interaction-callback

        const responseUrl = `https://discord.com/api/v10/interactions/${interactionId}/${token}/callback`;

        let body: { type: number; data?: unknown };

        // Map abstract types to Discord API response types
        // 4: ChannelMessageWithSource (reply)
        // 5: DeferredChannelMessageWithSource (defer)
        // 6: DeferredUpdateMessage (deferUpdate - for components)
        // 7: UpdateMessage (update - for components)
        // 9: Modal (modal)

        switch (type) {
            case 'reply':
                body = { type: 4, data: data };
                break;
            case 'defer':
                body = { type: 5, data: data };
                break;
            case 'deferUpdate':
                body = { type: 6 };
                break;
            case 'update':
                body = { type: 7, data: data };
                break;
            case 'modal':
                body = { type: 9, data: data };
                break;
        }

        const discordRes = await fetch(responseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // No Authorization header needed for interaction callbacks with token
            },
            body: JSON.stringify(body),
        });

        if (!discordRes.ok) {
            const errorText = await discordRes.text();
            throw ApiError.badRequest(`Discord API error: ${errorText}`);
        }

        res.json({ success: true });
    } catch (error) {
        next(error);
    }
});

export default router;
