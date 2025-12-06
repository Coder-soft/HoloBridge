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
    SerializedEmoji,
    SerializedSticker,
    SerializedScheduledEvent,
    SerializedAutoModRule,
    SerializedAutoModAction,
    SerializedStageInstance,
    SerializedInvite,
    SerializedAuditLogEntry,
    SerializedInteraction,
    SerializedEntitlement,
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
    | 'messagePollVoteAdd'
    | 'messagePollVoteRemove'
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
    | 'webhookUpdate'
    // Guild Events
    | 'guildCreate'
    | 'guildUpdate'
    | 'guildDelete'
    | 'guildBanAdd'
    | 'guildBanRemove'
    | 'guildIntegrationsUpdate'
    | 'guildAuditLogEntryCreate'
    // Emoji Events
    | 'emojiCreate'
    | 'emojiUpdate'
    | 'emojiDelete'
    // Sticker Events
    | 'stickerCreate'
    | 'stickerUpdate'
    | 'stickerDelete'
    // Role Events
    | 'roleCreate'
    | 'roleUpdate'
    | 'roleDelete'
    // Voice Events
    | 'voiceStateUpdate'
    // Stage Instance Events
    | 'stageInstanceCreate'
    | 'stageInstanceUpdate'
    | 'stageInstanceDelete'
    // Scheduled Event Events
    | 'guildScheduledEventCreate'
    | 'guildScheduledEventUpdate'
    | 'guildScheduledEventDelete'
    | 'guildScheduledEventUserAdd'
    | 'guildScheduledEventUserRemove'
    // AutoMod Events
    | 'autoModerationRuleCreate'
    | 'autoModerationRuleUpdate'
    | 'autoModerationRuleDelete'
    | 'autoModerationActionExecution'
    // Typing Events
    | 'typingStart'
    // Interaction Events
    | 'interactionCreate'
    // Invite Events
    | 'inviteCreate'
    | 'inviteDelete'
    // Entitlement Events
    | 'entitlementCreate'
    | 'entitlementUpdate'
    | 'entitlementDelete';

// ============================================================================
// Message Event Payload Definitions
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

export interface MessageReactionRemoveAllEvent {
    event: 'messageReactionRemoveAll';
    guildId: string | null;
    data: {
        messageId: string;
        channelId: string;
        guildId: string | null;
    };
}

export interface MessageReactionRemoveEmojiEvent {
    event: 'messageReactionRemoveEmoji';
    guildId: string | null;
    data: {
        messageId: string;
        channelId: string;
        guildId: string | null;
        emoji: { id: string | null; name: string | null };
    };
}

export interface MessagePollVoteAddEvent {
    event: 'messagePollVoteAdd';
    guildId: string | null;
    data: {
        messageId: string;
        channelId: string;
        guildId: string | null;
        userId: string;
        answerId: number;
    };
}

export interface MessagePollVoteRemoveEvent {
    event: 'messagePollVoteRemove';
    guildId: string | null;
    data: {
        messageId: string;
        channelId: string;
        guildId: string | null;
        userId: string;
        answerId: number;
    };
}

// ============================================================================
// Member Event Payload Definitions
// ============================================================================

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

export interface UserUpdateEvent {
    event: 'userUpdate';
    guildId: null;
    data: {
        old: Partial<SerializedUser> | null;
        new: SerializedUser;
    };
}

// ============================================================================
// Channel Event Payload Definitions
// ============================================================================

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

export interface ChannelPinsUpdateEvent {
    event: 'channelPinsUpdate';
    guildId: string | null;
    data: {
        channelId: string;
        guildId: string | null;
        lastPinAt: string | null;
    };
}

export interface WebhookUpdateEvent {
    event: 'webhookUpdate';
    guildId: string;
    data: {
        channelId: string;
        guildId: string;
    };
}

// ============================================================================
// Thread Event Payload Definitions
// ============================================================================

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

// ============================================================================
// Role Event Payload Definitions
// ============================================================================

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

// ============================================================================
// Voice Event Payload Definitions
// ============================================================================

export interface VoiceStateUpdateEvent {
    event: 'voiceStateUpdate';
    guildId: string | null;
    data: {
        old: SerializedVoiceState | null;
        new: SerializedVoiceState;
    };
}

// ============================================================================
// Typing Event Payload Definitions
// ============================================================================

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

// ============================================================================
// Guild Event Payload Definitions
// ============================================================================

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

export interface GuildIntegrationsUpdateEvent {
    event: 'guildIntegrationsUpdate';
    guildId: string;
    data: {
        guildId: string;
    };
}

export interface GuildAuditLogEntryCreateEvent {
    event: 'guildAuditLogEntryCreate';
    guildId: string;
    data: SerializedAuditLogEntry;
}

// ============================================================================
// Emoji Event Payload Definitions
// ============================================================================

export interface EmojiCreateEvent {
    event: 'emojiCreate';
    guildId: string;
    data: SerializedEmoji;
}

export interface EmojiUpdateEvent {
    event: 'emojiUpdate';
    guildId: string;
    data: {
        old: Partial<SerializedEmoji> | null;
        new: SerializedEmoji;
    };
}

export interface EmojiDeleteEvent {
    event: 'emojiDelete';
    guildId: string;
    data: SerializedEmoji;
}

// ============================================================================
// Sticker Event Payload Definitions
// ============================================================================

export interface StickerCreateEvent {
    event: 'stickerCreate';
    guildId: string;
    data: SerializedSticker;
}

export interface StickerUpdateEvent {
    event: 'stickerUpdate';
    guildId: string;
    data: {
        old: Partial<SerializedSticker> | null;
        new: SerializedSticker;
    };
}

export interface StickerDeleteEvent {
    event: 'stickerDelete';
    guildId: string;
    data: SerializedSticker;
}

// ============================================================================
// Stage Instance Event Payload Definitions
// ============================================================================

export interface StageInstanceCreateEvent {
    event: 'stageInstanceCreate';
    guildId: string;
    data: SerializedStageInstance;
}

export interface StageInstanceUpdateEvent {
    event: 'stageInstanceUpdate';
    guildId: string;
    data: {
        old: SerializedStageInstance | null;
        new: SerializedStageInstance;
    };
}

export interface StageInstanceDeleteEvent {
    event: 'stageInstanceDelete';
    guildId: string;
    data: SerializedStageInstance;
}

// ============================================================================
// Scheduled Event Payload Definitions
// ============================================================================

export interface GuildScheduledEventCreateEvent {
    event: 'guildScheduledEventCreate';
    guildId: string;
    data: SerializedScheduledEvent;
}

export interface GuildScheduledEventUpdateEvent {
    event: 'guildScheduledEventUpdate';
    guildId: string;
    data: {
        old: SerializedScheduledEvent | null;
        new: SerializedScheduledEvent;
    };
}

export interface GuildScheduledEventDeleteEvent {
    event: 'guildScheduledEventDelete';
    guildId: string;
    data: SerializedScheduledEvent;
}

export interface GuildScheduledEventUserAddEvent {
    event: 'guildScheduledEventUserAdd';
    guildId: string;
    data: {
        guildScheduledEventId: string;
        userId: string;
        guildId: string;
    };
}

export interface GuildScheduledEventUserRemoveEvent {
    event: 'guildScheduledEventUserRemove';
    guildId: string;
    data: {
        guildScheduledEventId: string;
        userId: string;
        guildId: string;
    };
}

// ============================================================================
// AutoMod Event Payload Definitions
// ============================================================================

export interface AutoModerationRuleCreateEvent {
    event: 'autoModerationRuleCreate';
    guildId: string;
    data: SerializedAutoModRule;
}

export interface AutoModerationRuleUpdateEvent {
    event: 'autoModerationRuleUpdate';
    guildId: string;
    data: {
        old: SerializedAutoModRule | null;
        new: SerializedAutoModRule;
    };
}

export interface AutoModerationRuleDeleteEvent {
    event: 'autoModerationRuleDelete';
    guildId: string;
    data: SerializedAutoModRule;
}

export interface AutoModerationActionExecutionEvent {
    event: 'autoModerationActionExecution';
    guildId: string;
    data: SerializedAutoModAction;
}

// ============================================================================
// Interaction Event Payload Definitions
// ============================================================================

export interface InteractionCreateEvent {
    event: 'interactionCreate';
    guildId: string | null;
    data: SerializedInteraction;
}

// ============================================================================
// Invite Event Payload Definitions
// ============================================================================

export interface InviteCreateEvent {
    event: 'inviteCreate';
    guildId: string | null;
    data: SerializedInvite;
}

export interface InviteDeleteEvent {
    event: 'inviteDelete';
    guildId: string | null;
    data: {
        code: string;
        channelId: string;
        guildId: string | null;
    };
}

// ============================================================================
// Entitlement Event Payload Definitions
// ============================================================================

export interface EntitlementCreateEvent {
    event: 'entitlementCreate';
    guildId: string | null;
    data: SerializedEntitlement;
}

export interface EntitlementUpdateEvent {
    event: 'entitlementUpdate';
    guildId: string | null;
    data: SerializedEntitlement;
}

export interface EntitlementDeleteEvent {
    event: 'entitlementDelete';
    guildId: string | null;
    data: SerializedEntitlement;
}

// ============================================================================
// Union Types
// ============================================================================

export type DiscordEventPayload =
    // Message Events
    | MessageCreateEvent
    | MessageUpdateEvent
    | MessageDeleteEvent
    | MessageDeleteBulkEvent
    | MessageReactionAddEvent
    | MessageReactionRemoveEvent
    | MessageReactionRemoveAllEvent
    | MessageReactionRemoveEmojiEvent
    | MessagePollVoteAddEvent
    | MessagePollVoteRemoveEvent
    // Member Events
    | GuildMemberAddEvent
    | GuildMemberRemoveEvent
    | GuildMemberUpdateEvent
    | PresenceUpdateEvent
    | UserUpdateEvent
    // Channel Events
    | ChannelCreateEvent
    | ChannelUpdateEvent
    | ChannelDeleteEvent
    | ChannelPinsUpdateEvent
    | WebhookUpdateEvent
    // Thread Events
    | ThreadCreateEvent
    | ThreadUpdateEvent
    | ThreadDeleteEvent
    | ThreadMembersUpdateEvent
    // Role Events
    | RoleCreateEvent
    | RoleUpdateEvent
    | RoleDeleteEvent
    // Voice Events
    | VoiceStateUpdateEvent
    // Typing Events
    | TypingStartEvent
    // Guild Events
    | GuildCreateEvent
    | GuildUpdateEvent
    | GuildDeleteEvent
    | GuildBanAddEvent
    | GuildBanRemoveEvent
    | GuildIntegrationsUpdateEvent
    | GuildAuditLogEntryCreateEvent
    // Emoji Events
    | EmojiCreateEvent
    | EmojiUpdateEvent
    | EmojiDeleteEvent
    // Sticker Events
    | StickerCreateEvent
    | StickerUpdateEvent
    | StickerDeleteEvent
    // Stage Instance Events
    | StageInstanceCreateEvent
    | StageInstanceUpdateEvent
    | StageInstanceDeleteEvent
    // Scheduled Event Events
    | GuildScheduledEventCreateEvent
    | GuildScheduledEventUpdateEvent
    | GuildScheduledEventDeleteEvent
    | GuildScheduledEventUserAddEvent
    | GuildScheduledEventUserRemoveEvent
    // AutoMod Events
    | AutoModerationRuleCreateEvent
    | AutoModerationRuleUpdateEvent
    | AutoModerationRuleDeleteEvent
    | AutoModerationActionExecutionEvent
    // Interaction Events
    | InteractionCreateEvent
    // Invite Events
    | InviteCreateEvent
    | InviteDeleteEvent
    // Entitlement Events
    | EntitlementCreateEvent
    | EntitlementUpdateEvent
    | EntitlementDeleteEvent;

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
