import { discordClient } from '../client.js';
import { serializeMember, serializeUser } from '../serializers.js';
import type { SerializedMember } from '../../types/discord.types.js';
import type { BanMemberInput, ModifyRolesInput, SetNicknameInput } from '../../types/api.types.js';

export class MemberService {
    /**
     * Get all members in a guild
     */
    async getMembers(guildId: string, limit = 1000): Promise<SerializedMember[]> {
        const guild = discordClient.guilds.cache.get(guildId);
        if (!guild) {return [];}

        const members = await guild.members.fetch({ limit });
        return members.map(serializeMember);
    }

    /**
     * Get a specific member by user ID
     */
    async getMember(guildId: string, userId: string): Promise<SerializedMember | null> {
        const guild = discordClient.guilds.cache.get(guildId);
        if (!guild) {return null;}

        try {
            const member = await guild.members.fetch(userId);
            return serializeMember(member);
        } catch {
            return null;
        }
    }

    /**
     * Search members by query
     */
    async searchMembers(guildId: string, query: string, limit = 20): Promise<SerializedMember[]> {
        const guild = discordClient.guilds.cache.get(guildId);
        if (!guild) {return [];}

        const members = await guild.members.search({ query, limit });
        return members.map(serializeMember);
    }

    /**
     * Kick a member from the guild
     */
    async kickMember(guildId: string, userId: string, reason?: string): Promise<boolean> {
        const guild = discordClient.guilds.cache.get(guildId);
        if (!guild) {return false;}

        try {
            await guild.members.kick(userId, reason);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Ban a member from the guild
     */
    async banMember(guildId: string, userId: string, options?: BanMemberInput): Promise<boolean> {
        const guild = discordClient.guilds.cache.get(guildId);
        if (!guild) {return false;}

        try {
            await guild.members.ban(userId, {
                reason: options?.reason,
                deleteMessageSeconds: options?.deleteMessageSeconds,
            });
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Unban a user from the guild
     */
    async unbanMember(guildId: string, userId: string, reason?: string): Promise<boolean> {
        const guild = discordClient.guilds.cache.get(guildId);
        if (!guild) {return false;}

        try {
            await guild.members.unban(userId, reason);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Set or clear a member's nickname
     */
    async setNickname(guildId: string, userId: string, input: SetNicknameInput): Promise<SerializedMember | null> {
        const guild = discordClient.guilds.cache.get(guildId);
        if (!guild) {return null;}

        try {
            const member = await guild.members.fetch(userId);
            await member.setNickname(input.nickname ?? null);
            return serializeMember(member);
        } catch {
            return null;
        }
    }

    /**
     * Modify member roles (add/remove)
     */
    async modifyRoles(guildId: string, userId: string, input: ModifyRolesInput): Promise<SerializedMember | null> {
        const guild = discordClient.guilds.cache.get(guildId);
        if (!guild) {return null;}

        try {
            const member = await guild.members.fetch(userId);

            if (input.add && input.add.length > 0) {
                await member.roles.add(input.add);
            }

            if (input.remove && input.remove.length > 0) {
                await member.roles.remove(input.remove);
            }

            // Refetch to get updated roles
            const updatedMember = await guild.members.fetch(userId);
            return serializeMember(updatedMember);
        } catch {
            return null;
        }
    }

    /**
     * Add a role to a member
     */
    async addRole(guildId: string, userId: string, roleId: string): Promise<boolean> {
        const guild = discordClient.guilds.cache.get(guildId);
        if (!guild) {return false;}

        try {
            const member = await guild.members.fetch(userId);
            await member.roles.add(roleId);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Remove a role from a member
     */
    async removeRole(guildId: string, userId: string, roleId: string): Promise<boolean> {
        const guild = discordClient.guilds.cache.get(guildId);
        if (!guild) {return false;}

        try {
            const member = await guild.members.fetch(userId);
            await member.roles.remove(roleId);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Timeout a member (communication disabled)
     */
    async timeoutMember(guildId: string, userId: string, durationMs: number, reason?: string): Promise<SerializedMember | null> {
        const guild = discordClient.guilds.cache.get(guildId);
        if (!guild) {return null;}

        try {
            const member = await guild.members.fetch(userId);
            await member.timeout(durationMs, reason);
            return serializeMember(member);
        } catch {
            return null;
        }
    }

    /**
     * Remove timeout from a member
     */
    async removeTimeout(guildId: string, userId: string, reason?: string): Promise<SerializedMember | null> {
        const guild = discordClient.guilds.cache.get(guildId);
        if (!guild) {return null;}

        try {
            const member = await guild.members.fetch(userId);
            await member.timeout(null, reason);
            return serializeMember(member);
        } catch {
            return null;
        }
    }

    /**
     * Get a user by ID (works for any user, not just guild members)
     */
    async getUser(userId: string) {
        try {
            const user = await discordClient.users.fetch(userId);
            return serializeUser(user);
        } catch {
            return null;
        }
    }
}

export const memberService = new MemberService();
