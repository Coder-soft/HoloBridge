import { z } from 'zod';

// ============================================================================
// Request Schemas
// ============================================================================

export const SendMessageSchema = z.object({
    content: z.string().max(2000).optional(),
    embeds: z.array(z.object({
        title: z.string().max(256).optional(),
        description: z.string().max(4096).optional(),
        url: z.string().url().optional(),
        color: z.number().int().min(0).max(16777215).optional(),
        timestamp: z.string().datetime().optional(),
        footer: z.object({
            text: z.string().max(2048),
            icon_url: z.string().url().optional(),
        }).optional(),
        image: z.object({ url: z.string().url() }).optional(),
        thumbnail: z.object({ url: z.string().url() }).optional(),
        author: z.object({
            name: z.string().max(256),
            url: z.string().url().optional(),
            icon_url: z.string().url().optional(),
        }).optional(),
        fields: z.array(z.object({
            name: z.string().max(256),
            value: z.string().max(1024),
            inline: z.boolean().optional(),
        })).max(25).optional(),
    })).max(10).optional(),
    replyTo: z.string().optional(),
    tts: z.boolean().optional(),
}).refine((data) => data.content || (data.embeds && data.embeds.length > 0), {
    message: 'Either content or at least one embed is required',
});

export const EditMessageSchema = z.object({
    content: z.string().max(2000).optional().nullable(),
    embeds: z.array(z.object({
        title: z.string().max(256).optional(),
        description: z.string().max(4096).optional(),
        url: z.string().url().optional(),
        color: z.number().int().optional(),
    })).max(10).optional(),
});

export const CreateChannelSchema = z.object({
    name: z.string().min(1).max(100),
    type: z.enum(['text', 'voice', 'category', 'announcement', 'stage', 'forum']),
    topic: z.string().max(1024).optional(),
    parentId: z.string().optional(),
    position: z.number().int().optional(),
    nsfw: z.boolean().optional(),
    rateLimitPerUser: z.number().int().min(0).max(21600).optional(),
    bitrate: z.number().int().min(8000).optional(),
    userLimit: z.number().int().min(0).max(99).optional(),
    permissionOverwrites: z.array(z.object({
        id: z.string(),
        type: z.enum(['role', 'member']),
        allow: z.string().optional(),
        deny: z.string().optional(),
    })).optional(),
});

export const EditChannelSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    topic: z.string().max(1024).optional().nullable(),
    position: z.number().int().optional(),
    nsfw: z.boolean().optional(),
    rateLimitPerUser: z.number().int().min(0).max(21600).optional(),
    parentId: z.string().optional().nullable(),
    bitrate: z.number().int().min(8000).optional(),
    userLimit: z.number().int().min(0).max(99).optional(),
});

export const CreateRoleSchema = z.object({
    name: z.string().max(100).optional(),
    color: z.number().int().min(0).max(16777215).optional(),
    hoist: z.boolean().optional(),
    mentionable: z.boolean().optional(),
    permissions: z.string().optional(),
    icon: z.string().optional(),
    unicodeEmoji: z.string().optional(),
});

export const EditRoleSchema = CreateRoleSchema.extend({
    position: z.number().int().optional(),
});

export const BanMemberSchema = z.object({
    reason: z.string().max(512).optional(),
    deleteMessageSeconds: z.number().int().min(0).max(604800).optional(),
});

export const ModifyRolesSchema = z.object({
    add: z.array(z.string()).optional(),
    remove: z.array(z.string()).optional(),
});

export const SetNicknameSchema = z.object({
    nickname: z.string().max(32).optional().nullable(),
});

export const CreateThreadSchema = z.object({
    name: z.string().min(1).max(100),
    autoArchiveDuration: z.enum(['60', '1440', '4320', '10080']).optional(),
    type: z.enum(['public', 'private']).optional(),
    invitable: z.boolean().optional(),
    rateLimitPerUser: z.number().int().min(0).max(21600).optional(),
});

export const GetMessagesSchema = z.object({
    limit: z.coerce.number().int().min(1).max(100).optional().default(50),
    before: z.string().optional(),
    after: z.string().optional(),
    around: z.string().optional(),
});

// ============================================================================
// Response Types
// ============================================================================

export interface ApiSuccessResponse<T> {
    success: true;
    data: T;
}

export interface ApiErrorResponse {
    success: false;
    error: string;
    code?: string;
    details?: unknown;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// ============================================================================
// Type Exports
// ============================================================================

export type SendMessageInput = z.infer<typeof SendMessageSchema>;
export type EditMessageInput = z.infer<typeof EditMessageSchema>;
export type CreateChannelInput = z.infer<typeof CreateChannelSchema>;
export type EditChannelInput = z.infer<typeof EditChannelSchema>;
export type CreateRoleInput = z.infer<typeof CreateRoleSchema>;
export type EditRoleInput = z.infer<typeof EditRoleSchema>;
export type BanMemberInput = z.infer<typeof BanMemberSchema>;
export type ModifyRolesInput = z.infer<typeof ModifyRolesSchema>;
export type SetNicknameInput = z.infer<typeof SetNicknameSchema>;
export type CreateThreadInput = z.infer<typeof CreateThreadSchema>;
export type GetMessagesInput = z.infer<typeof GetMessagesSchema>;
