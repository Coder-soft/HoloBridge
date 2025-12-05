import { discordClient } from '../client.js';
import { serializeGuild, serializeChannel, serializeRole } from '../serializers.js';
import type { SerializedGuild, SerializedChannel, SerializedRole } from '../../types/discord.types.js';

export class GuildService {
    /**
     * Get all guilds the bot is in
     */
    async getGuilds(): Promise<SerializedGuild[]> {
        return discordClient.guilds.cache.map(serializeGuild);
    }

    /**
     * Get a specific guild by ID
     */
    async getGuild(guildId: string): Promise<SerializedGuild | null> {
        const guild = discordClient.guilds.cache.get(guildId);
        if (!guild) return null;
        return serializeGuild(guild);
    }

    /**
     * Fetch and refresh guild from API
     */
    async fetchGuild(guildId: string): Promise<SerializedGuild | null> {
        try {
            const guild = await discordClient.guilds.fetch(guildId);
            return serializeGuild(guild);
        } catch {
            return null;
        }
    }

    /**
     * Get all channels in a guild
     */
    async getGuildChannels(guildId: string): Promise<SerializedChannel[]> {
        const guild = discordClient.guilds.cache.get(guildId);
        if (!guild) return [];

        await guild.channels.fetch();
        return guild.channels.cache.map(serializeChannel);
    }

    /**
     * Get all roles in a guild
     */
    async getGuildRoles(guildId: string): Promise<SerializedRole[]> {
        const guild = discordClient.guilds.cache.get(guildId);
        if (!guild) return [];

        await guild.roles.fetch();
        return guild.roles.cache.map(serializeRole).sort((a, b) => b.position - a.position);
    }

    /**
     * Get all emojis in a guild
     */
    async getGuildEmojis(guildId: string): Promise<Array<{ id: string; name: string | null; animated: boolean; url: string }>> {
        const guild = discordClient.guilds.cache.get(guildId);
        if (!guild) return [];

        await guild.emojis.fetch();
        return guild.emojis.cache.map((e) => ({
            id: e.id,
            name: e.name,
            animated: e.animated ?? false,
            url: e.url,
        }));
    }

    /**
     * Get guild member count (cached)
     */
    getMemberCount(guildId: string): number {
        const guild = discordClient.guilds.cache.get(guildId);
        return guild?.memberCount ?? 0;
    }

    /**
     * Get guild bans
     */
    async getGuildBans(guildId: string): Promise<Array<{ reason: string | null; userId: string; username: string }>> {
        const guild = discordClient.guilds.cache.get(guildId);
        if (!guild) return [];

        const bans = await guild.bans.fetch();
        return bans.map((ban) => ({
            reason: ban.reason ?? null,
            userId: ban.user.id,
            username: ban.user.username,
        }));
    }

    /**
     * Get guild invites
     */
    async getGuildInvites(guildId: string): Promise<Array<{
        code: string;
        inviterId: string | null;
        channelId: string | null;
        uses: number;
        maxUses: number;
        maxAge: number;
        temporary: boolean;
        createdAt: string;
    }>> {
        const guild = discordClient.guilds.cache.get(guildId);
        if (!guild) return [];

        const invites = await guild.invites.fetch();
        return invites.map((invite) => ({
            code: invite.code,
            inviterId: invite.inviter?.id ?? null,
            channelId: invite.channelId,
            uses: invite.uses ?? 0,
            maxUses: invite.maxUses ?? 0,
            maxAge: invite.maxAge ?? 0,
            temporary: invite.temporary ?? false,
            createdAt: invite.createdAt?.toISOString() ?? new Date().toISOString(),
        }));
    }
}

export const guildService = new GuildService();
