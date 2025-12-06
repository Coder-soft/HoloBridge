import type {
    SerializedMessage,
    SerializedMember,
    SerializedChannel,
    SerializedRole,
    SerializedGuild,
    SerializedVoiceState,
    SerializedPresence,
    SerializedUser,
    SerializedReaction,
} from './discord.types.js';

// ============================================================================
// WebSocket Event Types
// ============================================================================

export type DiscordEventType =
    // Message Events
    | 'messageCreate'
    | 'messageUpdate'
    | 'messageDelete'
    | 'messageDeleteBulk'
    | 'messageReactionAdd'
    | 'messageReactionRemove'
    | 'messageReactionRemoveAll'
    | 'messageReactionRemoveEmoji'
    // Member Events
    | 'guildMemberAdd'
    | 'guildMemberRemove'
    | 'guildMemberUpdate'
    | 'presenceUpdate'
    | 'userUpdate'
    // Channel Events
    | 'channelCreate'
    | 'channelUpdate'
    | 'channelDelete'
    | 'channelPinsUpdate'
    | 'threadCreate'
    | 'threadUpdate'
    | 'threadDelete'
    | 'threadMembersUpdate'
    // Guild Events
    | 'guildCreate'
    | 'guildUpdate'
    | 'guildDelete'
    | 'guildBanAdd'
    | 'guildBanRemove'
    | 'guildEmojisUpdate'
    | 'guildIntegrationsUpdate'
    // Role Events
    | 'roleCreate'
    | 'roleUpdate'
    | 'roleDelete'
    // Voice Events
    | 'voiceStateUpdate'
    // Typing Events
    | 'typingStart'
    // Interaction Events
    | 'interactionCreate'
    // Invite Events
    | 'inviteCreate'
    | 'inviteDelete';

// ============================================================================
// Event Payload Definitions
// ============================================================================

export interface MessageCreateEvent {
    event: 'messageCreate';
    guildId: string | null;
    data: SerializedMessage;
}

export interface MessageUpdateEvent {
    event: 'messageUpdate';
    guildId: string | null;
    data: {
        old: Partial<SerializedMessage> | null;
        new: SerializedMessage;
    };
}

export interface MessageDeleteEvent {
    event: 'messageDelete';
    guildId: string | null;
    data: {
        id: string;
        channelId: string;
        guildId: string | null;
    };
}

export interface MessageDeleteBulkEvent {
    event: 'messageDeleteBulk';
    guildId: string | null;
    data: {
        ids: string[];
        channelId: string;
        guildId: string | null;
    };
}

export interface MessageReactionAddEvent {
    event: 'messageReactionAdd';
    guildId: string | null;
    data: {
        messageId: string;
        channelId: string;
        guildId: string | null;
        userId: string;
        reaction: SerializedReaction;
    };
}

export interface MessageReactionRemoveEvent {
    event: 'messageReactionRemove';
    guildId: string | null;
    data: {
        messageId: string;
        channelId: string;
        guildId: string | null;
        userId: string;
        emoji: { id: string | null; name: string | null };
    };
}

export interface GuildMemberAddEvent {
    event: 'guildMemberAdd';
    guildId: string;
    data: SerializedMember;
}

export interface GuildMemberRemoveEvent {
    event: 'guildMemberRemove';
    guildId: string;
    data: {
        user: SerializedUser;
        guildId: string;
    };
}

export interface GuildMemberUpdateEvent {
    event: 'guildMemberUpdate';
    guildId: string;
    data: {
        old: Partial<SerializedMember> | null;
        new: SerializedMember;
    };
}

export interface PresenceUpdateEvent {
    event: 'presenceUpdate';
    guildId: string | null;
    data: {
        old: SerializedPresence | null;
        new: SerializedPresence;
    };
}

export interface ChannelCreateEvent {
    event: 'channelCreate';
    guildId: string | null;
    data: SerializedChannel;
}

export interface ChannelUpdateEvent {
    event: 'channelUpdate';
    guildId: string | null;
    data: {
        old: Partial<SerializedChannel> | null;
        new: SerializedChannel;
    };
}

export interface ChannelDeleteEvent {
    event: 'channelDelete';
    guildId: string | null;
    data: SerializedChannel;
}

export interface ThreadCreateEvent {
    event: 'threadCreate';
    guildId: string | null;
    data: {
        thread: SerializedChannel;
        newlyCreated: boolean;
    };
}

export interface ThreadUpdateEvent {
    event: 'threadUpdate';
    guildId: string | null;
    data: {
        old: SerializedChannel | null;
        new: SerializedChannel;
    };
}

export interface ThreadDeleteEvent {
    event: 'threadDelete';
    guildId: string | null;
    data: {
        id: string;
        guildId: string | null;
        parentId: string | null;
        name: string | null;
        type: number;
    };
}

export interface ThreadMembersUpdateEvent {
    event: 'threadMembersUpdate';
    guildId: string | null;
    data: {
        threadId: string;
        guildId: string;
        addedMembers: Array<{
            id: string;
            threadId: string;
            joinedAt: string;
        }>;
        removedMemberIds: string[];
        memberCount: number;
    };
}

export interface RoleCreateEvent {
    event: 'roleCreate';
    guildId: string;
    data: SerializedRole;
}

export interface RoleUpdateEvent {
    event: 'roleUpdate';
    guildId: string;
    data: {
        old: Partial<SerializedRole> | null;
        new: SerializedRole;
    };
}

export interface RoleDeleteEvent {
    event: 'roleDelete';
    guildId: string;
    data: {
        id: string;
        guildId: string;
    };
}

export interface VoiceStateUpdateEvent {
    event: 'voiceStateUpdate';
    guildId: string | null;
    data: {
        old: SerializedVoiceState | null;
        new: SerializedVoiceState;
    };
}

export interface TypingStartEvent {
    event: 'typingStart';
    guildId: string | null;
    data: {
        channelId: string;
        userId: string;
        timestamp: string;
        member: SerializedMember | null;
    };
}

export interface GuildCreateEvent {
    event: 'guildCreate';
    guildId: string;
    data: SerializedGuild;
}

export interface GuildUpdateEvent {
    event: 'guildUpdate';
    guildId: string;
    data: {
        old: Partial<SerializedGuild> | null;
        new: SerializedGuild;
    };
}

export interface GuildDeleteEvent {
    event: 'guildDelete';
    guildId: string;
    data: {
        id: string;
        name: string | null;
        unavailable: boolean;
    };
}

export interface GuildBanAddEvent {
    event: 'guildBanAdd';
    guildId: string;
    data: {
        guildId: string;
        user: SerializedUser;
    };
}

export interface GuildBanRemoveEvent {
    event: 'guildBanRemove';
    guildId: string;
    data: {
        guildId: string;
        user: SerializedUser;
    };
}

// ============================================================================
// Union Types
// ============================================================================

export type DiscordEventPayload =
    | MessageCreateEvent
    | MessageUpdateEvent
    | MessageDeleteEvent
    | MessageDeleteBulkEvent
    | MessageReactionAddEvent
    | MessageReactionRemoveEvent
    | GuildMemberAddEvent
    | GuildMemberRemoveEvent
    | GuildMemberUpdateEvent
    | PresenceUpdateEvent
    | ChannelCreateEvent
    | ChannelUpdateEvent
    | ChannelDeleteEvent
    | ThreadCreateEvent
    | ThreadUpdateEvent
    | ThreadDeleteEvent
    | ThreadMembersUpdateEvent
    | RoleCreateEvent
    | RoleUpdateEvent
    | RoleDeleteEvent
    | VoiceStateUpdateEvent
    | TypingStartEvent
    | GuildCreateEvent
    | GuildUpdateEvent
    | GuildDeleteEvent
    | GuildBanAddEvent
    | GuildBanRemoveEvent;

// ============================================================================
// Client -> Server Events
// ============================================================================

export interface SubscribeEvent {
    guildIds: string[];
}

export interface UnsubscribeEvent {
    guildIds: string[];
}

export interface ClientToServerEvents {
    subscribe: (data: SubscribeEvent) => void;
    unsubscribe: (data: UnsubscribeEvent) => void;
}

export interface ServerToClientEvents {
    discord: (payload: DiscordEventPayload) => void;
    error: (error: { message: string; code?: string }) => void;
    subscribed: (data: { guildIds: string[] }) => void;
    unsubscribed: (data: { guildIds: string[] }) => void;
}

export interface InterServerEvents {
    // For future use with multiple server instances
}

export interface SocketData {
    apiKey: string;
    subscribedGuilds: Set<string>;
}
