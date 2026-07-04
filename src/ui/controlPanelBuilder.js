const { createControlEmbed } = require('@ui/embeds');
const { createReciterRow, createSelectRow, createButtonRow, createNavigationRow, createRadioRow } = require('@ui/components');
const { updateControlMessage } = require('@interactions/flow/messageUpdater');
const { saveControlId } = require('@database/trackers/controlIds');
const logger = require('@logging/logger');

// rebuild + send control panel embed
async function rebuildAndSendControlPanel(interaction, guildState, guildId) {
    const embed = createControlEmbed(guildState, guildId);
    const rows = [];

    if (['surah', 'juz'].includes(guildState.playbackMode)) {
        rows.push(createReciterRow(guildState), createSelectRow(guildState));
    } else {
        rows.push(createRadioRow(guildState));
    }

    // always add buttons + nav (max 5 rows total)
    rows.push(createButtonRow(guildState));
    for (const nav of createNavigationRow(guildState, guildId)) {
        if (rows.length >= 5) break;
        if (nav.components?.length <= 5) rows.push(nav);
    }

    try {
        await updateControlMessage(interaction, embed, rows.slice(0, 5));
        await saveControlId(guildId, interaction.channelId, interaction.message.id);
        return true;
    } catch (err) {
        logger.error('Control panel update failed: ' + err.message);
        return false;
    }
}

module.exports.rebuildAndSendControlPanel = rebuildAndSendControlPanel;
