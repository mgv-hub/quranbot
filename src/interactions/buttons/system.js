const { getGuildState } = require('../../state/GuildStateManager');
const logger = require('@logging/logger');
const { checkInteractionAuth } = require('@interactions/buttons/sys-perms');
const { joinVoiceChannelHandler } = require('@interactions/buttons/sys-join');
const { leaveVoiceChannelHandler } = require('@interactions/buttons/sys-leave');
const { toggleControlMode } = require('@interactions/buttons/sys-mode');
const { updateControlPanel } = require('@interactions/buttons/sys-ui');
const { handleSystemError, sendErrorReply } = require('@interactions/buttons/sys-errors');

module.exports = {
    customId: 'system',

    async execute(interaction) {
        const guildId = interaction.guildId;
        const guildState = getGuildState(guildId);

        const authCheck = checkInteractionAuth(interaction, guildState, interaction.customId);
        if (!authCheck.authorized) {
            await interaction.deferUpdate().catch(() => {});
            await sendErrorReply(interaction, authCheck.message);
            return;
        }

        try {
            await interaction.deferUpdate().catch(() => {});

            if (interaction.customId === 'toggle_control_mode') {
                await toggleControlMode(guildId, guildState);
            } else if (interaction.customId === 'join_vc') {
                const joinResult = await joinVoiceChannelHandler(interaction, guildId, guildState);
                if (!joinResult.success) {
                    await sendErrorReply(interaction, joinResult.error);
                    return;
                }
                await sendErrorReply(interaction, 'تم الانضمام وبدء التشغيل بنجاح');
            } else if (interaction.customId === 'leave_vc') {
                const leaveResult = await leaveVoiceChannelHandler(guildId, guildState);
                if (!leaveResult.success) {
                    await sendErrorReply(interaction, leaveResult.error);
                    return;
                }
                await sendErrorReply(interaction, 'تم الخروج من الغرفة الصوتية بنجاح');
            }

            await updateControlPanel(interaction, guildState, guildId);
        } catch (error) {
            await handleSystemError(interaction, guildId, error);
        }
    },
};
