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

// ============================================================================
// New Serializers for Additional Discord Features
// ============================================================================

import type {
    Sticker,
    GuildScheduledEvent,
    AutoModerationRule,
    AutoModerationActionExecution,
    StageInstance,
    Invite,
    GuildAuditLogsEntry,
    Interaction,
    Entitlement,
    GuildEmoji,
    Webhook,
} from 'discord.js';
import {
    AutoModerationRuleTriggerType,
    AutoModerationActionType,
    GuildScheduledEventStatus,
    GuildScheduledEventEntityType,
    StageInstancePrivacyLevel,
    InteractionType,
    WebhookType,
    StickerFormatType,
    AuditLogEvent,
} from 'discord.js';
import type {
    SerializedSticker,
    SerializedScheduledEvent,
    SerializedAutoModRule,
    SerializedAutoModAction,
    SerializedStageInstance,
    SerializedInvite,
    SerializedAuditLogEntry,
    SerializedInteraction,
    SerializedEntitlement,
    SerializedWebhook,
} from '../types/discord.types.js';

const stickerFormatNames: Record<StickerFormatType, string> = {
    [StickerFormatType.PNG]: 'png',
    [StickerFormatType.APNG]: 'apng',
    [StickerFormatType.Lottie]: 'lottie',
    [StickerFormatType.GIF]: 'gif',
};

const autoModTriggerTypeNames: Record<AutoModerationRuleTriggerType, string> = {
    [AutoModerationRuleTriggerType.Keyword]: 'keyword',
    [AutoModerationRuleTriggerType.Spam]: 'spam',
    [AutoModerationRuleTriggerType.KeywordPreset]: 'keyword_preset',
    [AutoModerationRuleTriggerType.MentionSpam]: 'mention_spam',
    [AutoModerationRuleTriggerType.MemberProfile]: 'member_profile',
};

const autoModActionTypeNames: Record<AutoModerationActionType, string> = {
    [AutoModerationActionType.BlockMessage]: 'block_message',
    [AutoModerationActionType.SendAlertMessage]: 'send_alert_message',
    [AutoModerationActionType.Timeout]: 'timeout',
    [AutoModerationActionType.BlockMemberInteraction]: 'block_member_interaction',
};

const scheduledEventStatusNames: Partial<Record<GuildScheduledEventStatus, string>> = {
    [GuildScheduledEventStatus.Scheduled]: 'scheduled',
    [GuildScheduledEventStatus.Active]: 'active',
    [GuildScheduledEventStatus.Completed]: 'completed',
    [GuildScheduledEventStatus.Canceled]: 'canceled',
};

const scheduledEventEntityTypeNames: Record<GuildScheduledEventEntityType, string> = {
    [GuildScheduledEventEntityType.StageInstance]: 'stage_instance',
    [GuildScheduledEventEntityType.Voice]: 'voice',
    [GuildScheduledEventEntityType.External]: 'external',
};

const stagePrivacyLevelNames: Partial<Record<StageInstancePrivacyLevel, string>> = {
    [StageInstancePrivacyLevel.GuildOnly]: 'guild_only',
};

const interactionTypeNames: Record<InteractionType, string> = {
    [InteractionType.Ping]: 'ping',
    [InteractionType.ApplicationCommand]: 'application_command',
    [InteractionType.MessageComponent]: 'message_component',
    [InteractionType.ApplicationCommandAutocomplete]: 'autocomplete',
    [InteractionType.ModalSubmit]: 'modal_submit',
};

const webhookTypeNames: Record<WebhookType, string> = {
    [WebhookType.Incoming]: 'incoming',
    [WebhookType.ChannelFollower]: 'channel_follower',
    [WebhookType.Application]: 'application',
};

export function serializeSticker(sticker: Sticker): SerializedSticker {
    return {
        id: sticker.id,
        name: sticker.name,
        description: sticker.description,
        packId: sticker.packId,
        type: sticker.type ?? 0,
        format: sticker.format,
        formatName: stickerFormatNames[sticker.format] ?? 'unknown',
        available: sticker.available ?? true,
        guildId: sticker.guildId,
        user: sticker.user ? serializeUser(sticker.user) : null,
        sortValue: sticker.sortValue,
        tags: sticker.tags,
        url: sticker.url,
        createdAt: sticker.createdAt.toISOString(),
    };
}

export function serializeGuildEmoji(emoji: GuildEmoji): SerializedEmoji {
    return {
        id: emoji.id,
        name: emoji.name,
        identifier: emoji.identifier,
        animated: emoji.animated ?? false,
        url: emoji.url,
        managed: emoji.managed,
        requiresColons: emoji.requiresColons ?? true,
    };
}

export function serializeScheduledEvent(event: GuildScheduledEvent): SerializedScheduledEvent {
    return {
        id: event.id,
        guildId: event.guildId,
        channelId: event.channelId,
        creatorId: event.creatorId,
        creator: event.creator ? serializeUser(event.creator) : null,
        name: event.name,
        description: event.description,
        scheduledStartTime: event.scheduledStartAt?.toISOString() ?? new Date().toISOString(),
        scheduledEndTime: event.scheduledEndAt?.toISOString() ?? null,
        privacyLevel: event.privacyLevel,
        status: event.status,
        statusName: scheduledEventStatusNames[event.status] ?? 'unknown',
        entityType: event.entityType,
        entityTypeName: scheduledEventEntityTypeNames[event.entityType] ?? 'unknown',
        entityId: event.entityId,
        entityMetadata: event.entityMetadata ? {
            location: event.entityMetadata.location ?? null,
        } : null,
        userCount: event.userCount,
        image: event.image,
        imageUrl: event.coverImageURL({ size: 512 }),
        createdAt: event.createdAt?.toISOString() ?? new Date().toISOString(),
    };
}

export function serializeAutoModRule(rule: AutoModerationRule): SerializedAutoModRule {
    return {
        id: rule.id,
        guildId: rule.guild.id,
        name: rule.name,
        creatorId: rule.creatorId,
        eventType: rule.eventType,
        triggerType: rule.triggerType,
        triggerTypeName: autoModTriggerTypeNames[rule.triggerType] ?? 'unknown',
        triggerMetadata: {
            keywordFilter: rule.triggerMetadata.keywordFilter ? [...rule.triggerMetadata.keywordFilter] : undefined,
            regexPatterns: rule.triggerMetadata.regexPatterns ? [...rule.triggerMetadata.regexPatterns] : undefined,
            presets: rule.triggerMetadata.presets ? [...rule.triggerMetadata.presets] : undefined,
            allowList: rule.triggerMetadata.allowList ? [...rule.triggerMetadata.allowList] : undefined,
            mentionTotalLimit: rule.triggerMetadata.mentionTotalLimit ?? undefined,
            mentionRaidProtectionEnabled: rule.triggerMetadata.mentionRaidProtectionEnabled,
        },
        actions: rule.actions.map(action => ({
            type: action.type,
            typeName: autoModActionTypeNames[action.type] ?? 'unknown',
            metadata: action.metadata ? {
                channelId: action.metadata.channelId ?? undefined,
                durationSeconds: action.metadata.durationSeconds ?? undefined,
                customMessage: action.metadata.customMessage ?? undefined,
            } : undefined,
        })),
        enabled: rule.enabled,
        exemptRoles: Array.from(rule.exemptRoles.keys()),
        exemptChannels: Array.from(rule.exemptChannels.keys()),
    };
}

export function serializeAutoModAction(execution: AutoModerationActionExecution): SerializedAutoModAction {
    return {
        ruleId: execution.ruleId,
        ruleTriggerType: execution.ruleTriggerType,
        guildId: execution.guild.id,
        userId: execution.userId,
        channelId: execution.channelId,
        messageId: execution.messageId,
        alertSystemMessageId: execution.alertSystemMessageId,
        content: execution.content,
        matchedKeyword: execution.matchedKeyword,
        matchedContent: execution.matchedContent,
        action: {
            type: execution.action.type,
            typeName: autoModActionTypeNames[execution.action.type] ?? 'unknown',
            metadata: execution.action.metadata ? {
                channelId: execution.action.metadata.channelId ?? undefined,
                durationSeconds: execution.action.metadata.durationSeconds ?? undefined,
                customMessage: execution.action.metadata.customMessage ?? undefined,
            } : undefined,
        },
    };
}

export function serializeStageInstance(stage: StageInstance): SerializedStageInstance {
    return {
        id: stage.id,
        guildId: stage.guildId,
        channelId: stage.channelId,
        topic: stage.topic,
        privacyLevel: stage.privacyLevel,
        privacyLevelName: stagePrivacyLevelNames[stage.privacyLevel] ?? 'unknown',
        guildScheduledEventId: stage.guildScheduledEventId ?? null,
        createdAt: stage.createdAt?.toISOString() ?? new Date().toISOString(),
    };
}

export function serializeInvite(invite: Invite): SerializedInvite {
    return {
        code: invite.code,
        guildId: invite.guild?.id ?? null,
        channelId: invite.channel?.id ?? null,
        inviter: invite.inviter ? serializeUser(invite.inviter) : null,
        targetUser: invite.targetUser ? serializeUser(invite.targetUser) : null,
        targetType: invite.targetType ?? null,
        uses: invite.uses,
        maxUses: invite.maxUses,
        maxAge: invite.maxAge,
        temporary: invite.temporary ?? false,
        createdAt: invite.createdAt?.toISOString() ?? null,
        expiresAt: invite.expiresAt?.toISOString() ?? null,
        url: invite.url,
    };
}

export function serializeAuditLogEntry(entry: GuildAuditLogsEntry): SerializedAuditLogEntry {
    // Handle partial executor
    let executorSerialized = null;
    if (entry.executor && !('partial' in entry.executor && entry.executor.partial)) {
        executorSerialized = serializeUser(entry.executor as any);
    }
    return {
        id: entry.id,
        guildId: entry.targetId ?? '', // Best effort
        actionType: entry.action,
        actionTypeName: AuditLogEvent[entry.action] ?? 'unknown',
        targetId: entry.targetId,
        executorId: entry.executorId,
        executor: executorSerialized,
        reason: entry.reason ?? null,
        changes: entry.changes.map(change => ({
            key: change.key,
            old: change.old,
            new: change.new,
        })),
        extra: entry.extra,
        createdAt: entry.createdAt.toISOString(),
    };
}

export function serializeInteraction(interaction: Interaction): SerializedInteraction {
    const base: SerializedInteraction = {
        id: interaction.id,
        type: interaction.type,
        typeName: interactionTypeNames[interaction.type] ?? 'unknown',
        guildId: interaction.guildId,
        channelId: interaction.channelId,
        user: serializeUser(interaction.user),
        member: interaction.member && 'id' in interaction.member
            ? serializeMember(interaction.member as GuildMember)
            : null,
        token: interaction.token,
        applicationId: interaction.applicationId,
        commandName: null,
        commandId: null,
        commandType: null,
        customId: null,
        componentType: null,
        values: null,
        targetId: null,
        locale: interaction.locale,
        guildLocale: interaction.guildLocale ?? null,
        createdAt: interaction.createdAt.toISOString(),
    };

    if (interaction.isCommand()) {
        base.commandName = interaction.commandName;
        base.commandId = interaction.commandId;
        base.commandType = interaction.commandType;
    }

    if (interaction.isMessageComponent()) {
        base.customId = interaction.customId;
        base.componentType = interaction.componentType;
    }

    if (interaction.isAnySelectMenu()) {
        base.values = interaction.values;
    }

    if (interaction.isContextMenuCommand()) {
        base.targetId = interaction.targetId;
    }

    if (interaction.isModalSubmit()) {
        base.customId = interaction.customId;
    }

    return base;
}

export function serializeEntitlement(entitlement: Entitlement): SerializedEntitlement {
    return {
        id: entitlement.id,
        skuId: entitlement.skuId,
        userId: entitlement.userId,
        guildId: entitlement.guildId,
        applicationId: entitlement.applicationId,
        type: entitlement.type,
        typeName: entitlement.type.toString(),
        consumed: entitlement.consumed,
        startsAt: entitlement.startsAt?.toISOString() ?? null,
        endsAt: entitlement.endsAt?.toISOString() ?? null,
        createdAt: new Date().toISOString(), // Entitlement doesn't have createdAt directly
    };
}

export function serializeWebhook(webhook: Webhook): SerializedWebhook {
    // Handle owner which may be User or APIUser
    let ownerSerialized = null;
    if (webhook.owner && 'id' in webhook.owner && 'username' in webhook.owner) {
        ownerSerialized = serializeUser(webhook.owner as any);
    }
    return {
        id: webhook.id,
        guildId: webhook.guildId,
        channelId: webhook.channelId,
        name: webhook.name,
        type: webhook.type,
        typeName: webhookTypeNames[webhook.type] ?? 'unknown',
        avatar: webhook.avatar,
        avatarUrl: webhook.avatarURL({ size: 256 }),
        token: webhook.token ?? null,
        owner: ownerSerialized,
        sourceGuild: webhook.sourceGuild ? {
            id: webhook.sourceGuild.id,
            name: webhook.sourceGuild.name,
            icon: webhook.sourceGuild.icon ?? null,
        } : null,
        sourceChannel: webhook.isChannelFollower() && webhook.sourceChannel ? {
            id: webhook.sourceChannel.id,
            name: webhook.sourceChannel.name ?? 'Unknown',
        } : null,
        url: webhook.url,
        createdAt: webhook.createdAt.toISOString(),
    };
}
