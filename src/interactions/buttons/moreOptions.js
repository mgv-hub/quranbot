const { getGuildState, isAuthorized } = require('../../state/GuildStateManager');
const { createControlEmbed } = require('@ui/controlpanel');
const {
    createReciterRow,
    createSelectRow,
    createButtonRow,
    createNavigationRow,
    createMoreOptionsRow,
    createEntryRow,
    createRadioRow,
} = require('@ui/components');
const { updateControlMessage, saveControlId } = require('@interactions/flow/messageUpdater');
const logger = require('@logging/logger');
const { EmbedBuilder } = require('discord.js');

async function sendChannelError(interaction, errorMessage) {
    await interaction.deferUpdate().catch(() => {});

    const errorEmbed = new EmbedBuilder().setColor(0xfefdfe).setDescription(errorMessage);

    await interaction.channel.send({ embeds: [errorEmbed] }).catch(() => {});
}

module.exports = {
    customId: 'more_options',

    async execute(interaction) {
        const guildId = interaction.guildId;
        const guildState = getGuildState(guildId);

        if (!isAuthorized(interaction, guildState, interaction.customId)) {
            const permissionDeniedMsg =
                guildState.controlMode === 'everyone'
                    ? 'هذا الإجراء غير متاح للأعضاء العاديين في وضع الجميع فقط التنقل بين السور واختيار القارئ متاح مع تأخير 90 ثانية الأدمنز لديهم تحكم كامل'
                    : 'تتطلب هذه العملية امتلاك صلاحيات المسؤول (Administrator)';

            await sendChannelError(interaction, permissionDeniedMsg);
            return;
        }

        try {
            await interaction.deferUpdate().catch(() => {});
            const controlEmbed = createControlEmbed(guildState, guildId);
            const uiRows = [];

            if (guildState.playbackMode === 'surah' || guildState.playbackMode === 'juz') {
                uiRows.push(createReciterRow(guildState));
                uiRows.push(createSelectRow(guildState));
            } else {
                uiRows.push(createRadioRow(guildState));
            }
            uiRows.push(createButtonRow(guildState));
            uiRows.push(...createNavigationRow(guildState, guildId));
            uiRows.push(createMoreOptionsRow(guildState));
            await updateControlMessage(interaction, controlEmbed, uiRows);
            await saveControlId(guildId, interaction.channelId, interaction.message.id);
        } catch (error) {
            logger.error('Error Executing More Options In Guild ' + guildId, error);

            try {
                await interaction.deferUpdate().catch(() => {});
                await sendChannelError(interaction, 'حدث خطأ');
            } catch (replyErr) {
                logger.error('Error Replying To Interaction', replyErr);
            }
        }
    },
};
