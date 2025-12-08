import { Router } from 'express';
import type { Request } from 'express';
import { autoModService } from '../../discord/services/index.js';
import type { ApiResponse } from '../../types/api.types.js';
import type { SerializedAutoModRule } from '../../types/discord.types.js';

/** Route params for guild-level endpoints */
interface GuildParams {
    guildId: string;
}

/** Route params for rule-specific endpoints */
interface GuildRuleParams extends GuildParams {
    ruleId: string;
}

const router = Router({ mergeParams: true });

/**
 * GET /api/guilds/:guildId/auto-moderation/rules
 * List all auto-moderation rules in a guild
 */
router.get('/rules', async (req: Request<GuildParams>, res) => {
    try {
        const { guildId } = req.params;
        const rules = await autoModService.getAutoModRules(guildId);
        const response: ApiResponse<SerializedAutoModRule[]> = { success: true, data: rules };
        res.json(response);
    } catch (error) {
        console.error('Error fetching auto-moderation rules:', error);
        res.status(500).json({ success: false, error: 'Internal server error', code: 'INTERNAL_SERVER_ERROR' });
    }
});

/**
 * GET /api/guilds/:guildId/auto-moderation/rules/:ruleId
 * Get a specific auto-moderation rule
 */
router.get('/rules/:ruleId', async (req: Request<GuildRuleParams>, res) => {
    try {
        const { guildId, ruleId } = req.params;
        const rule = await autoModService.getAutoModRule(guildId, ruleId);

        if (!rule) {
            res.status(404).json({ success: false, error: 'Rule not found', code: 'RULE_NOT_FOUND' });
            return;
        }

        const response: ApiResponse<SerializedAutoModRule> = { success: true, data: rule };
        res.json(response);
    } catch (error) {
        console.error('Error fetching auto-moderation rule:', error);
        res.status(500).json({ success: false, error: 'Internal server error', code: 'INTERNAL_SERVER_ERROR' });
    }
});

/**
 * POST /api/guilds/:guildId/auto-moderation/rules
 * Create a new auto-moderation rule
 */
router.post('/rules', async (req: Request<GuildParams>, res) => {
    try {
        const { guildId } = req.params;
        const rule = await autoModService.createAutoModRule(guildId, req.body);

        if (!rule) {
            res.status(400).json({ success: false, error: 'Failed to create rule', code: 'RULE_CREATE_FAILED' });
            return;
        }

        const response: ApiResponse<SerializedAutoModRule> = { success: true, data: rule };
        res.status(201).json(response);
    } catch (error) {
        console.error('Error creating auto-moderation rule:', error);
        res.status(500).json({ success: false, error: 'Internal server error', code: 'INTERNAL_SERVER_ERROR' });
    }
});

/**
 * PATCH /api/guilds/:guildId/auto-moderation/rules/:ruleId
 * Edit an auto-moderation rule
 */
router.patch('/rules/:ruleId', async (req: Request<GuildRuleParams>, res) => {
    try {
        const { guildId, ruleId } = req.params;
        const rule = await autoModService.editAutoModRule(guildId, ruleId, req.body);

        if (!rule) {
            res.status(404).json({ success: false, error: 'Rule not found or failed to update', code: 'RULE_UPDATE_FAILED' });
            return;
        }

        const response: ApiResponse<SerializedAutoModRule> = { success: true, data: rule };
        res.json(response);
    } catch (error) {
        console.error('Error updating auto-moderation rule:', error);
        res.status(500).json({ success: false, error: 'Internal server error', code: 'INTERNAL_SERVER_ERROR' });
    }
});

/**
 * DELETE /api/guilds/:guildId/auto-moderation/rules/:ruleId
 * Delete an auto-moderation rule
 */
router.delete('/rules/:ruleId', async (req: Request<GuildRuleParams>, res) => {
    try {
        const { guildId, ruleId } = req.params;
        const success = await autoModService.deleteAutoModRule(guildId, ruleId);

        if (!success) {
            res.status(404).json({ success: false, error: 'Rule not found or failed to delete', code: 'RULE_DELETE_FAILED' });
            return;
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting auto-moderation rule:', error);
        res.status(500).json({ success: false, error: 'Internal server error', code: 'INTERNAL_SERVER_ERROR' });
    }
});

export default router;
