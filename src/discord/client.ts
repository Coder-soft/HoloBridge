import {
    Client,
    GatewayIntentBits,
    Partials,
} from 'discord.js';
import { config } from '../config/index.js';

// Create Discord client with ALL privileged intents for full API access
export const discordClient = new Client({
    intents: [
        // Guild intents
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildEmojisAndStickers,
        GatewayIntentBits.GuildIntegrations,
        GatewayIntentBits.GuildWebhooks,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildPresences,
        // Message intents
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMessageTyping,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessageReactions,
        GatewayIntentBits.DirectMessageTyping,
        // Content intent (privileged)
        GatewayIntentBits.MessageContent,
        // Scheduled events
        GatewayIntentBits.GuildScheduledEvents,
        // Auto moderation
        GatewayIntentBits.AutoModerationConfiguration,
        GatewayIntentBits.AutoModerationExecution,
        // Poll events
        GatewayIntentBits.GuildMessagePolls,
        GatewayIntentBits.DirectMessagePolls,
    ],
    partials: [
        Partials.Message,
        Partials.Channel,
        Partials.Reaction,
        Partials.User,
        Partials.GuildMember,
        Partials.ThreadMember,
    ],
});

// Ready state tracking
let isReady = false;

discordClient.once('ready', (client) => {
    isReady = true;
    console.log(`✅ Discord client ready as ${client.user.tag}`);
    console.log(`   Serving ${client.guilds.cache.size} guild(s)`);
});

discordClient.on('error', (error) => {
    console.error('❌ Discord client error:', error);
});

discordClient.on('warn', (warning) => {
    if (config.debug) {
        console.warn('⚠️ Discord warning:', warning);
    }
});

// Login function
export async function loginDiscord(): Promise<void> {
    try {
        await discordClient.login(config.discord.token);
    } catch (error) {
        console.error('❌ Failed to login to Discord:', error);
        throw error;
    }
}

// Check if client is ready
export function isDiscordReady(): boolean {
    return isReady && discordClient.isReady();
}

// Wait for client to be ready
export function waitForReady(): Promise<void> {
    return new Promise((resolve) => {
        if (isReady) {
            resolve();
        } else {
            discordClient.once('ready', () => resolve());
        }
    });
}
