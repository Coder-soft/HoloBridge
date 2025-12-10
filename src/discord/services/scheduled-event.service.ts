import { discordClient } from '../client.js';
import { serializeScheduledEvent, serializeUser } from '../serializers.js';
import type { SerializedScheduledEvent, SerializedUser } from '../../types/discord.types.js';
import type { GuildScheduledEventCreateOptions, GuildScheduledEventEditOptions, GuildScheduledEventStatus } from 'discord.js';

export class ScheduledEventService {
    /**
     * Get all scheduled events in a guild
     */
    async getGuildEvents(guildId: string): Promise<SerializedScheduledEvent[]> {
        const guild = discordClient.guilds.cache.get(guildId);
        if (!guild) {return [];}

        try {
            const events = await guild.scheduledEvents.fetch();
            return events.map(serializeScheduledEvent);
        } catch (error) {
            console.error(`Failed to fetch scheduled events for guild ${guildId}:`, error);
            return [];
        }
    }

    /**
     * Get a specific scheduled event
     */
    async getEvent(guildId: string, eventId: string): Promise<SerializedScheduledEvent | null> {
        const guild = discordClient.guilds.cache.get(guildId);
        if (!guild) {return null;}

        try {
            const event = await guild.scheduledEvents.fetch(eventId);
            return serializeScheduledEvent(event);
        } catch {
            return null;
        }
    }

    /**
     * Create a new scheduled event
     */
    async createEvent(guildId: string, data: GuildScheduledEventCreateOptions): Promise<SerializedScheduledEvent | null> {
        const guild = discordClient.guilds.cache.get(guildId);
        if (!guild) {return null;}

        try {
            const event = await guild.scheduledEvents.create(data);
            return serializeScheduledEvent(event);
        } catch (error) {
            console.error(`Failed to create scheduled event in guild ${guildId}:`, error);
            return null;
        }
    }

    /**
     * Edit a scheduled event
     */
    async editEvent(guildId: string, eventId: string, data: GuildScheduledEventEditOptions<GuildScheduledEventStatus, GuildScheduledEventStatus.Active | GuildScheduledEventStatus.Completed | GuildScheduledEventStatus.Canceled>): Promise<SerializedScheduledEvent | null> {
        const guild = discordClient.guilds.cache.get(guildId);
        if (!guild) {return null;}

        try {
            const event = await guild.scheduledEvents.fetch(eventId);
            const updated = await event.edit(data);
            return serializeScheduledEvent(updated);
        } catch {
            return null;
        }
    }

    /**
     * Delete a scheduled event
     */
    async deleteEvent(guildId: string, eventId: string): Promise<boolean> {
        const guild = discordClient.guilds.cache.get(guildId);
        if (!guild) {return false;}

        try {
            const event = await guild.scheduledEvents.fetch(eventId);
            await event.delete();
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get users subscribed to an event
     */
    async getEventUsers(guildId: string, eventId: string): Promise<SerializedUser[]> {
        const guild = discordClient.guilds.cache.get(guildId);
        if (!guild) {return [];}

        try {
            const event = await guild.scheduledEvents.fetch(eventId);
            const users = await event.fetchSubscribers();
            return users.map(u => serializeUser(u.user));
        } catch {
            return [];
        }
    }
}

export const scheduledEventService = new ScheduledEventService();
