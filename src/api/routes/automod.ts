import { Router } from 'express';
import { autoModService } from '../../discord/services/index.js';
import type { ApiResponse } from '../../types/api.types.js';
import type { SerializedAutoModRule } from '../../types/discord.types.js';

const router = Router({ mergeParams: true });

/**
 * GET /api/guilds/:guildId/auto-moderation/rules
 * List all auto-moderation rules in a guild
 */
router.get('/rules', async (req, res) => {
    const { guildId } = req.params as any;
    const rules = await autoModService.getAutoModRules(guildId as string);
    const response: ApiResponse<SerializedAutoModRule[]> = { success: true, data: rules };
    res.json(response);
});

/**
 * GET /api/guilds/:guildId/auto-moderation/rules/:ruleId
 * Get a specific auto-moderation rule
 */
router.get('/rules/:ruleId', async (req, res) => {
    const { guildId, ruleId } = req.params as any;
    const rule = await autoModService.getAutoModRule(guildId as string, ruleId as string);

    if (!rule) {
        res.status(404).json({ success: false, error: 'Rule not found', code: 'RULE_NOT_FOUND' });
        return;
    }

    const response: ApiResponse<SerializedAutoModRule> = { success: true, data: rule };
    res.json(response);
});

/**
 * POST /api/guilds/:guildId/auto-moderation/rules
 * Create a new auto-moderation rule
 */
router.post('/rules', async (req, res) => {
    const { guildId } = req.params as any;
    const rule = await autoModService.createAutoModRule(guildId as string, req.body);

    if (!rule) {
        res.status(400).json({ success: false, error: 'Failed to create rule', code: 'RULE_CREATE_FAILED' });
        return;
    }

    const response: ApiResponse<SerializedAutoModRule> = { success: true, data: rule };
    res.status(201).json(response);
});

/**
 * PATCH /api/guilds/:guildId/auto-moderation/rules/:ruleId
 * Edit an auto-moderation rule
 */
router.patch('/rules/:ruleId', async (req, res) => {
    const { guildId, ruleId } = req.params as any;
    const rule = await autoModService.editAutoModRule(guildId as string, ruleId as string, req.body);

    if (!rule) {
        res.status(404).json({ success: false, error: 'Rule not found or failed to update', code: 'RULE_UPDATE_FAILED' });
        return;
    }

    const response: ApiResponse<SerializedAutoModRule> = { success: true, data: rule };
    res.json(response);
});

/**
 * DELETE /api/guilds/:guildId/auto-moderation/rules/:ruleId
 * Delete an auto-moderation rule
 */
router.delete('/rules/:ruleId', async (req, res) => {
    const { guildId, ruleId } = req.params as any;
    const success = await autoModService.deleteAutoModRule(guildId as string, ruleId as string);

    if (!success) {
        res.status(404).json({ success: false, error: 'Rule not found or failed to delete', code: 'RULE_DELETE_FAILED' });
        return;
    }

    res.json({ success: true });
});

export default router;
