import { PermissionsBitField } from 'discord.js';
import { discordClient } from '../client.js';
import { serializeRole } from '../serializers.js';
import type { SerializedRole } from '../../types/discord.types.js';
import type { CreateRoleInput, EditRoleInput } from '../../types/api.types.js';

export class RoleService {
    /**
     * Get all roles in a guild
     */
    async getRoles(guildId: string): Promise<SerializedRole[]> {
        const guild = discordClient.guilds.cache.get(guildId);
        if (!guild) {return [];}

        await guild.roles.fetch();
        return guild.roles.cache
            .map(serializeRole)
            .sort((a, b) => b.position - a.position);
    }

    /**
     * Get a specific role by ID
     */
    async getRole(guildId: string, roleId: string): Promise<SerializedRole | null> {
        const guild = discordClient.guilds.cache.get(guildId);
        if (!guild) {return null;}

        try {
            const role = await guild.roles.fetch(roleId);
            if (!role) {return null;}
            return serializeRole(role);
        } catch {
            return null;
        }
    }

    /**
     * Create a new role
     */
    async createRole(guildId: string, input: CreateRoleInput): Promise<SerializedRole | null> {
        const guild = discordClient.guilds.cache.get(guildId);
        if (!guild) {return null;}

        try {
            const role = await guild.roles.create({
                name: input.name,
                color: input.color,
                hoist: input.hoist,
                mentionable: input.mentionable,
                permissions: input.permissions ? new PermissionsBitField(BigInt(input.permissions)) : undefined,
                icon: input.icon,
                unicodeEmoji: input.unicodeEmoji,
            });
            return serializeRole(role);
        } catch (error) {
            console.error('Failed to create role:', error);
            return null;
        }
    }

    /**
     * Edit an existing role
     */
    async editRole(guildId: string, roleId: string, input: EditRoleInput): Promise<SerializedRole | null> {
        const guild = discordClient.guilds.cache.get(guildId);
        if (!guild) {return null;}

        try {
            const role = await guild.roles.fetch(roleId);
            if (!role) {return null;}

            const edited = await role.edit({
                name: input.name,
                color: input.color,
                hoist: input.hoist,
                mentionable: input.mentionable,
                permissions: input.permissions ? new PermissionsBitField(BigInt(input.permissions)) : undefined,
                icon: input.icon,
                unicodeEmoji: input.unicodeEmoji,
                position: input.position,
            });
            return serializeRole(edited);
        } catch {
            return null;
        }
    }

    /**
     * Delete a role
     */
    async deleteRole(guildId: string, roleId: string, reason?: string): Promise<boolean> {
        const guild = discordClient.guilds.cache.get(guildId);
        if (!guild) {return false;}

        try {
            const role = await guild.roles.fetch(roleId);
            if (!role) {return false;}

            await role.delete(reason);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Set role position
     */
    async setRolePosition(guildId: string, roleId: string, position: number): Promise<boolean> {
        const guild = discordClient.guilds.cache.get(guildId);
        if (!guild) {return false;}

        try {
            const role = await guild.roles.fetch(roleId);
            if (!role) {return false;}

            await role.setPosition(position);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get members with a specific role
     */
    async getRoleMembers(guildId: string, roleId: string): Promise<string[]> {
        const guild = discordClient.guilds.cache.get(guildId);
        if (!guild) {return [];}

        try {
            const role = await guild.roles.fetch(roleId);
            if (!role) {return [];}

            return role.members.map((m) => m.id);
        } catch {
            return [];
        }
    }

    /**
     * Set role permissions
     */
    async setRolePermissions(guildId: string, roleId: string, permissions: string): Promise<boolean> {
        const guild = discordClient.guilds.cache.get(guildId);
        if (!guild) {return false;}

        try {
            const role = await guild.roles.fetch(roleId);
            if (!role) {return false;}

            await role.setPermissions(new PermissionsBitField(BigInt(permissions)));
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get role by name
     */
    async getRoleByName(guildId: string, name: string): Promise<SerializedRole | null> {
        const guild = discordClient.guilds.cache.get(guildId);
        if (!guild) {return null;}

        await guild.roles.fetch();
        const role = guild.roles.cache.find((r) => r.name.toLowerCase() === name.toLowerCase());
        return role ? serializeRole(role) : null;
    }
}

export const roleService = new RoleService();
