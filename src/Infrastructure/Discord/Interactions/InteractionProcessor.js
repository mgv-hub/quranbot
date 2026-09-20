const coreLoader = require('@core/GlobalBindings');
const { handleInteractionError } = require('@infrastructure/Discord/Interactions/InteractionErrors');
const { checkGlobalCooldown } = require('@infrastructure/Discord/Interactions/InteractionCooldown');
const { checkDuplicateInteraction, addToInteractionCache } = require('@infrastructure/Discord/Interactions/Processors/CacheProcessor');
const { handleCommandInteraction } = require('@infrastructure/Discord/Interactions/Processors/CommandProcessor');
const { isModalSubmit, handleModalInteraction } = require('@infrastructure/Discord/Interactions/Processors/ModalProcessor');
const { isPublicFeature, handlePublicInteraction } = require('@infrastructure/Discord/Interactions/Processors/PublicProcessor');
const { checkVoiceState } = require('@infrastructure/Discord/Interactions/Processors/VoiceProcessor');
const { checkAuthorization } = require('@infrastructure/Discord/Interactions/Processors/AuthProcessor');
const { checkVoiceCooldown } = require('@infrastructure/Discord/Interactions/Processors/CooldownProcessor');
const { handleButtonInteraction } = require('@infrastructure/Discord/Interactions/Processors/ButtonProcessor');
const { handleMenuInteraction } = require('@infrastructure/Discord/Interactions/Processors/MenuProcessor');

// Central routing function for all validated interactions
async function handleInteraction(interaction) {
    if (checkDuplicateInteraction(interaction)) {
        return;
    }
    addToInteractionCache(interaction);

    try {
        const isBlocked = await checkGlobalCooldown(interaction);
        if (isBlocked) {
            return;
        }
        const isAnySelectMenu =
            interaction.isStringSelectMenu() ||
            interaction.isChannelSelectMenu() ||
            interaction.isRoleSelectMenu() ||
            interaction.isUserSelectMenu() ||
            interaction.isMentionableSelectMenu();
        if (!interaction.isCommand() && !interaction.isButton() && !isAnySelectMenu && !interaction.isModalSubmit()) {
            return;
        }

        const guildId = interaction.guildId;
        const guildState = coreLoader.getGuildState(guildId);

        if (interaction.isCommand()) {
            await handleCommandInteraction(interaction, guildState);
            return;
        }

        if (isModalSubmit(interaction)) {
            const handled = await handleModalInteraction(interaction);
            if (handled) return;
        }

        if (isPublicFeature(interaction)) {
            await handlePublicInteraction(interaction);
            return;
        }

        const interactionType = interaction.isButton() ? interaction.customId : interaction.customId;

        const voiceValid = await checkVoiceState(interaction, guildState, interactionType);
        if (!voiceValid) {
            return;
        }

        const authValid = await checkAuthorization(interaction, guildState, interactionType);
        if (!authValid) {
            return;
        }

        const cooldownValid = await checkVoiceCooldown(interaction, guildState, interactionType, guildId);
        if (!cooldownValid) {
            return;
        }

        if (interaction.isButton()) {
            await handleButtonInteraction(interaction);
        } else if (isAnySelectMenu) {
            await handleMenuInteraction(interaction);
        }
    } catch (error) {
        await handleInteractionError(interaction, error, 'interactionHandler');
    }
}

module.exports.handleInteraction = handleInteraction;
