import {
    Guild,
    GuildMember,
    User,
    Message,
    Role,
    Channel,
    VoiceState,
    Presence,
    Attachment,
    Embed,
    MessageReaction,
    ChannelType,
    ActivityType,
    GuildBan,
    PermissionsBitField,
} from 'discord.js';
import type {
    SerializedGuild,
    SerializedMember,
    SerializedUser,
    SerializedMessage,
    SerializedRole,
    SerializedChannel,
    SerializedVoiceState,
    SerializedPresence,
    SerializedAttachment,
    SerializedEmbed,
    SerializedReaction,
    SerializedEmoji,
    SerializedBan,
} from '../types/discord.types.js';

// ============================================================================
// Channel Type Names
// ============================================================================

const channelTypeNames: Record<ChannelType, string> = {
    [ChannelType.GuildText]: 'text',
    [ChannelType.DM]: 'dm',
    [ChannelType.GuildVoice]: 'voice',
    [ChannelType.GroupDM]: 'group_dm',
    [ChannelType.GuildCategory]: 'category',
    [ChannelType.GuildAnnouncement]: 'announcement',
    [ChannelType.AnnouncementThread]: 'announcement_thread',
    [ChannelType.PublicThread]: 'public_thread',
    [ChannelType.PrivateThread]: 'private_thread',
    [ChannelType.GuildStageVoice]: 'stage',
    [ChannelType.GuildDirectory]: 'directory',
    [ChannelType.GuildForum]: 'forum',
    [ChannelType.GuildMedia]: 'media',
};

const activityTypeNames: Record<ActivityType, string> = {
    [ActivityType.Playing]: 'playing',
    [ActivityType.Streaming]: 'streaming',
    [ActivityType.Listening]: 'listening',
    [ActivityType.Watching]: 'watching',
    [ActivityType.Custom]: 'custom',
    [ActivityType.Competing]: 'competing',
};

// ============================================================================
// Serializers
// ============================================================================

export function serializeUser(user: User): SerializedUser {
    return {
        id: user.id,
        username: user.username,
        discriminator: user.discriminator,
        globalName: user.globalName,
        avatar: user.avatar,
        avatarUrl: user.displayAvatarURL({ size: 256 }),
        bot: user.bot,
        system: user.system,
        createdAt: user.createdAt.toISOString(),
    };
}

export function serializeMember(member: GuildMember): SerializedMember {
    return {
        id: member.id,
        displayName: member.displayName,
        nickname: member.nickname,
        avatar: member.avatar,
        displayAvatarUrl: member.displayAvatarURL({ size: 256 }),
        joinedAt: member.joinedAt?.toISOString() ?? null,
        premiumSince: member.premiumSince?.toISOString() ?? null,
        roles: member.roles.cache.map((r) => r.id),
        pending: member.pending,
        communicationDisabledUntil: member.communicationDisabledUntil?.toISOString() ?? null,
        user: serializeUser(member.user),
        permissions: new PermissionsBitField(member.permissions.bitfield).toArray(),
    };
}

export function serializeRole(role: Role): SerializedRole {
    return {
        id: role.id,
        name: role.name,
        color: role.color,
        hexColor: role.hexColor,
        hoist: role.hoist,
        position: role.position,
        permissions: role.permissions.bitfield.toString(),
        managed: role.managed,
        mentionable: role.mentionable,
        icon: role.icon,
        unicodeEmoji: role.unicodeEmoji,
        createdAt: role.createdAt.toISOString(),
        memberCount: role.members.size,
    };
}

export function serializeChannel(channel: Channel): SerializedChannel {
    const base: SerializedChannel = {
        id: channel.id,
        name: 'name' in channel ? channel.name : null,
        type: channel.type,
        typeName: channelTypeNames[channel.type] ?? 'unknown',
        parentId: 'parentId' in channel ? channel.parentId : null,
        createdAt: channel.createdAt?.toISOString() ?? new Date().toISOString(),
    };

    if ('position' in channel) {
        base.position = channel.position;
    }
    if ('topic' in channel && channel.topic !== undefined) {
        base.topic = channel.topic;
    }
    if ('nsfw' in channel) {
        base.nsfw = channel.nsfw;
    }
    if ('rateLimitPerUser' in channel) {
        base.rateLimitPerUser = channel.rateLimitPerUser ?? undefined;
    }
    if ('bitrate' in channel) {
        base.bitrate = channel.bitrate;
    }
    if ('userLimit' in channel) {
        base.userLimit = channel.userLimit;
    }

    return base;
}

export function serializeGuild(guild: Guild): SerializedGuild {
    return {
        id: guild.id,
        name: guild.name,
        icon: guild.icon,
        iconUrl: guild.iconURL({ size: 256 }),
        banner: guild.banner,
        bannerUrl: guild.bannerURL({ size: 512 }),
        splash: guild.splash,
        description: guild.description,
        ownerId: guild.ownerId,
        memberCount: guild.memberCount,
        createdAt: guild.createdAt.toISOString(),
        joinedAt: guild.joinedAt.toISOString(),
        features: guild.features,
        premiumTier: guild.premiumTier,
        premiumSubscriptionCount: guild.premiumSubscriptionCount,
        vanityUrlCode: guild.vanityURLCode,
        verificationLevel: guild.verificationLevel,
        explicitContentFilter: guild.explicitContentFilter,
        defaultMessageNotifications: guild.defaultMessageNotifications,
        systemChannelId: guild.systemChannelId,
        rulesChannelId: guild.rulesChannelId,
        afkChannelId: guild.afkChannelId,
        afkTimeout: guild.afkTimeout,
        preferredLocale: guild.preferredLocale,
        available: guild.available,
    };
}

export function serializeAttachment(attachment: Attachment): SerializedAttachment {
    return {
        id: attachment.id,
        name: attachment.name,
        url: attachment.url,
        proxyUrl: attachment.proxyURL,
        size: attachment.size,
        contentType: attachment.contentType,
        width: attachment.width,
        height: attachment.height,
        spoiler: attachment.spoiler,
    };
}

export function serializeEmbed(embed: Embed): SerializedEmbed {
    return {
        title: embed.title,
        description: embed.description,
        url: embed.url,
        color: embed.color,
        timestamp: embed.timestamp,
        footer: embed.footer ? { text: embed.footer.text, iconUrl: embed.footer.iconURL ?? undefined } : null,
        image: embed.image ? { url: embed.image.url, width: embed.image.width, height: embed.image.height } : null,
        thumbnail: embed.thumbnail ? { url: embed.thumbnail.url, width: embed.thumbnail.width, height: embed.thumbnail.height } : null,
        author: embed.author ? { name: embed.author.name, url: embed.author.url ?? undefined, iconUrl: embed.author.iconURL ?? undefined } : null,
        fields: embed.fields.map((f) => ({ name: f.name, value: f.value, inline: Boolean(f.inline) })),
    };
}

export function serializeEmoji(emoji: { id: string | null; name: string | null; animated?: boolean }): SerializedEmoji {
    return {
        id: emoji.id,
        name: emoji.name,
        identifier: emoji.id ? `${emoji.name}:${emoji.id}` : emoji.name ?? '',
        animated: emoji.animated ?? false,
        url: emoji.id ? `https://cdn.discordapp.com/emojis/${emoji.id}.${emoji.animated ? 'gif' : 'png'}` : null,
    };
}

export function serializeReaction(reaction: MessageReaction): SerializedReaction {
    return {
        emoji: serializeEmoji({
            id: reaction.emoji.id,
            name: reaction.emoji.name,
            animated: reaction.emoji.animated ?? undefined,
        }),
        count: reaction.count,
        me: reaction.me,
    };
}

export function serializeMessage(message: Message): SerializedMessage {
    return {
        id: message.id,
        channelId: message.channelId,
        guildId: message.guildId,
        author: serializeUser(message.author),
        member: message.member ? {
            id: message.member.id,
            displayName: message.member.displayName,
            nickname: message.member.nickname,
            avatar: message.member.avatar,
            displayAvatarUrl: message.member.displayAvatarURL({ size: 256 }),
            joinedAt: message.member.joinedAt?.toISOString() ?? null,
            premiumSince: message.member.premiumSince?.toISOString() ?? null,
            roles: message.member.roles.cache.map((r) => r.id),
            pending: message.member.pending,
            communicationDisabledUntil: message.member.communicationDisabledUntil?.toISOString() ?? null,
            permissions: new PermissionsBitField(message.member.permissions.bitfield).toArray(),
        } : null,
        content: message.content,
        cleanContent: message.cleanContent,
        createdAt: message.createdAt.toISOString(),
        editedAt: message.editedAt?.toISOString() ?? null,
        embeds: message.embeds.map(serializeEmbed),
        attachments: message.attachments.map(serializeAttachment),
        reactions: message.reactions.cache.map(serializeReaction),
        pinned: message.pinned,
        tts: message.tts,
        type: message.type,
        typeName: message.type.toString(),
        replyTo: message.reference?.messageId ?? null,
        mentions: {
            users: message.mentions.users.map((u) => u.id),
            roles: message.mentions.roles.map((r) => r.id),
            channels: message.mentions.channels.map((c) => c.id),
            everyone: message.mentions.everyone,
        },
    };
}

export function serializeVoiceState(voiceState: VoiceState): SerializedVoiceState {
    return {
        guildId: voiceState.guild?.id ?? null,
        channelId: voiceState.channelId,
        userId: voiceState.id,
        member: voiceState.member ? serializeMember(voiceState.member) : null,
        sessionId: voiceState.sessionId ?? '',
        deaf: voiceState.deaf ?? false,
        mute: voiceState.mute ?? false,
        selfDeaf: voiceState.selfDeaf ?? false,
        selfMute: voiceState.selfMute ?? false,
        selfVideo: voiceState.selfVideo ?? false,
        streaming: voiceState.streaming ?? false,
        suppress: voiceState.suppress ?? false,
        requestToSpeakTimestamp: voiceState.requestToSpeakTimestamp ? new Date(voiceState.requestToSpeakTimestamp).toISOString() : null,
    };
}

export function serializePresence(presence: Presence): SerializedPresence {
    return {
        userId: presence.userId,
        status: presence.status as 'online' | 'idle' | 'dnd' | 'offline',
        activities: presence.activities.map((a) => ({
            name: a.name,
            type: a.type,
            typeName: activityTypeNames[a.type] ?? 'unknown',
            url: a.url,
            state: a.state,
            details: a.details,
            createdAt: a.createdAt.toISOString(),
        })),
        clientStatus: presence.clientStatus ? {
            web: presence.clientStatus.web as 'online' | 'idle' | 'dnd' | undefined,
            mobile: presence.clientStatus.mobile as 'online' | 'idle' | 'dnd' | undefined,
            desktop: presence.clientStatus.desktop as 'online' | 'idle' | 'dnd' | undefined,
        } : null,
    };
}

export function serializeBan(ban: GuildBan): SerializedBan {
    return {
        guildId: ban.guild.id,
        user: serializeUser(ban.user),
        reason: ban.reason ?? null,
    };
}
