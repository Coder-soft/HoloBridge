import {
    joinVoiceChannel,
    leaveVoiceChannel as discordLeaveVoiceChannel,
    createAudioPlayer,
    createAudioResource,
    VoiceConnectionStatus,
    AudioPlayerStatus,
    getVoiceConnection,
    type VoiceConnection,
    type AudioPlayer,
} from '@discordjs/voice';
import { discordClient } from '../client.js';
import { ApiError } from '../../api/middleware/errorHandler.js';

// Map guild ID to audio player
const players = new Map<string, AudioPlayer>();

/**
 * Join a voice channel
 */
export async function joinChannel(guildId: string, channelId: string): Promise<void> {
    const guild = discordClient.guilds.cache.get(guildId);
    if (!guild) {
        throw ApiError.notFound('Guild not found');
    }

    const channel = guild.channels.cache.get(channelId);
    if (!channel || !channel.isVoiceBased()) {
        throw ApiError.badRequest('Invalid voice channel');
    }

    joinVoiceChannel({
        channelId: channel.id,
        guildId: guild.id,
        adapterCreator: guild.voiceAdapterCreator,
    });
}

/**
 * Leave a voice channel
 */
export async function leaveChannel(guildId: string): Promise<void> {
    const connection = getVoiceConnection(guildId);
    if (!connection) {
        throw ApiError.badRequest('Not connected to a voice channel in this guild');
    }

    connection.destroy();
    players.delete(guildId);
}

/**
 * Play audio from a URL
 */
export async function playAudio(guildId: string, url: string): Promise<void> {
    const connection = getVoiceConnection(guildId);
    if (!connection) {
        throw ApiError.badRequest('Not connected to a voice channel');
    }

    let player = players.get(guildId);
    if (!player) {
        player = createAudioPlayer();
        players.set(guildId, player);
        connection.subscribe(player);

        player.on('error', (error) => {
            console.error(`Audio player error in guild ${guildId}:`, error);
        });
    }

    // Creating an audio resource from a URL might require FFmpeg depending on the stream
    // For now, we assume standard direct streams or local files
    const resource = createAudioResource(url);
    player.play(resource);
}

/**
 * Get voice connection status
 */
export function getVoiceStatus(guildId: string): { connected: boolean; channelId?: string | null } {
    const connection = getVoiceConnection(guildId);
    return {
        connected: !!connection && connection.state.status !== VoiceConnectionStatus.Destroyed,
        channelId: connection?.joinConfig.channelId,
    };
}
