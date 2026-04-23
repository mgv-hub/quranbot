require('pathlra-aliaser');
const { getGuildState, isAuthorized } = require('@GuildStateManager-core_state');
const { createSurahResource, isSurahAvailable, getAvailableSurahCount } = require('@audioUtils-core_utils');
const { createControlEmbed } = require('@controlPanel-core_ui');
const { createReciterRow, createSelectRow, createButtonRow, createNavigationRow } = require('@components-core_ui');
const { updateControlMessage, saveControlId } = require('@interaction-core_utils');
const logger = require('@logger');
const { AudioPlayerStatus } = require('@discordjs/voice');
const { EmbedBuilder } = require('discord.js');

async function validatePlaybackState(state, guildId) {
   if (!state || !state.player) {
      logger.error('Guild ' + guildId + ' Invalid Player State');
      return false;
   }
   if (!state.connection || state.connection.destroyed) {
      logger.error('Guild ' + guildId + ' Voice Connection Invalid');
      return false;
   }
   if (!state.channelId) {
      logger.error('Guild ' + guildId + ' Channel ID Missing');
      return false;
   }

   const playerStatus = state.player.state.status;
   if (playerStatus === AudioPlayerStatus.AutoPaused) {
      logger.warn('Guild ' + guildId + ' Player AutoPaused Resetting');
      state.player.unpause();
   }

   state.connection.subscribe(state.player);
   return true;
}

async function sendChannelError(interaction, message) {
   await interaction.deferUpdate().catch(() => {});
   const errorEmbed = new EmbedBuilder().setColor(0x1e1f22).setDescription(message);
   await interaction.channel.send({ embeds: [errorEmbed] }).catch(() => {});
}

module.exports = {
   customId: 'playback',
   async execute(interaction) {
      const { guildId, customId } = interaction;
      const state = getGuildState(guildId);

      if (!isAuthorized(interaction, state, customId)) {
         await interaction.deferUpdate().catch(() => {});
         const permissionMessage =
            state.controlMode === 'everyone'
               ? 'هذا الإجراء غير متاح للأعضاء العاديين في وضع الجميع فقط التنقل بين السور واختيار القارئ متاح مع تأخير 90 ثانية الأدمنز لديهم تحكم كامل'
               : 'تتطلب هذه العملية امتلاك صلاحيات المسؤول (Administrator)';
         await sendChannelError(interaction, permissionMessage);
         return;
      }

      try {
         await interaction.deferUpdate().catch(() => {});

         const isValid = await validatePlaybackState(state, guildId);
         if (!isValid) {
            await sendChannelError(interaction, 'حدث خطأ في حالة التشغيل يرجى استخدام زر الخروج ثم الدخول مرة أخرى');
            return;
         }

         if (customId === 'next' && state.playbackMode !== 'surah') {
            await sendChannelError(interaction, 'السورة التالية غير متاحة في وضع الراديو');
            return;
         }
         if (customId === 'next') {
            let nextSurah = state.currentSurah < global.surahNames.length ? state.currentSurah + 1 : 1;
            if (!isSurahAvailable(state, nextSurah - 1)) {
               const availableCount = getAvailableSurahCount(state);
               if (nextSurah > availableCount) {
                  nextSurah = 1;
                  if (!isSurahAvailable(state, 0)) {
                     const reciterData = global.reciters[state.currentReciter];
                     const reciterName = reciterData?.name || state.currentReciter;
                     await sendChannelError(
                        interaction,
                        `لا توجد سور متاحة القارئ ${reciterName} لا يملك أي سورة متاحة الحل: غير القارئ إلى قارئ آخر`,
                     );
                     return;
                  }
               }
            }
            state.currentSurah = nextSurah;
            try {
               state.player.stop();
               await new Promise((resolve) => setTimeout(resolve, 100));
               const resource = await createSurahResource(state, state.currentSurah - 1, 0, 0, false);
               state.player.play(resource);
               state.isPaused = false;
               state.pauseReason = null;
               state.lastActivity = Date.now();
               global.saveRuntimeStates();
               logger.info('Guild ' + guildId + ' Playing Next Surah ' + state.currentSurah);
            } catch (error) {
               logger.error('Error Playing Next Surah In Guild ' + guildId, error);
               await sendChannelError(interaction, 'حدث خطأ أثناء تشغيل السورة التالية ' + error.message);
               return;
            }
         } else if (customId === 'prev' && state.playbackMode !== 'surah') {
            await sendChannelError(interaction, 'السورة السابقة غير متاحة في وضع الراديو');
            return;
         } else if (customId === 'prev') {
            let prevSurah = state.currentSurah > 1 ? state.currentSurah - 1 : global.surahNames.length;
            if (!isSurahAvailable(state, prevSurah - 1)) {
               const availableCount = getAvailableSurahCount(state);
               if (prevSurah > availableCount) {
                  prevSurah = availableCount;
                  if (prevSurah < 1) prevSurah = 1;
                  if (!isSurahAvailable(state, prevSurah - 1)) {
                     const reciterData = global.reciters[state.currentReciter];
                     const reciterName = reciterData?.name || state.currentReciter;
                     await sendChannelError(
                        interaction,
                        `لا توجد سور متاحة القارئ ${reciterName} لا يملك أي سورة متاحة الحل: غير القارئ إلى قارئ آخر`,
                     );
                     return;
                  }
               }
            }
            state.currentSurah = prevSurah;
            try {
               state.player.stop();
               await new Promise((resolve) => setTimeout(resolve, 100));
               const resource = await createSurahResource(state, state.currentSurah - 1, 0, 0, false);
               state.player.play(resource);
               state.isPaused = false;
               state.pauseReason = null;
               state.lastActivity = Date.now();
               global.saveRuntimeStates();
               logger.info('Guild ' + guildId + ' Playing Previous Surah ' + state.currentSurah);
            } catch (error) {
               logger.error('Error Playing Previous Surah In Guild ' + guildId, error);
               await sendChannelError(interaction, 'حدث خطأ أثناء تشغيل السورة السابقة ' + error.message);
               return;
            }
         } else if (customId === 'pause' && state.player.state.status === 'playing') {
            state.player.pause();
            state.isPaused = true;
            state.pauseReason = 'manual';
            state.lastActivity = Date.now();
            global.saveRuntimeStates();
            logger.info('Guild ' + guildId + ' Playback Paused');
         } else if (
            customId === 'resume' &&
            (state.player.state.status === 'paused' || state.player.state.status === 'idle')
         ) {
            try {
               let resource;
               if (state.playbackMode === 'surah') {
                  resource = await createSurahResource(state, state.currentSurah - 1, 0, 0, false);
               } else if (state.currentRadioUrl) {
                  const activeUrl =
                     global.radioHealthChecker?.getActiveRadioUrl(state.currentRadioUrl) || state.currentRadioUrl;
                  resource = await global.createRadioResource(activeUrl, 0);
               }
               if (resource) {
                  state.player.play(resource);
                  state.isPaused = false;
                  state.pauseReason = null;
                  state.lastActivity = Date.now();
                  global.saveRuntimeStates();
                  logger.info('Guild ' + guildId + ' Playback Resumed');
               }
            } catch (error) {
               logger.error('Error Resuming Playback In Guild ' + guildId, error);
               await sendChannelError(interaction, 'حدث خطأ أثناء استئناف التشغيل ' + error.message);
               return;
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
            await sendChannelError(interaction, 'حدث خطأ ' + error.message);
         } catch (replyError) {
            logger.error('Error Replying To Interaction', replyError);
         }
      }
   },
};
