import { Router } from 'express';
import { guildService } from '../../discord/services/index.js';
import type { ApiResponse } from '../../types/api.types.js';
import type { SerializedGuild, SerializedChannel, SerializedRole } from '../../types/discord.types.js';

const router = Router();

/**
 * GET /api/guilds
 * List all guilds the bot is in
 */
router.get('/', async (req, res) => {
    const guilds = await guildService.getGuilds();
    const response: ApiResponse<SerializedGuild[]> = { success: true, data: guilds };
    res.json(response);
});

/**
 * GET /api/guilds/:guildId
 * Get a specific guild by ID
 */
router.get('/:guildId', async (req, res) => {
    const { guildId } = req.params;
    const guild = await guildService.getGuild(guildId);

    if (!guild) {
        res.status(404).json({ success: false, error: 'Guild not found', code: 'GUILD_NOT_FOUND' });
        return;
    }

    const response: ApiResponse<SerializedGuild> = { success: true, data: guild };
    res.json(response);
});

/**
 * GET /api/guilds/:guildId/channels
 * Get all channels in a guild
 */
router.get('/:guildId/channels', async (req, res) => {
    const { guildId } = req.params;
    const channels = await guildService.getGuildChannels(guildId);
    const response: ApiResponse<SerializedChannel[]> = { success: true, data: channels };
    res.json(response);
});

/**
 * GET /api/guilds/:guildId/roles
 * Get all roles in a guild
 */
router.get('/:guildId/roles', async (req, res) => {
    const { guildId } = req.params;
    const roles = await guildService.getGuildRoles(guildId);
    const response: ApiResponse<SerializedRole[]> = { success: true, data: roles };
    res.json(response);
});

/**
 * GET /api/guilds/:guildId/emojis
 * Get all emojis in a guild
 */
router.get('/:guildId/emojis', async (req, res) => {
    const { guildId } = req.params;
    const emojis = await guildService.getGuildEmojis(guildId);
    res.json({ success: true, data: emojis });
});

/**
 * GET /api/guilds/:guildId/bans
 * Get all bans in a guild
 */
router.get('/:guildId/bans', async (req, res) => {
    const { guildId } = req.params;
    const bans = await guildService.getGuildBans(guildId);
    res.json({ success: true, data: bans });
});

/**
 * GET /api/guilds/:guildId/invites
 * Get all invites in a guild
 */
router.get('/:guildId/invites', async (req, res) => {
    const { guildId } = req.params;
    const invites = await guildService.getGuildInvites(guildId);
    res.json({ success: true, data: invites });
});

export default router;
