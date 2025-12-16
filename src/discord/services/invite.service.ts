import { discordClient } from '../client.js';
import { serializeInvite } from '../serializers.js';
import type { SerializedInvite } from '../../types/discord.types.js';
import type { InviteCreateOptions } from 'discord.js';

export class InviteService {
    /**
     * Get an invite by code
     */
    async getInvite(code: string): Promise<SerializedInvite | null> {
        try {
            const invite = await discordClient.fetchInvite(code);
            return serializeInvite(invite);
        } catch {
            return null;
        }
    }

    /**
     * Delete an invite
     */
    async deleteInvite(code: string): Promise<boolean> {
        try {
            const invite = await discordClient.fetchInvite(code);
            await invite.delete();
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get all invites in a guild
     */
    async getGuildInvites(guildId: string): Promise<SerializedInvite[]> {
        const guild = discordClient.guilds.cache.get(guildId);
        if (!guild) {return [];}

        const invites = await guild.invites.fetch();
        return invites.map(serializeInvite);
    }

    /**
     * Get all invites for a channel
     */
    async getChannelInvites(channelId: string): Promise<SerializedInvite[]> {
        const channel = discordClient.channels.cache.get(channelId);
        if (!channel || !channel.isTextBased() || !('createInvite' in channel)) {return [];}

        try {
            const invites = await channel.fetchInvites();
            return invites.map(serializeInvite);
        } catch {
            return [];
        }
    }

    /**
     * Create an invite for a channel
     */
    async createChannelInvite(channelId: string, data: InviteCreateOptions): Promise<SerializedInvite | null> {
        const channel = discordClient.channels.cache.get(channelId);
        if (!channel || !('createInvite' in channel)) {return null;}

        try {
            const invite = await channel.createInvite(data);
            return serializeInvite(invite);
        } catch {
            return null;
        }
    }
}

export const inviteService = new InviteService();
