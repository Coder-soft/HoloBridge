import { ChannelType, OverwriteType, PermissionsBitField, type Channel } from 'discord.js';
import { discordClient } from '../client.js';
import { serializeChannel } from '../serializers.js';
import type { SerializedChannel } from '../../types/discord.types.js';
import type { CreateChannelInput, EditChannelInput, CreateThreadInput } from '../../types/api.types.js';

// Map API channel type strings to Discord.js ChannelType
function getChannelType(type: CreateChannelInput['type']): ChannelType {
    switch (type) {
        case 'text': return ChannelType.GuildText;
        case 'voice': return ChannelType.GuildVoice;
        case 'category': return ChannelType.GuildCategory;
        case 'announcement': return ChannelType.GuildAnnouncement;
        case 'stage': return ChannelType.GuildStageVoice;
        case 'forum': return ChannelType.GuildForum;
    }
}

export class ChannelService {
    /**
     * Get a channel by ID
     */
    async getChannel(channelId: string): Promise<SerializedChannel | null> {
        try {
            const channel = await discordClient.channels.fetch(channelId);
            if (!channel) {return null;}
            return serializeChannel(channel);
        } catch {
            return null;
        }
    }

    /**
     * Create a new channel in a guild
     */
    async createChannel(guildId: string, input: CreateChannelInput): Promise<SerializedChannel | null> {
        const guild = discordClient.guilds.cache.get(guildId);
        if (!guild) {return null;}

        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const options: any = {
                name: input.name,
                type: getChannelType(input.type),
                topic: input.topic,
                parent: input.parentId,
                position: input.position,
                nsfw: input.nsfw,
                rateLimitPerUser: input.rateLimitPerUser,
                bitrate: input.bitrate,
                userLimit: input.userLimit,
            };

            if (input.permissionOverwrites) {
                options.permissionOverwrites = input.permissionOverwrites.map((po) => ({
                    id: po.id,
                    type: po.type === 'role' ? OverwriteType.Role : OverwriteType.Member,
                    allow: po.allow ? new PermissionsBitField(BigInt(po.allow)) : undefined,
                    deny: po.deny ? new PermissionsBitField(BigInt(po.deny)) : undefined,
                }));
            }

            const channel = await guild.channels.create(options);
            return serializeChannel(channel);
        } catch (error) {
            console.error('Failed to create channel:', error);
            return null;
        }
    }

    /**
     * Edit a channel
     */
    async editChannel(channelId: string, input: EditChannelInput): Promise<SerializedChannel | null> {
        try {
            const channel = await discordClient.channels.fetch(channelId);
            if (!channel || !('edit' in channel)) {return null;}

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const guildChannel = channel as any;
            const edited = await guildChannel.edit({
                name: input.name,
                topic: input.topic ?? undefined,
                position: input.position,
                nsfw: input.nsfw,
                rateLimitPerUser: input.rateLimitPerUser,
                parent: input.parentId ?? undefined,
                bitrate: input.bitrate,
                userLimit: input.userLimit,
            });
            return serializeChannel(edited as Channel);
        } catch {
            return null;
        }
    }

    /**
     * Delete a channel
     */
    async deleteChannel(channelId: string, reason?: string): Promise<boolean> {
        try {
            const channel = await discordClient.channels.fetch(channelId);
            if (!channel || !('delete' in channel)) {return false;}

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (channel as any).delete(reason);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Set channel position
     */
    async setChannelPosition(channelId: string, position: number): Promise<boolean> {
        try {
            const channel = await discordClient.channels.fetch(channelId);
            if (!channel || !('setPosition' in channel)) {return false;}

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (channel as any).setPosition(position);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Move channel to a category
     */
    async setChannelParent(channelId: string, parentId: string | null): Promise<boolean> {
        try {
            const channel = await discordClient.channels.fetch(channelId);
            if (!channel || !('setParent' in channel)) {return false;}

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (channel as any).setParent(parentId);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Create a thread from a message or in a channel
     */
    async createThread(channelId: string, input: CreateThreadInput, messageId?: string): Promise<SerializedChannel | null> {
        try {
            const channel = await discordClient.channels.fetch(channelId);
            if (!channel) {return null;}

            // Thread from message
            if (messageId && 'messages' in channel) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const textChannel = channel as any;
                const message = await textChannel.messages.fetch(messageId);
                const thread = await message.startThread({
                    name: input.name,
                    autoArchiveDuration: input.autoArchiveDuration ? parseInt(input.autoArchiveDuration) : undefined,
                    rateLimitPerUser: input.rateLimitPerUser,
                });
                return serializeChannel(thread as Channel);
            }

            // Thread in channel
            if ('threads' in channel) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const threadableChannel = channel as any;
                const thread = await threadableChannel.threads.create({
                    name: input.name,
                    autoArchiveDuration: input.autoArchiveDuration ? parseInt(input.autoArchiveDuration) : undefined,
                    type: input.type === 'private' ? ChannelType.PrivateThread : ChannelType.PublicThread,
                    invitable: input.invitable,
                    rateLimitPerUser: input.rateLimitPerUser,
                });
                return serializeChannel(thread as Channel);
            }

            return null;
        } catch {
            return null;
        }
    }

    /**
     * Get all threads in a channel
     */
    async getThreads(channelId: string): Promise<SerializedChannel[]> {
        try {
            const channel = await discordClient.channels.fetch(channelId);
            if (!channel || !('threads' in channel)) {return [];}

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const threadableChannel = channel as any;
            const threads = await threadableChannel.threads.fetch();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return Array.from(threads.threads.values()).map((t: any) => serializeChannel(t as Channel));
        } catch {
            return [];
        }
    }

    /**
     * Archive a thread
     */
    async archiveThread(threadId: string, archived = true): Promise<boolean> {
        try {
            const channel = await discordClient.channels.fetch(threadId);
            if (!channel || !channel.isThread()) {return false;}

            await channel.setArchived(archived);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Lock a thread
     */
    async lockThread(threadId: string, locked = true): Promise<boolean> {
        try {
            const channel = await discordClient.channels.fetch(threadId);
            if (!channel || !channel.isThread()) {return false;}

            await channel.setLocked(locked);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Clone a channel
     */
    async cloneChannel(channelId: string, name?: string): Promise<SerializedChannel | null> {
        try {
            const channel = await discordClient.channels.fetch(channelId);
            if (!channel || !('clone' in channel)) {return null;}

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const cloned = await (channel as any).clone({ name });
            return serializeChannel(cloned as Channel);
        } catch {
            return null;
        }
    }

    /**
     * Get channel webhooks
     */
    async getWebhooks(channelId: string) {
        try {
            const channel = await discordClient.channels.fetch(channelId);
            if (!channel || !('fetchWebhooks' in channel)) {return [];}

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const webhooks = await (channel as any).fetchWebhooks();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return Array.from(webhooks.values()).map((w: any) => ({
                id: w.id as string,
                name: w.name as string | null,
                token: w.token as string | null,
                url: w.url as string,
                ownerId: (w.owner?.id as string) ?? null,
            }));
        } catch {
            return [];
        }
    }
}

export const channelService = new ChannelService();
