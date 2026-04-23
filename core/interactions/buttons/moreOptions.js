require('pathlra-aliaser');
const { getGuildState, isAuthorized } = require('@GuildStateManager-core_state');
const { createControlEmbed } = require('@controlPanel-core_ui');
const {
   createReciterRow,
   createSelectRow,
   createButtonRow,
   createNavigationRow,
   createMoreOptionsRow,
   createEntryRow,
   createRadioRow,
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
   customId: 'more_options',
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
         const embed = createControlEmbed(state, guildId);
         let components = [];
         if (state.playbackMode === 'surah' || state.playbackMode === 'juz') {
            components.push(createReciterRow(state));
            components.push(createSelectRow(state));
         } else {
            components.push(createRadioRow(state));
         }
         components.push(createButtonRow(state));
         components.push(...createNavigationRow(state, guildId));
         components.push(createMoreOptionsRow(state));
         await updateControlMessage(interaction, embed, components);
         await saveControlId(guildId, interaction.channelId, interaction.message.id);
      } catch (error) {
         logger.error('Error Executing More Options In Guild ' + guildId, error);
         try {
            await interaction.deferUpdate().catch(() => {});
            await sendChannelError(interaction, 'حدث خطأ');
         } catch (replyError) {
            logger.error('Error Replying To Interaction', replyError);
         }
      }
   },
};
