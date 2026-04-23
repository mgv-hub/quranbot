require('pathlra-aliaser')();
const { getGuildState, isAuthorized } = require('@GuildStateManager-core_state');
const { createSurahResource, getCurrentLinks, findAvailableSurahForReciter } = require('@audioUtils-core_utils');
const { createControlEmbed } = require('@embeds-core_ui');
const { createReciterRow, createSelectRow, createButtonRow, createNavigationRow } = require('@components-core_ui');
const { updateControlMessage, saveControlId } = require('@interaction-core_utils');
const logger = require('@logger'); // 7
const { MessageFlags } = require('discord.js');
const persistentStateManager = require('@PersistentStateManager-core_state');
function getAvailableSurahCount(reciterKey) {
   const reciterData = global.reciters[reciterKey];
   if (!reciterData || !reciterData.links) return 114;
   const validLinks = reciterData.links.filter((link) => link && link.trim() !== '' && link.startsWith('http'));
   return validLinks.length > 0 ? validLinks.length : 114;
}
function reciterHasValidLinks(reciterKey) {
   const reciterData = global.reciters[reciterKey];
   if (!reciterData || !reciterData.links) return false;
   const validLinks = reciterData.links.filter((link) => link && link.trim() !== '' && link.startsWith('http'));
   return validLinks.length > 0;
}
module.exports = {
   customId: 'select_reciter',
   async execute(interaction) {
      const guildId = interaction.guildId;
      const state = getGuildState(guildId);
      if (!isAuthorized(interaction, state, interaction.customId)) {
         try {
            await interaction.deferUpdate();
            return interaction.editReply({
               content:
                  state.controlMode === 'everyone'
                     ? 'هذا الإجراء غير متاح للأعضاء العاديين في وضع الجميع فقط التنقل بين السور واختيار القارئ متاح مع تأخير 90 ثانية الأدمنز لديهم تحكم كامل'
                     : 'تتطلب هذه العملية امتلاك صلاحيات المسؤول (Administrator)',
               flags: 64,
            });
         } catch (error) {
            logger.error('Error Handling Permission Check', error);
            return;
         }
      }
      try {
         await interaction.deferUpdate();
         if (state.playbackMode !== 'surah') {
            state.playbackMode = 'surah';
            state.currentRadioIndex = 0;
            state.currentRadioUrl = null;
         }
         const selectedReciter = interaction.values[0];
         let finalReciter = selectedReciter;
         if (!reciterHasValidLinks(selectedReciter)) {
            return interaction.editReply({
               content:
                  '**القارئ المحدد غير متاح**\n' + 'هذا القارئ لا يملك أي روابط صالحة\n' + '**الحل** اختر قارئ آخر',
               flags: 64,
            });
         }
         if (finalReciter !== state.currentReciter) {
            state.currentReciter = finalReciter;
            const availableSurahCount = getAvailableSurahCount(finalReciter);
            if (state.currentSurah > availableSurahCount) {
               const availableIndex = findAvailableSurahForReciter(state, -1);
               if (availableIndex !== -1) {
                  state.currentSurah = availableIndex + 1;
               } else {
                  state.currentSurah = 1;
               }
            }
            if (state.connection && !state.connection.destroyed && state.channelId) {
               if (state.player.state.status === 'playing') {
                  state.player.stop();
               }
               try {
                  const resource = await createSurahResource(state, state.currentSurah - 1, 0, 0, false);
                  state.player.play(resource);
                  state.isPaused = false;
                  state.pauseReason = null;
                  const reciterData = global.reciters[finalReciter];
                  const reciterName = reciterData?.name || finalReciter;
                  logger.info(
                     'Reciter Changed To ' +
                        reciterName +
                        ' Has ' +
                        availableSurahCount +
                        ' Surahs In Guild ' +
                        guildId +
                        ' Playing Surah ' +
                        state.currentSurah,
                  );
                  persistentStateManager.updateGuildState(guildId, {
                     currentReciter: state.currentReciter,
                     currentSurahIndex: state.currentSurah - 1,
                     isPaused: false,
                     pauseReason: null,
                  });
                  await updateControlMessage(interaction, createControlEmbed(state, guildId), [
                     createReciterRow(state),
                     createSelectRow(state),
                     createButtonRow(state),
                     ...createNavigationRow(state, guildId),
                  ]);
                  await saveControlId(guildId, interaction.channelId, interaction.message.id);
                  return;
               } catch (error) {
                  logger.error('Error Playing Surah With New Reciter In Guild ' + guildId, error);
                  const reciterData = global.reciters[finalReciter];
                  const reciterName = reciterData?.name || finalReciter;
                  return interaction.editReply({
                     content:
                        'حدث خطأ أثناء تشغيل السورة مع القارئ ' +
                        reciterName +
                        '\n' +
                        error.message +
                        '\n' +
                        'تم العودة للقارئ السابق',
                     flags: 64,
                  });
               }
            }
         }
         const embed = createControlEmbed(state, guildId);
         let components = [];
         components.push(createReciterRow(state));
         components.push(createSelectRow(state));
         components.push(createButtonRow(state));
         components.push(...createNavigationRow(state, guildId));
         await updateControlMessage(interaction, embed, components);
         await saveControlId(guildId, interaction.channelId, interaction.message.id);
      } catch (error) {
         logger.error('Error Executing Action In Guild ' + guildId, error);
         try {
            await interaction.deferUpdate();
            return interaction.editReply({
               content: 'حدث خطأ',
               flags: 64,
            });
         } catch (replyError) {
            logger.error('Error Replying To Interaction', replyError);
         }
      }
   },
};
