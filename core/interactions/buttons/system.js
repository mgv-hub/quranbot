require('pathlra-aliaser');
const { getGuildState } = require('@GuildStateManager-core_state');
const logger = require('@logger');
const { checkInteractionAuth } = require('@sys-perms-core_interactions_buttons');
const { joinVoiceChannelHandler } = require('@sys-join-core_interactions_buttons');
const { leaveVoiceChannelHandler } = require('@sys-leave-core_interactions_buttons');
const { toggleControlMode } = require('@sys-mode-core_interactions_buttons');
const { updateControlPanel } = require('@sys-ui-core_interactions_buttons');
const { handleSystemError, sendErrorReply } = require('@sys-errors-core_interactions_buttons');

module.exports = {
   customId: 'system',
   async execute(interaction) {
      const guildId = interaction.guildId;
      const state = getGuildState(guildId);
      const authResult = checkInteractionAuth(interaction, state, interaction.customId);
      if (!authResult.authorized) {
         await interaction.deferUpdate().catch(() => {});
         await sendErrorReply(interaction, authResult.message);
         return;
      }
      try {
         await interaction.deferUpdate().catch(() => {});
         if (interaction.customId === 'toggle_control_mode') {
            await toggleControlMode(guildId, state);
         } else if (interaction.customId === 'join_vc') {
            const result = await joinVoiceChannelHandler(interaction, guildId, state);
            if (!result.success) {
               await sendErrorReply(interaction, result.error);
               return;
            }
            await sendErrorReply(interaction, 'تم الانضمام وبدء التشغيل بنجاح');
         } else if (interaction.customId === 'leave_vc') {
            const result = await leaveVoiceChannelHandler(guildId, state);
            if (!result.success) {
               await sendErrorReply(interaction, result.error);
               return;
            }
            await sendErrorReply(interaction, 'تم الخروج من الغرفة الصوتية بنجاح');
         }
         await updateControlPanel(interaction, state, guildId);
      } catch (error) {
         await handleSystemError(interaction, guildId, error);
      }
   },
};
