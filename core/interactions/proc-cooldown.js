require('pathlra-aliaser')();
const imp = require('@loader-core_bootstrap');
const VOICE_INTERACTIONS = ['join_vc'];
function isVoiceInteraction(interactionType) {
   return VOICE_INTERACTIONS.includes(interactionType);
}
async function checkVoiceCooldown(interaction, state, interactionType, guildId) {
   if (!isVoiceInteraction(interactionType)) {
      return true;
   }
   if (interactionType === 'join_vc') {
      if (state.connection && !state.connection.destroyed) {
         const voiceCd = imp.checkCooldown(
            interaction.user.id,
            imp.COOLDOWN_TYPES.VOICE,
            guildId,
         );
         if (!voiceCd.valid) {
            await interaction.deferUpdate().catch(() => {});
            await interaction
               .followUp({
                  content: voiceCd.message,
                  flags: 64,
               })
               .catch(() => {});
            return false;
         }
      }
   }
   return true;
}
module.exports.checkVoiceCooldown = checkVoiceCooldown;
module.exports.isVoiceInteraction = isVoiceInteraction;
module.exports.VOICE_INTERACTIONS = VOICE_INTERACTIONS;
