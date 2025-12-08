import { discordClient } from '../client.js';
import { serializeSticker } from '../serializers.js';
import type { SerializedSticker } from '../../types/discord.types.js';
import type { GuildStickerCreateOptions, GuildStickerEditOptions } from 'discord.js';

export class StickerService {
    /**
     * Get all stickers in a guild
     */
    async getGuildStickers(guildId: string): Promise<SerializedSticker[]> {
        const guild = discordClient.guilds.cache.get(guildId);
        if (!guild) return [];

        const stickers = await guild.stickers.fetch();
        return stickers.map(serializeSticker);
    }

    /**
     * Get a specific sticker
     */
    async getSticker(guildId: string, stickerId: string): Promise<SerializedSticker | null> {
        const guild = discordClient.guilds.cache.get(guildId);
        if (!guild) return null;

        try {
            const sticker = await guild.stickers.fetch(stickerId);
            return serializeSticker(sticker);
        } catch {
            return null;
        }
    }

    /**
     * Create a new sticker
     */
    async createSticker(guildId: string, data: GuildStickerCreateOptions): Promise<SerializedSticker | null> {
        const guild = discordClient.guilds.cache.get(guildId);
        if (!guild) return null;

        const sticker = await guild.stickers.create(data);
        return serializeSticker(sticker);
    }

    /**
     * Edit a sticker
     */
    async editSticker(guildId: string, stickerId: string, data: GuildStickerEditOptions): Promise<SerializedSticker | null> {
        const guild = discordClient.guilds.cache.get(guildId);
        if (!guild) return null;

        try {
            const sticker = await guild.stickers.fetch(stickerId);
            const updated = await sticker.edit(data);
            return serializeSticker(updated);
        } catch {
            return null;
        }
    }

    /**
     * Delete a sticker
     */
    async deleteSticker(guildId: string, stickerId: string): Promise<boolean> {
        const guild = discordClient.guilds.cache.get(guildId);
        if (!guild) return false;

        try {
            const sticker = await guild.stickers.fetch(stickerId);
            await sticker.delete();
            return true;
        } catch {
            return false;
        }
    }
}

export const stickerService = new StickerService();
