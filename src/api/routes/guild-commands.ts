import { Router, type Request } from 'express';
import { commandService } from '../../discord/services/index.js';
import { CreateApplicationCommandSchema, EditApplicationCommandSchema } from '../../types/api.types.js';

const router = Router({ mergeParams: true });

// Helper to get merged params
function getParams(req: Request): { guildId: string; commandId?: string } {
    const params = req.params as { guildId?: string; commandId?: string };
    return { guildId: params.guildId ?? '', commandId: params.commandId };
}

// ============================================================================
// Guild-Specific Commands
// ============================================================================

/**
 * GET /api/guilds/:guildId/commands
 * Get all guild-specific application commands
 */
router.get('/', async (req, res) => {
    const { guildId } = getParams(req);
    const commands = await commandService.getGuildCommands(guildId);
    res.json({ success: true, data: commands });
});

/**
 * GET /api/guilds/:guildId/commands/:commandId
 * Get a specific guild application command
 */
router.get('/:commandId', async (req, res) => {
    const { guildId, commandId } = getParams(req);
    if (!commandId) {
        res.status(400).json({ success: false, error: 'Command ID is required', code: 'MISSING_COMMAND_ID' });
        return;
    }

    const command = await commandService.getGuildCommand(guildId, commandId);

    if (!command) {
        res.status(404).json({ success: false, error: 'Command not found', code: 'COMMAND_NOT_FOUND' });
        return;
    }

    res.json({ success: true, data: command });
});

/**
 * POST /api/guilds/:guildId/commands
 * Create a new guild-specific application command
 */
router.post('/', async (req, res) => {
    const { guildId } = getParams(req);

    const result = CreateApplicationCommandSchema.safeParse(req.body);
    if (!result.success) {
        res.status(400).json({ success: false, error: 'Invalid request body', details: result.error.issues });
        return;
    }

    const command = await commandService.createGuildCommand(guildId, result.data);

    if (!command) {
        res.status(400).json({ success: false, error: 'Failed to create command', code: 'CREATE_FAILED' });
        return;
    }

    res.status(201).json({ success: true, data: command });
});

/**
 * PATCH /api/guilds/:guildId/commands/:commandId
 * Edit a guild-specific application command
 */
router.patch('/:commandId', async (req, res) => {
    const { guildId, commandId } = getParams(req);
    if (!commandId) {
        res.status(400).json({ success: false, error: 'Command ID is required', code: 'MISSING_COMMAND_ID' });
        return;
    }

    const result = EditApplicationCommandSchema.safeParse(req.body);
    if (!result.success) {
        res.status(400).json({ success: false, error: 'Invalid request body', details: result.error.issues });
        return;
    }

    const command = await commandService.editGuildCommand(guildId, commandId, result.data);

    if (!command) {
        res.status(400).json({ success: false, error: 'Failed to edit command', code: 'EDIT_FAILED' });
        return;
    }

    res.json({ success: true, data: command });
});

/**
 * DELETE /api/guilds/:guildId/commands/:commandId
 * Delete a guild-specific application command
 */
router.delete('/:commandId', async (req, res) => {
    const { guildId, commandId } = getParams(req);
    if (!commandId) {
        res.status(400).json({ success: false, error: 'Command ID is required', code: 'MISSING_COMMAND_ID' });
        return;
    }

    const success = await commandService.deleteGuildCommand(guildId, commandId);

    if (!success) {
        res.status(400).json({ success: false, error: 'Failed to delete command', code: 'DELETE_FAILED' });
        return;
    }

    res.json({ success: true, data: { deleted: true } });
});

export default router;
