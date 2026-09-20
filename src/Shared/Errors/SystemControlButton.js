const { getGuildState } = require('@state/GuildStateManager');
const logger = require('@infrastructure/Logging/Logger');
const { checkInteractionAuth } = require('@shared/Errors/SysPerms');
const { joinVoiceChannelHandler } = require('@shared/Errors/SysJoin');
const { leaveVoiceChannelHandler } = require('@shared/Errors/SysLeave');
const { toggleControlMode } = require('@shared/Errors/SysMode');
const { updateControlPanel } = require('@shared/Errors/SysUi');
const { handleSystemError, sendErrorReply } = require('@shared/Errors/SysErrors');

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

                if (joinResult.idleMode) {
                    await sendErrorReply(interaction, 'تم الانضمام - لا يوجد مستخدمين حالياً، البوت في وضع الخمول');
                } else {
                    await sendErrorReply(interaction, 'تم الانضمام وبدء التشغيل بنجاح');
                }
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
