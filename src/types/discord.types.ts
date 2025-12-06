import type { ChannelType as DiscordChannelType } from 'discord.js';

// ============================================================================
// Serialized Discord Types - JSON-safe representations for API responses
// ============================================================================

export interface SerializedUser {
    id: string;
    username: string;
    discriminator: string;
    globalName: string | null;
    avatar: string | null;
    avatarUrl: string | null;
    bot: boolean;
    system: boolean;
    createdAt: string;
}

export interface SerializedMember {
    id: string;
    displayName: string;
    nickname: string | null;
    avatar: string | null;
    displayAvatarUrl: string;
    joinedAt: string | null;
    premiumSince: string | null;
    roles: string[];
    pending: boolean;
    communicationDisabledUntil: string | null;
    user: SerializedUser;
    permissions: string[];
}

export interface SerializedRole {
    id: string;
    name: string;
    color: number;
    hexColor: string;
    hoist: boolean;
    position: number;
    permissions: string;
    managed: boolean;
    mentionable: boolean;
    icon: string | null;
    unicodeEmoji: string | null;
    createdAt: string;
    memberCount?: number;
}

export interface SerializedChannel {
    id: string;
    name: string | null;
    type: DiscordChannelType;
    typeName: string;
    position?: number;
    parentId: string | null;
    topic?: string | null;
    nsfw?: boolean;
    rateLimitPerUser?: number;
    bitrate?: number;
    userLimit?: number;
    createdAt: string;
}

export interface SerializedEmoji {
    id: string | null;
    name: string | null;
    identifier: string;
    animated: boolean;
    url: string | null;
    managed?: boolean;
    requiresColons?: boolean;
}

export interface SerializedAttachment {
    id: string;
    name: string;
    url: string;
    proxyUrl: string;
    size: number;
    contentType: string | null;
    width: number | null;
    height: number | null;
    spoiler: boolean;
}

export interface SerializedEmbed {
    title: string | null;
    description: string | null;
    url: string | null;
    color: number | null;
    timestamp: string | null;
    footer: { text: string; iconUrl?: string } | null;
    image: { url: string; width?: number; height?: number } | null;
    thumbnail: { url: string; width?: number; height?: number } | null;
    author: { name: string; url?: string; iconUrl?: string } | null;
    fields: Array<{ name: string; value: string; inline: boolean }>;
}

export interface SerializedReaction {
    emoji: SerializedEmoji;
    count: number;
    me: boolean;
}

export interface SerializedMessage {
    id: string;
    channelId: string;
    guildId: string | null;
    author: SerializedUser;
    member: Omit<SerializedMember, 'user'> | null;
    content: string;
    cleanContent: string;
    createdAt: string;
    editedAt: string | null;
    embeds: SerializedEmbed[];
    attachments: SerializedAttachment[];
    reactions: SerializedReaction[];
    pinned: boolean;
    tts: boolean;
    type: number;
    typeName: string;
    replyTo: string | null;
    mentions: {
        users: string[];
        roles: string[];
        channels: string[];
        everyone: boolean;
    };
}

export interface SerializedGuild {
    id: string;
    name: string;
    icon: string | null;
    iconUrl: string | null;
    banner: string | null;
    bannerUrl: string | null;
    splash: string | null;
    description: string | null;
    ownerId: string;
    memberCount: number;
    createdAt: string;
    joinedAt: string;
    features: string[];
    premiumTier: number;
    premiumSubscriptionCount: number | null;
    vanityUrlCode: string | null;
    verificationLevel: number;
    explicitContentFilter: number;
    defaultMessageNotifications: number;
    systemChannelId: string | null;
    rulesChannelId: string | null;
    afkChannelId: string | null;
    afkTimeout: number;
    preferredLocale: string;
    available: boolean;
}

export interface SerializedVoiceState {
    guildId: string | null;
    channelId: string | null;
    userId: string;
    member: SerializedMember | null;
    sessionId: string;
    deaf: boolean;
    mute: boolean;
    selfDeaf: boolean;
    selfMute: boolean;
    selfVideo: boolean;
    streaming: boolean;
    suppress: boolean;
    requestToSpeakTimestamp: string | null;
}

export interface SerializedPresence {
    userId: string;
    status: 'online' | 'idle' | 'dnd' | 'offline';
    activities: Array<{
        name: string;
        type: number;
        typeName: string;
        url: string | null;
        state: string | null;
        details: string | null;
        createdAt: string;
    }>;
    clientStatus: {
        web?: 'online' | 'idle' | 'dnd';
        mobile?: 'online' | 'idle' | 'dnd';
        desktop?: 'online' | 'idle' | 'dnd';
    } | null;
}

export interface SerializedBan {
    guildId: string;
    user: SerializedUser;
    reason: string | null;
}

// ============================================================================
// Pagination Types
// ============================================================================

export interface PaginationOptions {
    limit?: number;
    before?: string;
    after?: string;
    around?: string;
}

export interface PaginatedResponse<T> {
    items: T[];
    total?: number;
    hasMore: boolean;
}

// ============================================================================
// Sticker Types
// ============================================================================

export interface SerializedSticker {
    id: string;
    name: string;
    description: string | null;
    packId: string | null;
    type: number;
    format: number;
    formatName: string;
    available: boolean;
    guildId: string | null;
    user: SerializedUser | null;
    sortValue: number | null;
    tags: string | null;
    url: string;
    createdAt: string;
}

// ============================================================================
// Scheduled Event Types
// ============================================================================

export interface SerializedScheduledEvent {
    id: string;
    guildId: string;
    channelId: string | null;
    creatorId: string | null;
    creator: SerializedUser | null;
    name: string;
    description: string | null;
    scheduledStartTime: string;
    scheduledEndTime: string | null;
    privacyLevel: number;
    status: number;
    statusName: string;
    entityType: number;
    entityTypeName: string;
    entityId: string | null;
    entityMetadata: {
        location: string | null;
    } | null;
    userCount: number | null;
    image: string | null;
    imageUrl: string | null;
    createdAt: string;
}

// ============================================================================
// Auto Moderation Types
// ============================================================================

export interface SerializedAutoModRule {
    id: string;
    guildId: string;
    name: string;
    creatorId: string;
    eventType: number;
    triggerType: number;
    triggerTypeName: string;
    triggerMetadata: {
        keywordFilter?: string[];
        regexPatterns?: string[];
        presets?: number[];
        allowList?: string[];
        mentionTotalLimit?: number;
        mentionRaidProtectionEnabled?: boolean;
    };
    actions: Array<{
        type: number;
        typeName: string;
        metadata?: {
            channelId?: string;
            durationSeconds?: number;
            customMessage?: string;
        };
    }>;
    enabled: boolean;
    exemptRoles: string[];
    exemptChannels: string[];
}

export interface SerializedAutoModAction {
    ruleId: string;
    ruleTriggerType: number;
    guildId: string;
    userId: string;
    channelId: string | null;
    messageId: string | null;
    alertSystemMessageId: string | null;
    content: string;
    matchedKeyword: string | null;
    matchedContent: string | null;
    action: {
        type: number;
        typeName: string;
        metadata?: {
            channelId?: string;
            durationSeconds?: number;
            customMessage?: string;
        };
    };
}

// ============================================================================
// Stage Instance Types
// ============================================================================

export interface SerializedStageInstance {
    id: string;
    guildId: string;
    channelId: string;
    topic: string;
    privacyLevel: number;
    privacyLevelName: string;
    guildScheduledEventId: string | null;
    createdAt: string;
}

// ============================================================================
// Invite Types
// ============================================================================

export interface SerializedInvite {
    code: string;
    guildId: string | null;
    channelId: string | null;
    inviter: SerializedUser | null;
    targetUser: SerializedUser | null;
    targetType: number | null;
    uses: number | null;
    maxUses: number | null;
    maxAge: number | null;
    temporary: boolean;
    createdAt: string | null;
    expiresAt: string | null;
    url: string;
}

// ============================================================================
// Audit Log Types
// ============================================================================

export interface SerializedAuditLogEntry {
    id: string;
    guildId: string;
    actionType: number;
    actionTypeName: string;
    targetId: string | null;
    executorId: string | null;
    executor: SerializedUser | null;
    reason: string | null;
    changes: Array<{
        key: string;
        old: unknown;
        new: unknown;
    }>;
    extra: unknown;
    createdAt: string;
}

// ============================================================================
// Interaction Types
// ============================================================================

export interface SerializedInteraction {
    id: string;
    type: number;
    typeName: string;
    guildId: string | null;
    channelId: string | null;
    user: SerializedUser;
    member: SerializedMember | null;
    token: string;
    applicationId: string;
    commandName: string | null;
    commandId: string | null;
    commandType: number | null;
    customId: string | null;
    componentType: number | null;
    values: string[] | null;
    targetId: string | null;
    locale: string;
    guildLocale: string | null;
    createdAt: string;
}

// ============================================================================
// Poll Types
// ============================================================================

export interface SerializedPoll {
    question: string;
    answers: Array<{
        answerId: number;
        text: string;
        emoji: SerializedEmoji | null;
    }>;
    expiresAt: string | null;
    allowMultiselect: boolean;
    layoutType: number;
    results: {
        isFinalized: boolean;
        answerCounts: Array<{
            answerId: number;
            count: number;
            meVoted: boolean;
        }>;
    } | null;
}

// ============================================================================
// Entitlement Types
// ============================================================================

export interface SerializedEntitlement {
    id: string;
    skuId: string;
    userId: string | null;
    guildId: string | null;
    applicationId: string;
    type: number;
    typeName: string;
    consumed: boolean;
    startsAt: string | null;
    endsAt: string | null;
    createdAt: string;
}

// ============================================================================
// Webhook Types
// ============================================================================

export interface SerializedWebhook {
    id: string;
    guildId: string | null;
    channelId: string;
    name: string | null;
    type: number;
    typeName: string;
    avatar: string | null;
    avatarUrl: string | null;
    token: string | null;
    owner: SerializedUser | null;
    sourceGuild: { id: string; name: string; icon: string | null } | null;
    sourceChannel: { id: string; name: string } | null;
    url: string | null;
    createdAt: string;
}
