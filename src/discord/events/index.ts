import type { Server as SocketIOServer } from 'socket.io';
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

    console.log('✅ Discord event handlers registered');
}
