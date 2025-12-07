import { discordClient } from '../client.js';
import { serializeStageInstance } from '../serializers.js';
import type { SerializedStageInstance } from '../../types/discord.types.js';
import type { StageInstanceCreateOptions, StageInstanceEditOptions } from 'discord.js';

export class StageInstanceService {
    /**
     * Get stage instance for a channel
     */
    async getStageInstance(channelId: string): Promise<SerializedStageInstance | null> {
        const channel = discordClient.channels.cache.get(channelId);
        if (!channel || !channel.isVoiceBased() || !channel.guild) return null;

        try {
            const stageInstance = await channel.guild.stageInstances.fetch(channelId);
            return stageInstance ? serializeStageInstance(stageInstance) : null;
        } catch {
            return null;
        }
    }

    /**
     * Create a new stage instance
     */
    async createStageInstance(channelId: string, topic: string, options?: Omit<StageInstanceCreateOptions, 'channelId' | 'topic'>): Promise<SerializedStageInstance | null> {
        const channel = discordClient.channels.cache.get(channelId);
        if (!channel || !channel.isVoiceBased() || !channel.guild) return null;

        const stageInstance = await channel.guild.stageInstances.create(channel as any, {
            topic,
            ...options
        });
        return serializeStageInstance(stageInstance);
    }

    /**
     * Edit a stage instance
     */
    async editStageInstance(channelId: string, data: StageInstanceEditOptions): Promise<SerializedStageInstance | null> {
        const channel = discordClient.channels.cache.get(channelId);
        if (!channel || !channel.isVoiceBased() || !channel.guild) return null;

        try {
            const stageInstance = await channel.guild.stageInstances.fetch(channelId);
            if (!stageInstance) return null;

            const updated = await stageInstance.edit(data);
            return serializeStageInstance(updated);
        } catch {
            return null;
        }
    }

    /**
     * Delete a stage instance
     */
    async deleteStageInstance(channelId: string): Promise<boolean> {
        const channel = discordClient.channels.cache.get(channelId);
        if (!channel || !channel.isVoiceBased() || !channel.guild) return false;

        try {
            const stageInstance = await channel.guild.stageInstances.fetch(channelId);
            if (!stageInstance) return false;

            await stageInstance.delete();
            return true;
        } catch {
            return false;
        }
    }
}

export const stageInstanceService = new StageInstanceService();
