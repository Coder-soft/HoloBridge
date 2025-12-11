import { Router, type Request } from 'express';
import { roleService } from '../../discord/services/index.js';
import { CreateRoleSchema, EditRoleSchema } from '../../types/api.types.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router({ mergeParams: true });

// Helper to get merged params
function getParams(req: Request): { guildId: string; roleId?: string } {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params = req.params as any;
    return { guildId: params.guildId ?? '', roleId: params.roleId };
}

/**
 * GET /api/guilds/:guildId/roles
 * Get all roles in a guild
 */
router.get('/', asyncHandler(async (req, res) => {
    const { guildId } = getParams(req);
    const roles = await roleService.getRoles(guildId);
    res.json({ success: true, data: roles });
}));

/**
 * GET /api/guilds/:guildId/roles/search
 * Search for a role by name
 */
router.get('/search', asyncHandler(async (req, res) => {
    const { guildId } = getParams(req);
    const name = req.query['name'] as string;

    if (!name) {
        res.status(400).json({ success: false, error: 'Missing name parameter', code: 'MISSING_NAME' });
        return;
    }

    const role = await roleService.getRoleByName(guildId, name);

    if (!role) {
        res.status(404).json({ success: false, error: 'Role not found', code: 'ROLE_NOT_FOUND' });
        return;
    }

    res.json({ success: true, data: role });
}));

/**
 * GET /api/guilds/:guildId/roles/:roleId
 * Get a specific role
 */
router.get('/:roleId', asyncHandler(async (req, res) => {
    const { guildId, roleId } = getParams(req);
    const role = await roleService.getRole(guildId, roleId ?? '');

    if (!role) {
        res.status(404).json({ success: false, error: 'Role not found', code: 'ROLE_NOT_FOUND' });
        return;
    }

    res.json({ success: true, data: role });
}));

/**
 * POST /api/guilds/:guildId/roles
 * Create a new role
 */
router.post('/', asyncHandler(async (req, res) => {
    const { guildId } = getParams(req);

    const result = CreateRoleSchema.safeParse(req.body);
    if (!result.success) {
        res.status(400).json({ success: false, error: 'Invalid request body', details: result.error.issues });
        return;
    }

    const role = await roleService.createRole(guildId, result.data);

    if (!role) {
        res.status(400).json({ success: false, error: 'Failed to create role', code: 'CREATE_FAILED' });
        return;
    }

    res.status(201).json({ success: true, data: role });
}));

/**
 * PATCH /api/guilds/:guildId/roles/:roleId
 * Edit a role
 */
router.patch('/:roleId', asyncHandler(async (req, res) => {
    const { guildId, roleId } = getParams(req);

    const result = EditRoleSchema.safeParse(req.body);
    if (!result.success) {
        res.status(400).json({ success: false, error: 'Invalid request body', details: result.error.issues });
        return;
    }

    const role = await roleService.editRole(guildId, roleId ?? '', result.data);

    if (!role) {
        res.status(400).json({ success: false, error: 'Failed to edit role', code: 'EDIT_FAILED' });
        return;
    }

    res.json({ success: true, data: role });
}));

/**
 * DELETE /api/guilds/:guildId/roles/:roleId
 * Delete a role
 */
router.delete('/:roleId', asyncHandler(async (req, res) => {
    const { guildId, roleId } = getParams(req);
    const reason = req.body?.reason as string | undefined;

    const success = await roleService.deleteRole(guildId, roleId ?? '', reason);

    if (!success) {
        res.status(400).json({ success: false, error: 'Failed to delete role', code: 'DELETE_FAILED' });
        return;
    }

    res.json({ success: true, data: { deleted: true } });
}));

/**
 * GET /api/guilds/:guildId/roles/:roleId/members
 * Get members with a specific role
 */
router.get('/:roleId/members', asyncHandler(async (req, res) => {
    const { guildId, roleId } = getParams(req);
    const memberIds = await roleService.getRoleMembers(guildId, roleId ?? '');
    res.json({ success: true, data: memberIds });
}));

/**
 * PATCH /api/guilds/:guildId/roles/:roleId/permissions
 * Set role permissions
 */
router.patch('/:roleId/permissions', asyncHandler(async (req, res) => {
    const { guildId, roleId } = getParams(req);
    const { permissions } = req.body as { permissions?: string };

    if (!permissions) {
        res.status(400).json({ success: false, error: 'Permissions bitfield is required', code: 'MISSING_PERMISSIONS' });
        return;
    }

    const success = await roleService.setRolePermissions(guildId, roleId ?? '', permissions);

    if (!success) {
        res.status(400).json({ success: false, error: 'Failed to set permissions', code: 'PERMISSIONS_FAILED' });
        return;
    }

    res.json({ success: true, data: { updated: true } });
}));

export default router;
