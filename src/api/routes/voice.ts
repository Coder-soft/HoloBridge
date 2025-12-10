import { Router } from 'express';
import { z } from 'zod';
import * as voiceService from '../../discord/services/voice.service.js';
import { ApiError } from '../middleware/errorHandler.js';

const router = Router({ mergeParams: true });

// Schema for joining a channel
const JoinChannelSchema = z.object({
    channelId: z.string().min(1),
});

// Schema for playing audio
const PlayAudioSchema = z.object({
    url: z.string().url(),
});

// Helper type for guild params
interface GuildParams {
    guildId: string;
}

/**
 * Join a voice channel
 * POST /api/guilds/:guildId/voice/join
 */
router.post('/join', async (req: any, res, next) => {
    try {
        const { guildId } = req.params;
        if (!guildId) {throw ApiError.badRequest('Guild ID required');}

        const { channelId } = JoinChannelSchema.parse(req.body);

        await voiceService.joinChannel(guildId, channelId);

        res.json({ success: true, message: 'Joined voice channel' });
    } catch (error) {
        next(error);
    }
});

/**
 * Leave a voice channel
 * POST /api/guilds/:guildId/voice/leave
 */
router.post('/leave', async (req: any, res, next) => {
    try {
        const { guildId } = req.params;
        if (!guildId) {throw ApiError.badRequest('Guild ID required');}

        await voiceService.leaveChannel(guildId);

        res.json({ success: true, message: 'Left voice channel' });
    } catch (error) {
        next(error);
    }
});

/**
 * Play audio
 * POST /api/guilds/:guildId/voice/play
 */
router.post('/play', async (req: any, res, next) => {
    try {
        const { guildId } = req.params;
        if (!guildId) {throw ApiError.badRequest('Guild ID required');}

        const { url } = PlayAudioSchema.parse(req.body);

        await voiceService.playAudio(guildId, url);

        res.json({ success: true, message: 'Started playing audio' });
    } catch (error) {
        next(error);
    }
});

/**
 * Get voice status
 * GET /api/guilds/:guildId/voice
 */
router.get('/', (req: any, res, next) => {
    try {
        const { guildId } = req.params;
        if (!guildId) {throw ApiError.badRequest('Guild ID required');}

        const status = voiceService.getVoiceStatus(guildId);

        res.json({ success: true, data: status });
    } catch (error) {
        next(error);
    }
});

export default router;
