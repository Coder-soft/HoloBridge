import { discordClient } from '../client.js';
import { serializeWebhook } from '../serializers.js';
import type { SerializedWebhook } from '../../types/discord.types.js';
import type { ChannelWebhookCreateOptions } from 'discord.js';

export class WebhookService {
    /**
     * Get all webhooks in a channel
     */
    async getChannelWebhooks(channelId: string): Promise<SerializedWebhook[]> {
        const channel = discordClient.channels.cache.get(channelId);
        if (!channel || !('fetchWebhooks' in channel)) return [];

        try {
            const webhooks = await channel.fetchWebhooks();
            return webhooks.map(serializeWebhook);
        } catch {
            return [];
        }
    }

    /**
     * Get all webhooks in a guild
     */
    async getGuildWebhooks(guildId: string): Promise<SerializedWebhook[]> {
        const guild = discordClient.guilds.cache.get(guildId);
        if (!guild) return [];

        try {
            const webhooks = await guild.fetchWebhooks();
            return webhooks.map(serializeWebhook);
        } catch {
            return [];
        }
    }

    /**
     * Get a specific webhook
     */
    async getWebhook(webhookId: string): Promise<SerializedWebhook | null> {
        try {
            const webhook = await discordClient.fetchWebhook(webhookId);
            return serializeWebhook(webhook);
        } catch {
            return null;
        }
    }

    /**
     * Create a webhook
     */
    async createWebhook(channelId: string, data: ChannelWebhookCreateOptions): Promise<SerializedWebhook | null> {
        const channel = discordClient.channels.cache.get(channelId);
        if (!channel || !('createWebhook' in channel)) return null;

        try {
            const webhook = await channel.createWebhook(data);
            return serializeWebhook(webhook);
        } catch {
            return null;
        }
    }

    /**
     * Edit a webhook
     */
    async editWebhook(webhookId: string, data: { name?: string; avatar?: string | null; channelId?: string }): Promise<SerializedWebhook | null> {
        try {
            const webhook = await discordClient.fetchWebhook(webhookId);
            const updated = await webhook.edit(data);
            return serializeWebhook(updated);
        } catch {
            return null;
        }
    }

    /**
     * Delete a webhook
     */
    async deleteWebhook(webhookId: string): Promise<boolean> {
        try {
            const webhook = await discordClient.fetchWebhook(webhookId);
            await webhook.delete();
            return true;
        } catch {
            return false;
        }
    }
}

export const webhookService = new WebhookService();
