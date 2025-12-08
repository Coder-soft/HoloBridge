import { Router } from 'express';
import type { Request } from 'express';
import { z } from 'zod';
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

/**
 * Zod schema for AutoMod action
 */
const autoModActionSchema = z.object({
    type: z.number().int().min(1).max(4), // 1=BlockMessage, 2=SendAlertMessage, 3=Timeout, 4=BlockMemberInteraction
    metadata: z.object({
        channelId: z.string().optional(),
        durationSeconds: z.number().int().min(0).max(2419200).optional(), // Max 28 days
        customMessage: z.string().max(150).optional(),
    }).optional(),
});

/**
 * Zod schema for AutoMod trigger metadata
 */
const triggerMetadataSchema = z.object({
    keywordFilter: z.array(z.string().max(60)).max(1000).optional(),
    regexPatterns: z.array(z.string().max(260)).max(10).optional(),
    presets: z.array(z.number().int().min(1).max(3)).optional(), // 1=Profanity, 2=SexualContent, 3=Slurs
    allowList: z.array(z.string().max(60)).max(100).optional(),
    mentionTotalLimit: z.number().int().min(1).max(50).optional(),
    mentionRaidProtectionEnabled: z.boolean().optional(),
}).optional();

/**
 * Zod schema for creating an AutoMod rule
 * Validates against Discord's AutoModerationRuleCreateOptions
 */
const createAutoModRuleSchema = z.object({
    name: z.string().min(1).max(100),
    eventType: z.number().int().min(1).max(1), // Currently only 1 (MessageSend) is valid
    triggerType: z.number().int().min(1).max(6), // 1=Keyword, 3=Spam, 4=KeywordPreset, 5=MentionSpam, 6=MemberProfile
    actions: z.array(autoModActionSchema).min(1).max(5),
    triggerMetadata: triggerMetadataSchema,
    enabled: z.boolean().optional().default(true),
    exemptRoles: z.array(z.string()).max(20).optional(),
    exemptChannels: z.array(z.string()).max(50).optional(),
    reason: z.string().max(512).optional(),
});

/**
 * Zod schema for updating an AutoMod rule (all fields optional)
 */
const updateAutoModRuleSchema = createAutoModRuleSchema.partial();

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

        // Validate request body
        const parseResult = createAutoModRuleSchema.safeParse(req.body);
        if (!parseResult.success) {
            res.status(400).json({
                success: false,
                error: 'Validation failed',
                code: 'VALIDATION_ERROR',
                issues: parseResult.error.issues.map(issue => ({
                    path: issue.path.join('.'),
                    message: issue.message,
                })),
            });
            return;
        }

        const validatedData = parseResult.data;
        const rule = await autoModService.createAutoModRule(guildId, validatedData);

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

        // Validate request body
        const parseResult = updateAutoModRuleSchema.safeParse(req.body);
        if (!parseResult.success) {
            res.status(400).json({
                success: false,
                error: 'Invalid request body',
                code: 'VALIDATION_ERROR',
                details: parseResult.error.issues,
            });
            return;
        }

        const validatedData = parseResult.data;
        const rule = await autoModService.editAutoModRule(guildId, ruleId, validatedData);

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
