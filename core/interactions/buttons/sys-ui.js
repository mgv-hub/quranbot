require('pathlra-aliaser');

const { createControlEmbed } = require('@embeds-core_ui');
const {
   createReciterRow,
   createSelectRow,
   createButtonRow,
   createNavigationRow,
   createRadioRow,
} = require('@components-core_ui');
const { updateControlMessage, saveControlId } = require('@interaction-core_utils');

async function updateControlPanel(interaction, state, guildId) {
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
}

module.exports.updateControlPanel = updateControlPanel;
