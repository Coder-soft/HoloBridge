import { discordClient } from '../client.js';
import { serializeAutoModRule } from '../serializers.js';
import type { SerializedAutoModRule } from '../../types/discord.types.js';
import type { AutoModerationRuleCreateOptions, AutoModerationRuleEditOptions } from 'discord.js';

export class AutoModService {
    /**
     * Get all auto-moderation rules in a guild
     */
    async getAutoModRules(guildId: string): Promise<SerializedAutoModRule[]> {
        const guild = discordClient.guilds.cache.get(guildId);
        if (!guild) return [];

        const rules = await guild.autoModerationRules.fetch();
        return rules.map(serializeAutoModRule);
    }

    /**
     * Get a specific auto-moderation rule
     */
    async getAutoModRule(guildId: string, ruleId: string): Promise<SerializedAutoModRule | null> {
        const guild = discordClient.guilds.cache.get(guildId);
        if (!guild) return null;

        try {
            const rule = await guild.autoModerationRules.fetch(ruleId);
            return serializeAutoModRule(rule);
        } catch {
            return null;
        }
    }

    /**
     * Create a new auto-moderation rule
     */
    async createAutoModRule(guildId: string, data: AutoModerationRuleCreateOptions): Promise<SerializedAutoModRule | null> {
        const guild = discordClient.guilds.cache.get(guildId);
        if (!guild) return null;

        const rule = await guild.autoModerationRules.create(data);
        return serializeAutoModRule(rule);
    }

    /**
     * Edit an auto-moderation rule
     */
    async editAutoModRule(guildId: string, ruleId: string, data: AutoModerationRuleEditOptions): Promise<SerializedAutoModRule | null> {
        const guild = discordClient.guilds.cache.get(guildId);
        if (!guild) return null;

        try {
            const rule = await guild.autoModerationRules.fetch(ruleId);
            const updated = await rule.edit(data);
            return serializeAutoModRule(updated);
        } catch {
            return null;
        }
    }

    /**
     * Delete an auto-moderation rule
     */
    async deleteAutoModRule(guildId: string, ruleId: string): Promise<boolean> {
        const guild = discordClient.guilds.cache.get(guildId);
        if (!guild) return false;

        try {
            const rule = await guild.autoModerationRules.fetch(ruleId);
            await rule.delete();
            return true;
        } catch {
            return false;
        }
    }
}

export const autoModService = new AutoModService();
