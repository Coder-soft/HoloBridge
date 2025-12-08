import type { Server as SocketIOServer } from 'socket.io';
import type { User, GuildScheduledEvent } from 'discord.js';
import { discordClient } from '../client.js';
import {
    serializeMessage,
    serializeMember,
    serializeChannel,
    serializeRole,
    serializeGuild,
    serializeVoiceState,
    serializePresence,
    serializeUser,
    serializeReaction,
    serializeSticker,
    serializeGuildEmoji,
    serializeScheduledEvent,
    serializeAutoModRule,
    serializeAutoModAction,
    serializeStageInstance,
    serializeInvite,
    serializeAuditLogEntry,
    serializeInteraction,
    serializeEntitlement,
} from '../serializers.js';
import type {
    DiscordEventPayload,
    ServerToClientEvents,
    ClientToServerEvents,
    InterServerEvents,
    SocketData,
} from '../../types/events.types.js';
import { config } from '../../config/index.js';

let io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData> | null = null;

/**
 * Set the Socket.IO server instance for broadcasting events
 */
export function setSocketServer(
    server: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
): void {
    io = server;
}

import { pluginManager } from '../../plugins/manager.js';

/**
 * Broadcast a Discord event to subscribed clients
 */
function broadcastEvent(payload: DiscordEventPayload): void {
    if (!io) return;

    const guildId = payload.guildId;
    if (guildId) {
        // Broadcast to clients subscribed to this guild
        io.to(`guild:${guildId}`).emit('discord', payload);
    } else {
        // Broadcast to all connected clients for DM/global events
        io.emit('discord', payload);
    }

    // Notify plugins of this event
    void pluginManager.emit(payload.event, payload.data);

    if (config.debug) {
        console.log(`📤 Broadcast event: ${payload.event}${guildId ? ` (guild: ${guildId})` : ''}`);
    }
}

/**
 * Register all Discord event handlers
 */
export function registerDiscordEvents(): void {
    // ========== MESSAGE EVENTS ==========

    discordClient.on('messageCreate', (message) => {
        broadcastEvent({
            event: 'messageCreate',
            guildId: message.guildId,
            data: serializeMessage(message),
        });
    });

    discordClient.on('messageUpdate', (oldMessage, newMessage) => {
        if (!newMessage.author || newMessage.partial) return; // Partial message, skip

        broadcastEvent({
            event: 'messageUpdate',
            guildId: newMessage.guildId ?? null,
            data: {
                old: oldMessage.partial ? null : serializeMessage(oldMessage),
                new: serializeMessage(newMessage),
            },
        });
    });

    discordClient.on('messageDelete', (message) => {
        broadcastEvent({
            event: 'messageDelete',
            guildId: message.guildId,
            data: {
                id: message.id,
                channelId: message.channelId,
                guildId: message.guildId,
            },
        });
    });

    discordClient.on('messageDeleteBulk', (messages, channel) => {
        broadcastEvent({
            event: 'messageDeleteBulk',
            guildId: 'guildId' in channel ? channel.guildId : null,
            data: {
                ids: Array.from(messages.keys()),
                channelId: channel.id,
                guildId: 'guildId' in channel ? channel.guildId : null,
            },
        });
    });

    discordClient.on('messageReactionAdd', async (reaction, user) => {
        if (reaction.partial) {
            try {
                reaction = await reaction.fetch();
            } catch {
                return;
            }
        }

        broadcastEvent({
            event: 'messageReactionAdd',
            guildId: reaction.message.guildId,
            data: {
                messageId: reaction.message.id,
                channelId: reaction.message.channelId,
                guildId: reaction.message.guildId,
                userId: user.id,
                reaction: serializeReaction(reaction),
            },
        });
    });

    discordClient.on('messageReactionRemove', (reaction, user) => {
        broadcastEvent({
            event: 'messageReactionRemove',
            guildId: reaction.message.guildId,
            data: {
                messageId: reaction.message.id,
                channelId: reaction.message.channelId,
                guildId: reaction.message.guildId,
                userId: user.id,
                emoji: {
                    id: reaction.emoji.id,
                    name: reaction.emoji.name,
                },
            },
        });
    });

    discordClient.on('messageReactionRemoveAll', (message, reactions) => {
        broadcastEvent({
            event: 'messageReactionRemoveAll',
            guildId: message.guildId,
            data: {
                messageId: message.id,
                channelId: message.channelId,
                guildId: message.guildId,
            },
        });
    });

    discordClient.on('messageReactionRemoveEmoji', (reaction) => {
        broadcastEvent({
            event: 'messageReactionRemoveEmoji',
            guildId: reaction.message.guildId,
            data: {
                messageId: reaction.message.id,
                channelId: reaction.message.channelId,
                guildId: reaction.message.guildId,
                emoji: {
                    id: reaction.emoji.id,
                    name: reaction.emoji.name,
                },
            },
        });
    });

    discordClient.on('messagePollVoteAdd', (pollAnswer, userId) => {
        const poll = pollAnswer.poll;
        const message = poll?.message;
        if (!message) return; // Skip if message is not available

        broadcastEvent({
            event: 'messagePollVoteAdd',
            guildId: message.guildId ?? null,
            data: {
                messageId: message.id,
                channelId: message.channelId,
                guildId: message.guildId ?? null,
                userId,
                answerId: pollAnswer.id,
            },
        });
    });

    discordClient.on('messagePollVoteRemove', (pollAnswer, userId) => {
        const poll = pollAnswer.poll;
        const message = poll?.message;
        if (!message) return; // Skip if message is not available

        broadcastEvent({
            event: 'messagePollVoteRemove',
            guildId: message.guildId ?? null,
            data: {
                messageId: message.id,
                channelId: message.channelId,
                guildId: message.guildId ?? null,
                userId,
                answerId: pollAnswer.id,
            },
        });
    });

    // ========== MEMBER EVENTS ==========

    discordClient.on('guildMemberAdd', (member) => {
        broadcastEvent({
            event: 'guildMemberAdd',
            guildId: member.guild.id,
            data: serializeMember(member),
        });
    });

    discordClient.on('guildMemberRemove', (member) => {
        broadcastEvent({
            event: 'guildMemberRemove',
            guildId: member.guild.id,
            data: {
                user: serializeUser(member.user),
                guildId: member.guild.id,
            },
        });
    });

    discordClient.on('guildMemberUpdate', (oldMember, newMember) => {
        broadcastEvent({
            event: 'guildMemberUpdate',
            guildId: newMember.guild.id,
            data: {
                old: oldMember.partial ? null : serializeMember(oldMember),
                new: serializeMember(newMember),
            },
        });
    });

    discordClient.on('presenceUpdate', (oldPresence, newPresence) => {
        if (!newPresence) return;

        broadcastEvent({
            event: 'presenceUpdate',
            guildId: newPresence.guild?.id ?? null,
            data: {
                old: oldPresence ? serializePresence(oldPresence) : null,
                new: serializePresence(newPresence),
            },
        });
    });

    discordClient.on('userUpdate', (oldUser, newUser) => {
        // oldUser may be partial, so we only serialize if not partial
        // Type assertion is safe here because we've checked partial === false
        const oldSerialized = oldUser.partial ? null : serializeUser(oldUser as User);
        broadcastEvent({
            event: 'userUpdate',
            guildId: null,
            data: {
                old: oldSerialized,
                new: serializeUser(newUser),
            },
        });
    });

    // ========== CHANNEL EVENTS ==========

    discordClient.on('channelCreate', (channel) => {
        broadcastEvent({
            event: 'channelCreate',
            guildId: 'guildId' in channel ? channel.guildId : null,
            data: serializeChannel(channel),
        });
    });

    discordClient.on('channelUpdate', (oldChannel, newChannel) => {
        broadcastEvent({
            event: 'channelUpdate',
            guildId: 'guildId' in newChannel ? newChannel.guildId : null,
            data: {
                old: serializeChannel(oldChannel),
                new: serializeChannel(newChannel),
            },
        });
    });

    discordClient.on('channelDelete', (channel) => {
        broadcastEvent({
            event: 'channelDelete',
            guildId: 'guildId' in channel ? channel.guildId : null,
            data: serializeChannel(channel),
        });
    });

    discordClient.on('channelPinsUpdate', (channel, time) => {
        broadcastEvent({
            event: 'channelPinsUpdate',
            guildId: 'guildId' in channel ? channel.guildId : null,
            data: {
                channelId: channel.id,
                guildId: 'guildId' in channel ? channel.guildId : null,
                lastPinAt: time?.toISOString() ?? null,
            },
        });
    });

    discordClient.on('webhookUpdate', (channel) => {
        if (!('guildId' in channel) || !channel.guildId) return;

        broadcastEvent({
            event: 'webhookUpdate',
            guildId: channel.guildId,
            data: {
                channelId: channel.id,
                guildId: channel.guildId,
            },
        });
    });

    // ========== THREAD EVENTS ==========

    discordClient.on('threadCreate', (thread, newlyCreated) => {
        broadcastEvent({
            event: 'threadCreate',
            guildId: thread.guildId,
            data: {
                thread: serializeChannel(thread),
                newlyCreated,
            },
        });
    });

    discordClient.on('threadUpdate', (oldThread, newThread) => {
        broadcastEvent({
            event: 'threadUpdate',
            guildId: newThread.guildId,
            data: {
                old: oldThread.partial ? null : serializeChannel(oldThread),
                new: serializeChannel(newThread),
            },
        });
    });

    discordClient.on('threadDelete', (thread) => {
        broadcastEvent({
            event: 'threadDelete',
            guildId: thread.guildId,
            data: {
                id: thread.id,
                guildId: thread.guildId,
                parentId: thread.parentId,
                name: thread.name,
                type: thread.type,
            },
        });
    });

    discordClient.on('threadMembersUpdate', (addedMembers, removedMembers, thread) => {
        broadcastEvent({
            event: 'threadMembersUpdate',
            guildId: thread.guildId,
            data: {
                threadId: thread.id,
                guildId: thread.guildId,
                addedMembers: addedMembers.map((m) => ({
                    id: m.id,
                    threadId: m.thread?.id ?? thread.id,
                    joinedAt: m.joinedTimestamp ? new Date(m.joinedTimestamp).toISOString() : new Date().toISOString(),
                })),
                removedMemberIds: removedMembers.map((m) => m.id),
                memberCount: thread.memberCount ?? 0,
            },
        });
    });

    // ========== ROLE EVENTS ==========

    discordClient.on('roleCreate', (role) => {
        broadcastEvent({
            event: 'roleCreate',
            guildId: role.guild.id,
            data: serializeRole(role),
        });
    });

    discordClient.on('roleUpdate', (oldRole, newRole) => {
        broadcastEvent({
            event: 'roleUpdate',
            guildId: newRole.guild.id,
            data: {
                old: serializeRole(oldRole),
                new: serializeRole(newRole),
            },
        });
    });

    discordClient.on('roleDelete', (role) => {
        broadcastEvent({
            event: 'roleDelete',
            guildId: role.guild.id,
            data: {
                id: role.id,
                guildId: role.guild.id,
            },
        });
    });

    // ========== GUILD EVENTS ==========

    discordClient.on('guildCreate', (guild) => {
        broadcastEvent({
            event: 'guildCreate',
            guildId: guild.id,
            data: serializeGuild(guild),
        });
    });

    discordClient.on('guildUpdate', (oldGuild, newGuild) => {
        broadcastEvent({
            event: 'guildUpdate',
            guildId: newGuild.id,
            data: {
                old: serializeGuild(oldGuild),
                new: serializeGuild(newGuild),
            },
        });
    });

    discordClient.on('guildDelete', (guild) => {
        broadcastEvent({
            event: 'guildDelete',
            guildId: guild.id,
            data: {
                id: guild.id,
                name: guild.name,
                unavailable: !guild.available,
            },
        });
    });

    discordClient.on('guildBanAdd', (ban) => {
        broadcastEvent({
            event: 'guildBanAdd',
            guildId: ban.guild.id,
            data: {
                guildId: ban.guild.id,
                user: serializeUser(ban.user),
            },
        });
    });

    discordClient.on('guildBanRemove', (ban) => {
        broadcastEvent({
            event: 'guildBanRemove',
            guildId: ban.guild.id,
            data: {
                guildId: ban.guild.id,
                user: serializeUser(ban.user),
            },
        });
    });

    discordClient.on('guildIntegrationsUpdate', (guild) => {
        broadcastEvent({
            event: 'guildIntegrationsUpdate',
            guildId: guild.id,
            data: {
                guildId: guild.id,
            },
        });
    });

    discordClient.on('guildAuditLogEntryCreate', (entry, guild) => {
        broadcastEvent({
            event: 'guildAuditLogEntryCreate',
            guildId: guild.id,
            data: serializeAuditLogEntry(entry),
        });
    });

    // ========== EMOJI EVENTS ==========

    discordClient.on('emojiCreate', (emoji) => {
        broadcastEvent({
            event: 'emojiCreate',
            guildId: emoji.guild.id,
            data: serializeGuildEmoji(emoji),
        });
    });

    discordClient.on('emojiUpdate', (oldEmoji, newEmoji) => {
        broadcastEvent({
            event: 'emojiUpdate',
            guildId: newEmoji.guild.id,
            data: {
                old: serializeGuildEmoji(oldEmoji),
                new: serializeGuildEmoji(newEmoji),
            },
        });
    });

    discordClient.on('emojiDelete', (emoji) => {
        broadcastEvent({
            event: 'emojiDelete',
            guildId: emoji.guild.id,
            data: serializeGuildEmoji(emoji),
        });
    });

    // ========== STICKER EVENTS ==========

    discordClient.on('stickerCreate', (sticker) => {
        broadcastEvent({
            event: 'stickerCreate',
            guildId: sticker.guildId ?? '',
            data: serializeSticker(sticker),
        });
    });

    discordClient.on('stickerUpdate', (oldSticker, newSticker) => {
        broadcastEvent({
            event: 'stickerUpdate',
            guildId: newSticker.guildId ?? '',
            data: {
                old: serializeSticker(oldSticker),
                new: serializeSticker(newSticker),
            },
        });
    });

    discordClient.on('stickerDelete', (sticker) => {
        broadcastEvent({
            event: 'stickerDelete',
            guildId: sticker.guildId ?? '',
            data: serializeSticker(sticker),
        });
    });

    // ========== VOICE EVENTS ==========

    discordClient.on('voiceStateUpdate', (oldState, newState) => {
        broadcastEvent({
            event: 'voiceStateUpdate',
            guildId: newState.guild?.id ?? null,
            data: {
                old: oldState.channelId ? serializeVoiceState(oldState) : null,
                new: serializeVoiceState(newState),
            },
        });
    });

    // ========== STAGE INSTANCE EVENTS ==========

    discordClient.on('stageInstanceCreate', (stageInstance) => {
        broadcastEvent({
            event: 'stageInstanceCreate',
            guildId: stageInstance.guildId,
            data: serializeStageInstance(stageInstance),
        });
    });

    discordClient.on('stageInstanceUpdate', (oldStageInstance, newStageInstance) => {
        broadcastEvent({
            event: 'stageInstanceUpdate',
            guildId: newStageInstance.guildId,
            data: {
                old: oldStageInstance ? serializeStageInstance(oldStageInstance) : null,
                new: serializeStageInstance(newStageInstance),
            },
        });
    });

    discordClient.on('stageInstanceDelete', (stageInstance) => {
        broadcastEvent({
            event: 'stageInstanceDelete',
            guildId: stageInstance.guildId,
            data: serializeStageInstance(stageInstance),
        });
    });

    // ========== SCHEDULED EVENT EVENTS ==========

    discordClient.on('guildScheduledEventCreate', (event) => {
        broadcastEvent({
            event: 'guildScheduledEventCreate',
            guildId: event.guildId,
            data: serializeScheduledEvent(event),
        });
    });

    discordClient.on('guildScheduledEventUpdate', (oldEvent, newEvent) => {
        // oldEvent may be partial
        // Type assertions are safe here because we've checked partial === false
        const oldSerialized = oldEvent && !oldEvent.partial
            ? serializeScheduledEvent(oldEvent as GuildScheduledEvent)
            : null;
        broadcastEvent({
            event: 'guildScheduledEventUpdate',
            guildId: newEvent.guildId,
            data: {
                old: oldSerialized,
                new: serializeScheduledEvent(newEvent as GuildScheduledEvent),
            },
        });
    });

    discordClient.on('guildScheduledEventDelete', (event) => {
        // event may be partial, but we still want to broadcast the deletion
        // Type assertion needed as Discord.js provides partial type
        broadcastEvent({
            event: 'guildScheduledEventDelete',
            guildId: event.guildId,
            data: serializeScheduledEvent(event as GuildScheduledEvent),
        });
    });

    discordClient.on('guildScheduledEventUserAdd', (event, user) => {
        broadcastEvent({
            event: 'guildScheduledEventUserAdd',
            guildId: event.guildId,
            data: {
                guildScheduledEventId: event.id,
                userId: user.id,
                guildId: event.guildId,
            },
        });
    });

    discordClient.on('guildScheduledEventUserRemove', (event, user) => {
        broadcastEvent({
            event: 'guildScheduledEventUserRemove',
            guildId: event.guildId,
            data: {
                guildScheduledEventId: event.id,
                userId: user.id,
                guildId: event.guildId,
            },
        });
    });

    // ========== AUTOMOD EVENTS ==========

    discordClient.on('autoModerationRuleCreate', (rule) => {
        broadcastEvent({
            event: 'autoModerationRuleCreate',
            guildId: rule.guild.id,
            data: serializeAutoModRule(rule),
        });
    });

    discordClient.on('autoModerationRuleUpdate', (oldRule, newRule) => {
        broadcastEvent({
            event: 'autoModerationRuleUpdate',
            guildId: newRule.guild.id,
            data: {
                old: oldRule ? serializeAutoModRule(oldRule) : null,
                new: serializeAutoModRule(newRule),
            },
        });
    });

    discordClient.on('autoModerationRuleDelete', (rule) => {
        broadcastEvent({
            event: 'autoModerationRuleDelete',
            guildId: rule.guild.id,
            data: serializeAutoModRule(rule),
        });
    });

    discordClient.on('autoModerationActionExecution', (execution) => {
        broadcastEvent({
            event: 'autoModerationActionExecution',
            guildId: execution.guild.id,
            data: serializeAutoModAction(execution),
        });
    });

    // ========== TYPING EVENT ==========

    discordClient.on('typingStart', (typing) => {
        broadcastEvent({
            event: 'typingStart',
            guildId: typing.guild?.id ?? null,
            data: {
                channelId: typing.channel.id,
                userId: typing.user.id,
                timestamp: typing.startedAt.toISOString(),
                member: typing.member ? serializeMember(typing.member) : null,
            },
        });
    });

    // ========== INTERACTION EVENT ==========

    discordClient.on('interactionCreate', (interaction) => {
        broadcastEvent({
            event: 'interactionCreate',
            guildId: interaction.guildId,
            data: serializeInteraction(interaction),
        });
    });

    // ========== INVITE EVENTS ==========

    discordClient.on('inviteCreate', (invite) => {
        broadcastEvent({
            event: 'inviteCreate',
            guildId: invite.guild?.id ?? null,
            data: serializeInvite(invite),
        });
    });

    discordClient.on('inviteDelete', (invite) => {
        broadcastEvent({
            event: 'inviteDelete',
            guildId: invite.guild?.id ?? null,
            data: {
                code: invite.code,
                channelId: invite.channel?.id ?? null,
                guildId: invite.guild?.id ?? null,
            },
        });
    });

    // ========== ENTITLEMENT EVENTS ==========

    discordClient.on('entitlementCreate', (entitlement) => {
        broadcastEvent({
            event: 'entitlementCreate',
            guildId: entitlement.guildId,
            data: serializeEntitlement(entitlement),
        });
    });

    discordClient.on('entitlementUpdate', (oldEntitlement, newEntitlement) => {
        broadcastEvent({
            event: 'entitlementUpdate',
            guildId: newEntitlement.guildId,
            data: serializeEntitlement(newEntitlement),
        });
    });

    discordClient.on('entitlementDelete', (entitlement) => {
        broadcastEvent({
            event: 'entitlementDelete',
            guildId: entitlement.guildId,
            data: serializeEntitlement(entitlement),
        });
    });

    console.log('✅ Discord event handlers registered (45+ event types)');
}
