require('pathlra-aliaser')();
const { getGuildState, isAuthorized } = require('@GuildStateManager-core_state');
const { createRadioResource } = require('@audioUtils-core_utils');
const { createSurahResource } = require('@audioUtils-core_utils');
const { createControlEmbed } = require('@embeds-core_ui');
const { createRadioRow, createButtonRow, createNavigationRow } = require('@components-core_ui');
const { updateControlMessage, saveControlId } = require('@interaction-core_utils');
const logger = require('@logger');
module.exports = {
   customId: 'select_radio',
   async execute(interaction) {
      const guildId = interaction.guildId;
      const state = getGuildState(guildId);

      if (!isAuthorized(interaction, state, interaction.customId)) {
         try {
            if (!interaction.deferred && !interaction.replied) {
               await interaction.deferUpdate();
            }
            return interaction.editReply({
               content:
                  state.controlMode === 'everyone'
                     ? 'هذا الإجراء غير متاح للأعضاء العاديين في وضع الجميع فقط التنقل بين السور واختيار القارئ متاح مع تأخير 90 ثانية الأدمنز لديهم تحكم كامل'
                     : 'تتطلب هذه العملية امتلاك صلاحيات المسؤول (Administrator)',
               flags: 64,
            });
         } catch (error) {
            logger.error('Error Sending Permission Error', error);
            return;
         }
      }
      try {
         if (!interaction.deferred && !interaction.replied) {
            await interaction.deferUpdate();
         }
         if (state.playbackMode !== 'radio') {
            logger.warn('Radio Menu Accessed In Surah Mode Guild ' + guildId + ' Mode ' + state.playbackMode);
            return interaction.editReply({
               content: 'اختيار الراديو غير متاح في وضع السور',
               flags: 64,
            });
         }
         const selectedValue = interaction.values[0];
         const index = parseInt(selectedValue);
         if (index >= 0 && index < global.quranRadios.length) {
            state.currentRadioIndex = index;
            state.currentRadioUrl = global.quranRadios[index].url;
            const safeUrl = require('@radioHealthChecker-core_utils').getActiveRadioUrl(state.currentRadioUrl);

            if (!safeUrl) {
               state.playbackMode = 'surah';
               const surahResource = await createSurahResource(state, state.currentSurah - 1);
               state.player.play(surahResource);
               state.isPaused = false;
               state.pauseReason = null;
            } else {
               try {
                  const resource = await createRadioResource(safeUrl);
                  state.player.stop();
                  state.player.play(resource);
                  state.isPaused = false;
                  state.pauseReason = null;
               } catch (radioError) {
                  logger.warn('Radio Stream Failed Trying Fallback Radio', radioError);
                  const fallbackUrl = require('@radioHealthChecker-core_utils').getActiveRadioUrl(null);
                  if (fallbackUrl && fallbackUrl !== state.currentRadioUrl) {
                     try {
                        const fallbackResource = await createRadioResource(fallbackUrl);
                        state.currentRadioUrl = fallbackUrl;
                        state.player.stop();
                        state.player.play(fallbackResource);
                        state.isPaused = false;
                        state.pauseReason = null;
                     } catch (fallbackError) {
                        logger.warn('Fallback Radio Also Failed Switching To Surah Mode', fallbackError);
                        state.playbackMode = 'surah';
                        const surahResource = await createSurahResource(state, state.currentSurah - 1);
                        state.player.play(surahResource);
                        state.isPaused = false;
                        state.pauseReason = null;
                     }
                  } else {
                     state.playbackMode = 'surah';
                     const surahResource = await createSurahResource(state, state.currentSurah - 1);
                     state.player.play(surahResource);
                     state.isPaused = false;
                     state.pauseReason = null;
                  }
               }
            }
            await global.saveRuntimeStates();
         }
         const embed = createControlEmbed(state, guildId);
         let components = [];
         components.push(createRadioRow(state));
         components.push(createButtonRow(state));
         components.push(...createNavigationRow(state, guildId));

         await updateControlMessage(interaction, embed, components);
         await saveControlId(guildId, interaction.channelId, interaction.message.id);
      } catch (error) {
         logger.error('Error Executing Action In Guild ' + guildId, error);
         try {
            if (!interaction.replied && !interaction.deferred) {
               await interaction.deferUpdate();
            }
            await interaction.editReply({
               content: 'حدث خطأ',
               flags: 64,
            });
         } catch (replyError) {
            logger.error('Error Sending Error Reply', replyError);
         }
      }
   },
};
