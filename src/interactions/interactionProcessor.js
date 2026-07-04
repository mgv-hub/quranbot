const coreLoader = require('@bot/bootstrap');
const { handleInteractionError } = require('@interactions/interactionErrors');
const { checkGlobalCooldown } = require('@interactions/interactionCooldown');
const { checkDuplicateInteraction, addToInteractionCache } = require('@interactions/proc-cache');
const { handleCommandInteraction } = require('@interactions/proc-commands');
const { isModalSubmit, handleModalInteraction } = require('@interactions/proc-modals');
const { isPublicFeature, handlePublicInteraction } = require('@interactions/proc-public');
const { checkVoiceState } = require('@interactions/proc-voice');
const { checkAuthorization } = require('@interactions/proc-auth');
const { checkVoiceCooldown } = require('@interactions/proc-cooldown');
const { handleButtonInteraction } = require('@interactions/proc-buttons');
const { handleMenuInteraction } = require('@interactions/proc-menus');

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
