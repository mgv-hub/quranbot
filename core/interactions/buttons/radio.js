require('pathlra-aliaser')();
const { getGuildState, isAuthorized } = require('@GuildStateManager-core_state');
const { createRadioResource } = require('@audioUtils-core_utils');
const { createSurahResource } = require('@audioUtils-core_utils');
const { createControlEmbed } = require('@embeds-core_ui');
const {
   createReciterRow,
   createSelectRow,
   createButtonRow,
   createNavigationRow,
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
   customId: 'radio',
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
         if (interaction.customId === 'toggle_radio') {
            if (state.player.state.status === 'playing') {
               state.player.stop();
            }
            if (state.playbackMode === 'surah') {
               state.playbackMode = 'radio';
               state.currentRadioIndex = state.currentRadioIndex ?? 0;
               state.currentRadioUrl = global.quranRadios[state.currentRadioIndex]?.url ?? global.quranRadios[0]?.url;
               state.currentRadioPage = Math.floor(state.currentRadioIndex / 25);
               if (state.currentRadioUrl) {
                  const safeUrl = require('@radioHealthChecker-core_utils').getActiveRadioUrl(state.currentRadioUrl);
                  if (!safeUrl) {
                     state.playbackMode = 'surah';
                     const surahResource = await createSurahResource(state, state.currentSurah - 1);
                     state.player.play(surahResource);
                     state.isPaused = false;
                     state.pauseReason = null;
                  } else {
                     const resource = await createRadioResource(safeUrl);
                     state.player.play(resource);
                     state.isPaused = false;
                     state.pauseReason = null;
                  }
               }
            } else {
               state.playbackMode = 'surah';
               state.currentRadioUrl = null;
               state.currentRadioIndex = 0;
               state.currentRadioPage = 0;
               try {
                  const resource = await createSurahResource(state, state.currentSurah - 1);
                  state.player.play(resource);
                  state.isPaused = false;
                  state.pauseReason = null;
               } catch (error) {
                  logger.error('Error Playing Surah On Toggle', error);
               }
            }
            await global.saveRuntimeStates();
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
            return;
         } else if (interaction.customId === 'prev_radio_page') {
            if (state.playbackMode !== 'radio') {
               await sendChannelError(interaction, 'تصفح صفحات الراديو غير متاح في وضع السور');
               return;
            }
            const totalRadioPages = Math.ceil(global.quranRadios.length / 25);
            const currentPage = state.currentRadioPage || 0;
            if (currentPage > 0) {
               state.currentRadioPage = currentPage - 1;
               state.currentRadioIndex = state.currentRadioPage * 25;
               await global.saveRuntimeStates();
            }
         } else if (interaction.customId === 'next_radio_page') {
            if (state.playbackMode !== 'radio') {
               await sendChannelError(interaction, 'تصفح صفحات الراديو غير متاح في وضع السور');
               return;
            }
            const totalRadioPages = Math.ceil(global.quranRadios.length / 25);
            const currentPage = state.currentRadioPage || 0;
            if (currentPage < totalRadioPages - 1) {
               state.currentRadioPage = currentPage + 1;
               state.currentRadioIndex = state.currentRadioPage * 25;
               await global.saveRuntimeStates();
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
            if (!interaction.replied && !interaction.deferred) {
               await interaction.deferUpdate().catch(() => {});
            }
            await sendChannelError(interaction, 'حدث خطأ');
         } catch (replyError) {
            logger.error('Error Sending Error Reply', replyError);
         }
      }
   },
};
