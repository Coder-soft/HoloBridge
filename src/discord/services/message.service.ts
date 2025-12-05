import { ChannelType, TextChannel, NewsChannel, ThreadChannel } from 'discord.js';
import { discordClient } from '../client.js';
import { serializeMessage, serializeUser } from '../serializers.js';
import type { SerializedMessage } from '../../types/discord.types.js';
import type { SendMessageInput, EditMessageInput, GetMessagesInput } from '../../types/api.types.js';

type TextBasedChannel = TextChannel | NewsChannel | ThreadChannel;

function isTextBasedChannel(channel: unknown): channel is TextBasedChannel {
    if (!channel || typeof channel !== 'object') return false;
    const ch = channel as { type?: ChannelType };
    return (
        ch.type === ChannelType.GuildText ||
        ch.type === ChannelType.GuildAnnouncement ||
        ch.type === ChannelType.PublicThread ||
        ch.type === ChannelType.PrivateThread ||
        ch.type === ChannelType.AnnouncementThread
    );
}

export class MessageService {
    /**
     * Get messages from a channel
     */
    async getMessages(channelId: string, options?: GetMessagesInput): Promise<SerializedMessage[]> {
        const channel = discordClient.channels.cache.get(channelId);
        if (!channel || !isTextBasedChannel(channel)) return [];

        const messages = await channel.messages.fetch({
            limit: options?.limit ?? 50,
            before: options?.before,
            after: options?.after,
            around: options?.around,
        });

        return messages.map(serializeMessage);
    }

    /**
     * Get a specific message by ID
     */
    async getMessage(channelId: string, messageId: string): Promise<SerializedMessage | null> {
        const channel = discordClient.channels.cache.get(channelId);
        if (!channel || !isTextBasedChannel(channel)) return null;

        try {
            const message = await channel.messages.fetch(messageId);
            return serializeMessage(message);
        } catch {
            return null;
        }
    }

    /**
     * Send a message to a channel
     */
    async sendMessage(channelId: string, input: SendMessageInput): Promise<SerializedMessage | null> {
        const channel = discordClient.channels.cache.get(channelId);
        if (!channel || !isTextBasedChannel(channel)) return null;

        try {
            const message = await channel.send({
                content: input.content,
                embeds: input.embeds?.map((e) => ({
                    title: e.title,
                    description: e.description,
                    url: e.url,
                    color: e.color,
                    timestamp: e.timestamp,
                    footer: e.footer ? { text: e.footer.text, iconURL: e.footer.icon_url } : undefined,
                    image: e.image,
                    thumbnail: e.thumbnail,
                    author: e.author ? { name: e.author.name, url: e.author.url, iconURL: e.author.icon_url } : undefined,
                    fields: e.fields?.map((f) => ({ name: f.name, value: f.value, inline: f.inline })),
                })),
                reply: input.replyTo ? { messageReference: input.replyTo } : undefined,
                tts: input.tts,
            });
            return serializeMessage(message);
        } catch (error) {
            console.error('Failed to send message:', error);
            return null;
        }
    }

    /**
     * Edit an existing message
     */
    async editMessage(channelId: string, messageId: string, input: EditMessageInput): Promise<SerializedMessage | null> {
        const channel = discordClient.channels.cache.get(channelId);
        if (!channel || !isTextBasedChannel(channel)) return null;

        try {
            const message = await channel.messages.fetch(messageId);

            // Can only edit own messages
            if (message.author.id !== discordClient.user?.id) {
                return null;
            }

            const edited = await message.edit({
                content: input.content ?? undefined,
                embeds: input.embeds?.map((e) => ({
                    title: e.title,
                    description: e.description,
                    url: e.url,
                    color: e.color,
                })),
            });
            return serializeMessage(edited);
        } catch {
            return null;
        }
    }

    /**
     * Delete a message
     */
    async deleteMessage(channelId: string, messageId: string, reason?: string): Promise<boolean> {
        const channel = discordClient.channels.cache.get(channelId);
        if (!channel || !isTextBasedChannel(channel)) return false;

        try {
            const message = await channel.messages.fetch(messageId);
            await message.delete();
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Bulk delete messages (2-100 messages, max 14 days old)
     */
    async bulkDelete(channelId: string, messageIds: string[]): Promise<{ deleted: string[]; failed: string[] }> {
        const channel = discordClient.channels.cache.get(channelId);
        if (!channel || !isTextBasedChannel(channel)) {
            return { deleted: [], failed: messageIds };
        }

        try {
            const deleted = await channel.bulkDelete(messageIds, true);
            const deletedIds = Array.from(deleted.keys());
            const failedIds = messageIds.filter((id) => !deletedIds.includes(id));
            return { deleted: deletedIds, failed: failedIds };
        } catch {
            return { deleted: [], failed: messageIds };
        }
    }

    /**
     * Add a reaction to a message
     */
    async addReaction(channelId: string, messageId: string, emoji: string): Promise<boolean> {
        const channel = discordClient.channels.cache.get(channelId);
        if (!channel || !isTextBasedChannel(channel)) return false;

        try {
            const message = await channel.messages.fetch(messageId);
            await message.react(emoji);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Remove a reaction from a message
     */
    async removeReaction(channelId: string, messageId: string, emoji: string, userId?: string): Promise<boolean> {
        const channel = discordClient.channels.cache.get(channelId);
        if (!channel || !isTextBasedChannel(channel)) return false;

        try {
            const message = await channel.messages.fetch(messageId);
            const reaction = message.reactions.cache.find(
                (r) => r.emoji.name === emoji || r.emoji.id === emoji || r.emoji.identifier === emoji
            );

            if (!reaction) return false;

            if (userId) {
                await reaction.users.remove(userId);
            } else {
                await reaction.users.remove(discordClient.user?.id);
            }
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Remove all reactions from a message
     */
    async removeAllReactions(channelId: string, messageId: string): Promise<boolean> {
        const channel = discordClient.channels.cache.get(channelId);
        if (!channel || !isTextBasedChannel(channel)) return false;

        try {
            const message = await channel.messages.fetch(messageId);
            await message.reactions.removeAll();
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get users who reacted with a specific emoji
     */
    async getReactionUsers(channelId: string, messageId: string, emoji: string, limit = 100) {
        const channel = discordClient.channels.cache.get(channelId);
        if (!channel || !isTextBasedChannel(channel)) return [];

        try {
            const message = await channel.messages.fetch(messageId);
            const reaction = message.reactions.cache.find(
                (r) => r.emoji.name === emoji || r.emoji.id === emoji || r.emoji.identifier === emoji
            );

            if (!reaction) return [];

            const users = await reaction.users.fetch({ limit });
            return users.map(serializeUser);
        } catch {
            return [];
        }
    }

    /**
     * Pin a message
     */
    async pinMessage(channelId: string, messageId: string): Promise<boolean> {
        const channel = discordClient.channels.cache.get(channelId);
        if (!channel || !isTextBasedChannel(channel)) return false;

        try {
            const message = await channel.messages.fetch(messageId);
            await message.pin();
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Unpin a message
     */
    async unpinMessage(channelId: string, messageId: string): Promise<boolean> {
        const channel = discordClient.channels.cache.get(channelId);
        if (!channel || !isTextBasedChannel(channel)) return false;

        try {
            const message = await channel.messages.fetch(messageId);
            await message.unpin();
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get pinned messages in a channel
     */
    async getPinnedMessages(channelId: string): Promise<SerializedMessage[]> {
        const channel = discordClient.channels.cache.get(channelId);
        if (!channel || !isTextBasedChannel(channel)) return [];

        try {
            const pinned = await channel.messages.fetchPinned();
            return pinned.map(serializeMessage);
        } catch {
            return [];
        }
    }

    /**
     * Crosspost a message (for announcement channels)
     */
    async crosspostMessage(channelId: string, messageId: string): Promise<boolean> {
        const channel = discordClient.channels.cache.get(channelId);
        if (!channel || channel.type !== ChannelType.GuildAnnouncement) return false;

        try {
            const message = await channel.messages.fetch(messageId);
            await message.crosspost();
            return true;
        } catch {
            return false;
        }
    }
}

export const messageService = new MessageService();
