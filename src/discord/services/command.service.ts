import { discordClient } from '../client.js';
import { serializeApplicationCommand } from '../serializers.js';
import type { SerializedApplicationCommand } from '../../types/discord.types.js';
import type { CreateApplicationCommandInput, EditApplicationCommandInput } from '../../types/api.types.js';
import type { ApplicationCommandDataResolvable, PermissionResolvable } from 'discord.js';

/**
 * Convert a permissions string to a PermissionResolvable (bigint) or null
 */
function parsePermissions(permissions: string | null | undefined): PermissionResolvable | null | undefined {
    if (permissions === null) return null;
    if (permissions === undefined) return undefined;
    try {
        return BigInt(permissions);
    } catch {
        return null;
    }
}

/**
 * Service for managing Discord Application Commands (Slash Commands)
 */
export class CommandService {
    /**
     * Get all global commands
     */
    async getGlobalCommands(): Promise<SerializedApplicationCommand[]> {
        try {
            const commands = await discordClient.application?.commands.fetch();
            if (!commands) return [];
            return Array.from(commands.values()).map(serializeApplicationCommand);
        } catch (error) {
            console.error('Failed to fetch global commands:', error);
            return [];
        }
    }

    /**
     * Get a specific global command by ID
     */
    async getGlobalCommand(commandId: string): Promise<SerializedApplicationCommand | null> {
        try {
            const command = await discordClient.application?.commands.fetch(commandId);
            if (!command) return null;
            return serializeApplicationCommand(command);
        } catch {
            return null;
        }
    }

    /**
     * Create a global command
     */
    async createGlobalCommand(input: CreateApplicationCommandInput): Promise<SerializedApplicationCommand | null> {
        try {
            const commandData: ApplicationCommandDataResolvable = {
                name: input.name,
                description: input.description,
                type: input.type,
                options: input.options,
                defaultMemberPermissions: parsePermissions(input.default_member_permissions),
                dmPermission: input.dm_permission,
                nsfw: input.nsfw,
                nameLocalizations: input.name_localizations ?? undefined,
                descriptionLocalizations: input.description_localizations ?? undefined,
            };

            const command = await discordClient.application?.commands.create(commandData);
            if (!command) return null;
            return serializeApplicationCommand(command);
        } catch (error) {
            console.error('Failed to create global command:', error);
            return null;
        }
    }

    /**
     * Edit a global command
     */
    async editGlobalCommand(commandId: string, input: EditApplicationCommandInput): Promise<SerializedApplicationCommand | null> {
        try {
            const command = await discordClient.application?.commands.edit(commandId, {
                name: input.name,
                description: input.description,
                options: input.options,
                defaultMemberPermissions: parsePermissions(input.default_member_permissions),
                dmPermission: input.dm_permission,
                nsfw: input.nsfw,
                nameLocalizations: input.name_localizations ?? undefined,
                descriptionLocalizations: input.description_localizations ?? undefined,
            });
            if (!command) return null;
            return serializeApplicationCommand(command);
        } catch (error) {
            console.error('Failed to edit global command:', error);
            return null;
        }
    }

    /**
     * Delete a global command
     */
    async deleteGlobalCommand(commandId: string): Promise<boolean> {
        try {
            await discordClient.application?.commands.delete(commandId);
            return true;
        } catch (error) {
            console.error('Failed to delete global command:', error);
            return false;
        }
    }

    /**
     * Get all guild-specific commands
     */
    async getGuildCommands(guildId: string): Promise<SerializedApplicationCommand[]> {
        try {
            const guild = discordClient.guilds.cache.get(guildId);
            if (!guild) return [];

            const commands = await guild.commands.fetch();
            return Array.from(commands.values()).map(serializeApplicationCommand);
        } catch (error) {
            console.error('Failed to fetch guild commands:', error);
            return [];
        }
    }

    /**
     * Get a specific guild command by ID
     */
    async getGuildCommand(guildId: string, commandId: string): Promise<SerializedApplicationCommand | null> {
        try {
            const guild = discordClient.guilds.cache.get(guildId);
            if (!guild) return null;

            const command = await guild.commands.fetch(commandId);
            if (!command) return null;
            return serializeApplicationCommand(command);
        } catch {
            return null;
        }
    }

    /**
     * Create a guild-specific command
     */
    async createGuildCommand(guildId: string, input: CreateApplicationCommandInput): Promise<SerializedApplicationCommand | null> {
        try {
            const guild = discordClient.guilds.cache.get(guildId);
            if (!guild) return null;

            const commandData: ApplicationCommandDataResolvable = {
                name: input.name,
                description: input.description,
                type: input.type,
                options: input.options,
                defaultMemberPermissions: parsePermissions(input.default_member_permissions),
                dmPermission: input.dm_permission,
                nsfw: input.nsfw,
                nameLocalizations: input.name_localizations ?? undefined,
                descriptionLocalizations: input.description_localizations ?? undefined,
            };

            const command = await guild.commands.create(commandData);
            return serializeApplicationCommand(command);
        } catch (error) {
            console.error('Failed to create guild command:', error);
            return null;
        }
    }

    /**
     * Edit a guild-specific command
     */
    async editGuildCommand(guildId: string, commandId: string, input: EditApplicationCommandInput): Promise<SerializedApplicationCommand | null> {
        try {
            const guild = discordClient.guilds.cache.get(guildId);
            if (!guild) return null;

            const command = await guild.commands.edit(commandId, {
                name: input.name,
                description: input.description,
                options: input.options,
                defaultMemberPermissions: parsePermissions(input.default_member_permissions),
                dmPermission: input.dm_permission,
                nsfw: input.nsfw,
                nameLocalizations: input.name_localizations ?? undefined,
                descriptionLocalizations: input.description_localizations ?? undefined,
            });
            return serializeApplicationCommand(command);
        } catch (error) {
            console.error('Failed to edit guild command:', error);
            return null;
        }
    }

    /**
     * Delete a guild-specific command
     */
    async deleteGuildCommand(guildId: string, commandId: string): Promise<boolean> {
        try {
            const guild = discordClient.guilds.cache.get(guildId);
            if (!guild) return false;

            await guild.commands.delete(commandId);
            return true;
        } catch (error) {
            console.error('Failed to delete guild command:', error);
            return false;
        }
    }
}

export const commandService = new CommandService();
