const { createControlEmbed } = require('@ui/embeds');
const { createReciterRow, createSelectRow, createButtonRow, createNavigationRow, createRadioRow } = require('@ui/components');
const { updateControlMessage, saveControlId } = require('@interactions/flow/messageUpdater');

// Rebuild and update the control panel UI after state changes
async function updateControlPanel(interaction, guildState, guildId) {
    const refreshedEmbed = createControlEmbed(guildState, guildId);
    const uiComponents = [];

    if (guildState.playbackMode === 'surah') {
        uiComponents.push(createReciterRow(guildState));
        uiComponents.push(createSelectRow(guildState));
    } else {
        uiComponents.push(createRadioRow(guildState));
    }

    uiComponents.push(createButtonRow(guildState));
    uiComponents.push(...createNavigationRow(guildState, guildId));

    await updateControlMessage(interaction, refreshedEmbed, uiComponents);
    await saveControlId(guildId, interaction.channelId, interaction.message.id);
}

module.exports.updateControlPanel = updateControlPanel;
