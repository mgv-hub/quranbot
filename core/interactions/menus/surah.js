require('pathlra-aliaser')();
const { getGuildState, isAuthorized } = require('@GuildStateManager-core_state');
const { createSurahResource, isSurahAvailable, getAvailableSurahCount } = require('@audioUtils-core_utils');
const { createControlEmbed } = require('@controlPanel-core_ui');
const { createReciterRow, createSelectRow, createButtonRow, createNavigationRow } = require('@components-core_ui');
const { updateControlMessage, saveControlId } = require('@interaction-core_utils');
const logger = require('@logger');
const persistentStateManager = require('@PersistentStateManager-core_state');

module.exports = {
   customId: 'select_surah',
   async execute(interaction) {
      const guildId = interaction.guildId;
      const state = getGuildState(guildId);
      if (!isAuthorized(interaction, state, interaction.customId)) {
         await interaction.deferUpdate();
         return interaction.editReply({
            content:
               state.controlMode === 'everyone'
                  ? 'هذا الإجراء غير متاح للأعضاء العاديين في وضع الجميع فقط التنقل بين السور واختيار القارئ متاح مع تأخير 90 ثانية الأدمنز لديهم تحكم كامل'
                  : 'تتطلب هذه العملية امتلاك صلاحيات المسؤول (Administrator)',
            flags: 64,
         });
      }
      try {
         await interaction.deferUpdate();
         if (state.playbackMode !== 'surah') {
            return interaction.editReply({
               content: 'اختيار السورة غير متاح في وضع الراديو',
               flags: 64,
            });
         }
         if (!global.surahNames) {
            logger.error('SurahNames Not Loaded Yet');
            return interaction.editReply({
               content: 'البيانات غير محملة بعد انتظر قليلا',
               flags: 64,
            });
         }
         const selectedValue = parseInt(interaction.values[0]);
         if (selectedValue >= 1 && selectedValue <= global.surahNames.length) {
            const surahIndex = selectedValue - 1;
            if (!isSurahAvailable(state, surahIndex)) {
               const availableCount = getAvailableSurahCount(state);
               const reciterData = global.reciters[state.currentReciter];
               const reciterName = reciterData?.name || state.currentReciter;
               return interaction.editReply({
                  content:
                     'السورة غير متاحة\n' +
                     'القارئ الحالي ' +
                     reciterName +
                     ' لا يملك هذه السورة\n' +
                     'هذا القارئ لديه ' +
                     availableCount +
                     ' سورة فقط من أصل 114\n' +
                     'الحلول\n' +
                     '• اختر سورة أخرى من 1 إلى ' +
                     availableCount +
                     '\n' +
                     '• أو غيّر القارئ إلى قارئ آخر يملك جميع السور',
                  flags: 64,
               });
            }
            state.currentSurah = selectedValue;
            try {
               const resource = await createSurahResource(state, surahIndex);
               state.player.stop();
               state.player.play(resource);
               state.isPaused = false;
               state.pauseReason = null;
               persistentStateManager.updateGuildState(guildId, {
                  currentSurahIndex: state.currentSurah - 1,
                  isPaused: false,
                  pauseReason: null,
               });
            } catch (error) {
               logger.error('Error Playing Surah ' + selectedValue + ' In Guild ' + guildId, error);
               return interaction.editReply({
                  content: 'حدث خطأ أثناء تشغيل السورة ' + error.message,
                  flags: 64,
               });
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
