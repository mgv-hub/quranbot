const { createControlEmbed } = require('@infrastructure/Discord/UI/Embeds');
const {
    createReciterRow,
    createRadioRow,
    createSelectRow,
    createButtonRow,
    createNavigationRow,
} = require('@infrastructure/Discord/UI/Components');
const logger = require('@infrastructure/Logging/Logger');
const { updateControlMessage, saveControlId } = require('@infrastructure/Discord/Flow/MessageUpdater');

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
