import { Router, type Request, type Response } from 'express';
import { memberService } from '../../discord/services/index.js';
import { BanMemberSchema, ModifyRolesSchema, SetNicknameSchema } from '../../types/api.types.js';
import type { ApiResponse } from '../../types/api.types.js';
import type { SerializedMember } from '../../types/discord.types.js';

const router = Router({ mergeParams: true });

// Helper to get merged params
function getParams(req: Request): { guildId: string; userId?: string } {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params = req.params as any;
    return { guildId: params.guildId ?? '', userId: params.userId };
}

/**
 * GET /api/guilds/:guildId/members
 * List all members in a guild
 */
router.get('/', async (req, res) => {
    const { guildId } = getParams(req);
    const limit = parseInt(req.query['limit'] as string) || 1000;

    const members = await memberService.getMembers(guildId, limit);
    const response: ApiResponse<SerializedMember[]> = { success: true, data: members };
    res.json(response);
});

/**
 * GET /api/guilds/:guildId/members/search
 * Search members by query
 */
router.get('/search', async (req, res) => {
    const { guildId } = getParams(req);
    const query = req.query['q'] as string;
    const limit = parseInt(req.query['limit'] as string) || 20;

    if (!query) {
        res.status(400).json({ success: false, error: 'Missing query parameter', code: 'MISSING_QUERY' });
        return;
    }

    const members = await memberService.searchMembers(guildId, query, limit);
    res.json({ success: true, data: members });
});

/**
 * GET /api/guilds/:guildId/members/:userId
 * Get a specific member
 */
router.get('/:userId', async (req, res) => {
    const { guildId, userId } = getParams(req);
    const member = await memberService.getMember(guildId, userId ?? '');

    if (!member) {
        res.status(404).json({ success: false, error: 'Member not found', code: 'MEMBER_NOT_FOUND' });
        return;
    }

    res.json({ success: true, data: member });
});

/**
 * POST /api/guilds/:guildId/members/:userId/kick
 * Kick a member
 */
router.post('/:userId/kick', async (req, res) => {
    const { guildId, userId } = getParams(req);
    const reason = req.body?.reason as string | undefined;

    const success = await memberService.kickMember(guildId, userId ?? '', reason);

    if (!success) {
        res.status(400).json({ success: false, error: 'Failed to kick member', code: 'KICK_FAILED' });
        return;
    }

    res.json({ success: true, data: { kicked: true } });
});

/**
 * POST /api/guilds/:guildId/members/:userId/ban
 * Ban a member
 */
router.post('/:userId/ban', async (req, res) => {
    const { guildId, userId } = getParams(req);

    const result = BanMemberSchema.safeParse(req.body);
    if (!result.success) {
        res.status(400).json({ success: false, error: 'Invalid request body', details: result.error.issues });
        return;
    }

    const success = await memberService.banMember(guildId, userId ?? '', result.data);

    if (!success) {
        res.status(400).json({ success: false, error: 'Failed to ban member', code: 'BAN_FAILED' });
        return;
    }

    res.json({ success: true, data: { banned: true } });
});

/**
 * DELETE /api/guilds/:guildId/bans/:userId
 * Unban a user
 */
router.delete('/bans/:userId', async (req, res) => {
    const { guildId, userId } = getParams(req);
    const reason = req.body?.reason as string | undefined;

    const success = await memberService.unbanMember(guildId, userId ?? '', reason);

    if (!success) {
        res.status(400).json({ success: false, error: 'Failed to unban user', code: 'UNBAN_FAILED' });
        return;
    }

    res.json({ success: true, data: { unbanned: true } });
});

/**
 * PATCH /api/guilds/:guildId/members/:userId/nickname
 * Set or clear a member's nickname
 */
router.patch('/:userId/nickname', async (req, res) => {
    const { guildId, userId } = getParams(req);

    const result = SetNicknameSchema.safeParse(req.body);
    if (!result.success) {
        res.status(400).json({ success: false, error: 'Invalid request body', details: result.error.issues });
        return;
    }

    const member = await memberService.setNickname(guildId, userId ?? '', result.data);

    if (!member) {
        res.status(400).json({ success: false, error: 'Failed to set nickname', code: 'NICKNAME_FAILED' });
        return;
    }

    res.json({ success: true, data: member });
});

/**
 * PATCH /api/guilds/:guildId/members/:userId/roles
 * Modify member roles (add/remove)
 */
router.patch('/:userId/roles', async (req, res) => {
    const { guildId, userId } = getParams(req);

    const result = ModifyRolesSchema.safeParse(req.body);
    if (!result.success) {
        res.status(400).json({ success: false, error: 'Invalid request body', details: result.error.issues });
        return;
    }

    const member = await memberService.modifyRoles(guildId, userId ?? '', result.data);

    if (!member) {
        res.status(400).json({ success: false, error: 'Failed to modify roles', code: 'ROLES_FAILED' });
        return;
    }

    res.json({ success: true, data: member });
});

/**
 * POST /api/guilds/:guildId/members/:userId/timeout
 * Timeout a member
 */
router.post('/:userId/timeout', async (req, res) => {
    const { guildId, userId } = getParams(req);
    const { duration, reason } = req.body as { duration?: number; reason?: string };

    if (!duration || typeof duration !== 'number') {
        res.status(400).json({ success: false, error: 'Duration is required (in milliseconds)', code: 'MISSING_DURATION' });
        return;
    }

    const member = await memberService.timeoutMember(guildId, userId ?? '', duration, reason);

    if (!member) {
        res.status(400).json({ success: false, error: 'Failed to timeout member', code: 'TIMEOUT_FAILED' });
        return;
    }

    res.json({ success: true, data: member });
});

/**
 * DELETE /api/guilds/:guildId/members/:userId/timeout
 * Remove timeout from a member
 */
router.delete('/:userId/timeout', async (req, res) => {
    const { guildId, userId } = getParams(req);
    const reason = req.body?.reason as string | undefined;

    const member = await memberService.removeTimeout(guildId, userId ?? '', reason);

    if (!member) {
        res.status(400).json({ success: false, error: 'Failed to remove timeout', code: 'TIMEOUT_REMOVE_FAILED' });
        return;
    }

    res.json({ success: true, data: member });
});

export default router;
