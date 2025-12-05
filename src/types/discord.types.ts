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
