require('pathlra-aliaser')();
const { getGuildState, isAuthorized } = require('@GuildStateManager-core_state');
const { createControlEmbed } = require('@controlPanel-core_ui');
const {
   createReciterRow,
   createSelectRow,
   createButtonRow,
   createNavigationRow,
} = require('@components-core_ui');
const { updateControlMessage, saveControlId } = require('@interaction-core_utils');
const logger = require('@logger');
const { EmbedBuilder } = require('discord.js');
async function sendChannelError(interaction, message) {
   await interaction.deferUpdate().catch(() => {});
   const errorEmbed = new EmbedBuilder().setColor(0x1e1f22).setDescription(message);
   await interaction.channel.send({ embeds: [errorEmbed] }).catch(() => {});
}
module.exports = {
   customId: 'navigation',
   async execute(interaction) {
      const guildId = interaction.guildId;
      const state = getGuildState(guildId);
      if (!isAuthorized(interaction, state, interaction.customId)) {
         const permissionMessage =
            state.controlMode === 'everyone'
               ? 'هذا الإجراء غير متاح للأعضاء العاديين في وضع الجميع فقط التنقل بين السور واختيار القارئ متاح مع تأخير 90 ثانية الأدمنز لديهم تحكم كامل'
               : 'تتطلب هذه العملية امتلاك صلاحيات المسؤول (Administrator)';
         await sendChannelError(interaction, permissionMessage);
         return;
      }
      try {
         await interaction.deferUpdate().catch(() => {});
         const totalPages = Math.ceil(global.surahNames.length / 25);
         const totalReciterPages = Math.ceil(Object.keys(global.reciters).length / 25);
         if (interaction.customId === 'prev_page' && state.currentPage === 0) {
            await sendChannelError(interaction, 'لا توجد صفحة سابقة');
            return;
         }
         if (interaction.customId === 'next_page' && state.currentPage >= totalPages - 1) {
            await sendChannelError(interaction, 'لا توجد صفحة تالية');
            return;
         }
         if (interaction.customId === 'prev_reciter_page' && state.currentReciterPage === 0) {
            await sendChannelError(interaction, 'لا توجد صفحة سابقة للقراء');
            return;
         }
         if (
            interaction.customId === 'next_reciter_page' &&
            state.currentReciterPage >= totalReciterPages - 1
         ) {
            await sendChannelError(interaction, 'لا توجد صفحة تالية للقراء');
            return;
         }
         if (interaction.customId === 'prev_page') {
            if (state.currentPage > 0) {
               state.currentPage--;
               global.saveRuntimeStates();
            }
         } else if (interaction.customId === 'next_page') {
            if (state.currentPage < totalPages - 1) {
               state.currentPage++;
               global.saveRuntimeStates();
            }
         } else if (interaction.customId === 'prev_reciter_page') {
            if (state.currentReciterPage > 0) {
               state.currentReciterPage--;
               global.saveRuntimeStates();
            }
         } else if (interaction.customId === 'next_reciter_page') {
            if (state.currentReciterPage < totalReciterPages - 1) {
               state.currentReciterPage++;
               global.saveRuntimeStates();
            }
         }
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
         logger.error('Error Executing Action In Guild ' + guildId, error);
         try {
            await interaction.deferUpdate().catch(() => {});
            await sendChannelError(interaction, 'حدث خطأ');
         } catch (replyError) {
            logger.error('Error Replying To Interaction', replyError);
         }
      }
   },
};
