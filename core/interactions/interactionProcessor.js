require('pathlra-aliaser')();

const imp = require('@loader-core_bootstrap');
const { handleInteractionError } = require('@interactionErrors-core_interactions');
const { checkGlobalCooldown } = require('@interactionCooldown-core_interactions');
const {
   checkDuplicateInteraction,
   addToInteractionCache,
} = require('@proc-cache-core_interactions');
const { handleCommandInteraction } = require('@proc-commands-core_interactions');
const { isModalSubmit, handleModalInteraction } = require('@proc-modals-core_interactions');
const { isPublicFeature, handlePublicInteraction } = require('@proc-public-core_interactions');
const { checkVoiceState } = require('@proc-voice-core_interactions');
const { checkAuthorization } = require('@proc-auth-core_interactions');
const { checkVoiceCooldown } = require('@proc-cooldown-core_interactions');
const { handleButtonInteraction } = require('@proc-buttons-core_interactions');
const { handleMenuInteraction } = require('@proc-menus-core_interactions');

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

      if (
         !interaction.isCommand() &&
         !interaction.isButton() &&
         !interaction.isStringSelectMenu() &&
         !interaction.isModalSubmit()
      ) {
         return;
      }

      const guildId = interaction.guildId;
      const state = imp.getGuildState(guildId);

      if (interaction.isCommand()) {
         await handleCommandInteraction(interaction, state);
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

      const interactionType = interaction.isButton()
         ? interaction.customId
         : interaction.customId;

      const voiceValid = await checkVoiceState(interaction, state, interactionType);
      if (!voiceValid) {
         return;
      }

      const authValid = await checkAuthorization(interaction, state, interactionType);
      if (!authValid) {
         return;
      }

      const cooldownValid = await checkVoiceCooldown(
         interaction,
         state,
         interactionType,
         guildId,
      );
      if (!cooldownValid) {
         return;
      }

      if (interaction.isButton()) {
         await handleButtonInteraction(interaction);
      } else if (interaction.isStringSelectMenu()) {
         await handleMenuInteraction(interaction);
      }
   } catch (error) {
      await handleInteractionError(interaction, error, 'interactionHandler');
   }
}

module.exports.handleInteraction = handleInteraction;
