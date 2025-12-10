import {
    Events,
    type Interaction,
    type ButtonInteraction,
    type AnySelectMenuInteraction,
    type ModalSubmitInteraction,
} from 'discord.js';
import type { Server as SocketIOServer } from 'socket.io';

/**
 * Handle interactionCreate events.
 * Forwards interaction data to the WebSocket clients.
 */
export async function handleInteractionCreate(
    interaction: Interaction,
    io: SocketIOServer
): Promise<void> {
    // Only handle repliable interactions that we want to forward
    if (
        !interaction.isButton() &&
        !interaction.isAnySelectMenu() &&
        !interaction.isModalSubmit()
    ) {
        return;
    }

    const payload: any = {
        id: interaction.id,
        applicationId: interaction.applicationId,
        type: interaction.type,
        token: interaction.token, // CAUTION: Short-lived token
        guildId: interaction.guildId,
        channelId: interaction.channelId,
        user: {
            id: interaction.user.id,
            username: interaction.user.username,
            discriminator: interaction.user.discriminator,
            avatar: interaction.user.avatar,
        },
        customId: interaction.customId,
        createdAt: interaction.createdAt.toISOString(),
    };

    // Add specific data based on interaction type
    if (interaction.isButton()) {
        payload.componentType = interaction.componentType;
    } else if (interaction.isAnySelectMenu()) {
        payload.componentType = interaction.componentType;
        payload.values = interaction.values;
    } else if (interaction.isModalSubmit()) {
        // Parse modal fields using official helper
        const fields: Record<string, string> = {};

        // Iterate rows to find custom IDs, then fetch values safely
        interaction.fields.fields.forEach((actionRow) => {
            actionRow.components.forEach((component) => {
                try {
                    const value = interaction.fields.getTextInputValue(component.customId);
                    fields[component.customId] = value;
                } catch (error) {
                    // Skip fields that cannot be retrieved
                    // The original document does not define 'config', so this line is commented out
                    // to ensure syntactical correctness and avoid ReferenceError.
                    // if (config.debug) {
                    console.warn(`Could not retrieve value for modal field ${component.customId}`, error);
                    // }
                }
            });
        });

        payload.fields = fields;
    }

    // Emit to WebSocket
    // Event name: 'interaction:create'
    // Emit to WebSocket for the specific guild
    // Event name: 'interaction:create'
    if (interaction.guildId) {
        io.to(`guild:${interaction.guildId}`).emit('interaction:create' as any, payload);
    } else {
        // Fallback for DM interactions (if any, though intents might filter them)
        // For DMs, we might emit to a user-specific room if we had one, but strict guild isolation suggests filtering.
        // We'll skip or broadcast to a global admin room if needed. For now, we only support guild interactions.
    }

    // Should we automatically defer?
    // Often it's better to let the web client decide, but if no one listens, it will fail.
    // For now, we assume the web client will hit the /callback endpoint to respond.
}
