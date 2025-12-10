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
        // Parse modal fields
        const fields: Record<string, string> = {};
        interaction.fields.fields.forEach((field: any) => {
            if (field.value) {
                fields[field.customId] = field.value;
            }
        });
        payload.fields = fields;
    }

    // Emit to WebSocket
    // Event name: 'interaction:create'
    io.emit('interaction:create' as any, payload);

    // Should we automatically defer?
    // Often it's better to let the web client decide, but if no one listens, it will fail.
    // For now, we assume the web client will hit the /callback endpoint to respond.
}
