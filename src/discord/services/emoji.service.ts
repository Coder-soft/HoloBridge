import { discordClient } from '../client.js';
import { serializeGuildEmoji } from '../serializers.js';
import type { SerializedEmoji } from '../../types/discord.types.js';
import type { GuildEmojiCreateOptions, GuildEmojiEditOptions } from 'discord.js';

export class EmojiService {
    /**
     * Get all emojis in a guild
     */
    async getGuildEmojis(guildId: string): Promise<SerializedEmoji[]> {
        const guild = discordClient.guilds.cache.get(guildId);
        if (!guild) return [];

        try {
            const emojis = await guild.emojis.fetch();
            return emojis.map(serializeGuildEmoji);
        } catch (error) {
            console.error(`Failed to fetch emojis for guild ${guildId}:`, error);
            return [];
        }
    }

    /**
     * Get a specific emoji
     */
    async getEmoji(guildId: string, emojiId: string): Promise<SerializedEmoji | null> {
        const guild = discordClient.guilds.cache.get(guildId);
        if (!guild) return null;

        try {
            const emoji = await guild.emojis.fetch(emojiId);
            return serializeGuildEmoji(emoji);
        } catch {
            return null;
        }
    }

    /**
     * Create a new emoji
     */
    async createEmoji(guildId: string, data: GuildEmojiCreateOptions): Promise<SerializedEmoji | null> {
        const guild = discordClient.guilds.cache.get(guildId);
        if (!guild) return null;

        try {
            const emoji = await guild.emojis.create(data);
            return serializeGuildEmoji(emoji);
        } catch (error) {
            console.error(`Failed to create emoji in guild ${guildId}:`, error);
            return null;
        }
    }

    /**
     * Edit an emoji
     */
    async editEmoji(guildId: string, emojiId: string, data: GuildEmojiEditOptions): Promise<SerializedEmoji | null> {
        const guild = discordClient.guilds.cache.get(guildId);
        if (!guild) return null;

        try {
            const emoji = await guild.emojis.fetch(emojiId);
            const updated = await emoji.edit(data);
            return serializeGuildEmoji(updated);
        } catch {
            return null;
        }
    }

    /**
     * Delete an emoji
     */
    async deleteEmoji(guildId: string, emojiId: string): Promise<boolean> {
        const guild = discordClient.guilds.cache.get(guildId);
        if (!guild) return false;

        try {
            const emoji = await guild.emojis.fetch(emojiId);
            await emoji.delete();
            return true;
        } catch {
            return false;
        }
    }
}

export const emojiService = new EmojiService();
