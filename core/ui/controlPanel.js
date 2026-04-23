require('pathlra-aliaser')();
const { createControlEmbed } = require('@embeds-ui');
const {
   createReciterRow,
   createRadioRow,
   createSelectRow,
   createButtonRow,
   createNavigationRow,
} = require('@ui-components');
const logger = require('@logger');
const { updateControlMessage, saveControlId } = require('@utils-interaction');
async function updateControlPanel(interaction, state, guildId) {
   try {
      const embed = createControlEmbed(state, guildId);
      let components = [];
      if (state.playbackMode === 'surah') {
         components.push(createReciterRow(state));
         components.push(createSelectRow(state));
      } else {
         components.push(createRadioRow(state));
      }
      components.push(createButtonRow(state));
      components.push(...createNavigationRow(state, guildId));
      await updateControlMessage(interaction, embed, components);
      await saveControlId(guildId, interaction.channelId, interaction.message.id);
   } catch (error) {
      logger.error('Error updating control panel', error);
   }
}
module.exports.createControlEmbed = createControlEmbed;
module.exports.updateControlPanel = updateControlPanel;
