import { Router, type Request } from 'express';
import { commandService } from '../../discord/services/index.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { CreateApplicationCommandSchema, EditApplicationCommandSchema } from '../../types/api.types.js';

const router = Router({ mergeParams: true });

// Helper to get merged params
function getParams(req: Request): { guildId?: string; commandId?: string } {
    const params = req.params as { guildId?: string; commandId?: string };
    return { guildId: params.guildId, commandId: params.commandId };
}

// ============================================================================
// Global Commands
// ============================================================================

/**
 * GET /api/commands
 * Get all global application commands
 */
router.get('/', asyncHandler(async (_req, res) => {
    const commands = await commandService.getGlobalCommands();
    res.json({ success: true, data: commands });
}));

/**
 * GET /api/commands/:commandId
 * Get a specific global application command
 */
router.get('/:commandId', asyncHandler(async (req, res) => {
    const { commandId } = getParams(req);
    if (!commandId) {
        res.status(400).json({ success: false, error: 'Command ID is required', code: 'MISSING_COMMAND_ID' });
        return;
    }

    const command = await commandService.getGlobalCommand(commandId);

    if (!command) {
        res.status(404).json({ success: false, error: 'Command not found', code: 'COMMAND_NOT_FOUND' });
        return;
    }

    res.json({ success: true, data: command });
}));

/**
 * POST /api/commands
 * Create a new global application command
 */
router.post('/', asyncHandler(async (req, res) => {
    const result = CreateApplicationCommandSchema.safeParse(req.body);
    if (!result.success) {
        res.status(400).json({ success: false, error: 'Invalid request body', details: result.error.issues });
        return;
    }

    const command = await commandService.createGlobalCommand(result.data);

    if (!command) {
        res.status(400).json({ success: false, error: 'Failed to create command', code: 'CREATE_FAILED' });
        return;
    }

    res.status(201).json({ success: true, data: command });
}));

/**
 * PATCH /api/commands/:commandId
 * Edit a global application command
 */
router.patch('/:commandId', asyncHandler(async (req, res) => {
    const { commandId } = getParams(req);
    if (!commandId) {
        res.status(400).json({ success: false, error: 'Command ID is required', code: 'MISSING_COMMAND_ID' });
        return;
    }

    const result = EditApplicationCommandSchema.safeParse(req.body);
    if (!result.success) {
        res.status(400).json({ success: false, error: 'Invalid request body', details: result.error.issues });
        return;
    }

    const command = await commandService.editGlobalCommand(commandId, result.data);

    if (!command) {
        res.status(400).json({ success: false, error: 'Failed to edit command', code: 'EDIT_FAILED' });
        return;
    }

    res.json({ success: true, data: command });
}));

/**
 * DELETE /api/commands/:commandId
 * Delete a global application command
 */
router.delete('/:commandId', asyncHandler(async (req, res) => {
    const { commandId } = getParams(req);
    if (!commandId) {
        res.status(400).json({ success: false, error: 'Command ID is required', code: 'MISSING_COMMAND_ID' });
        return;
    }

    const success = await commandService.deleteGlobalCommand(commandId);

    if (!success) {
        res.status(400).json({ success: false, error: 'Failed to delete command', code: 'DELETE_FAILED' });
        return;
    }

    res.json({ success: true, data: { deleted: true } });
}));

export default router;
