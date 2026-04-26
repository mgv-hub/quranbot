require('pathlra-aliaser');

const { AudioPlayerStatus } = require('@discordjs/voice');
const logger = require('@logger');
const { findAvailableSurahForReciter, findWorkingReciter } = require('@audioUtils-core_utils');
const { getGuildStateById } = require('@guild-state-store-core_state');
const { VOICE_CONFIG } = require('@configConstants-core_utils');

const MAX_ERROR_COUNT = VOICE_CONFIG.MAX_ERROR_COUNT;
const ERROR_RECOVERY_DELAY_MS = VOICE_CONFIG.ERROR_RECOVERY_DELAY_MS;

function setupPlayerEvents(guildId, player) {
   let idleHandled = false;
   let errorRecoveryInProgress = false;

   player.on(AudioPlayerStatus.Idle, async () => {
      if (idleHandled) return;
      idleHandled = true;

      const state = getGuildStateById(guildId);
      if (!state || state.isPaused || !state.connection || state.connection.destroyed) {
         idleHandled = false;
         return;
      }

      logger.info('Guild ' + guildId + ' Player Idle Attempting Auto Resume');

      try {
         let resource;
         if (state.playbackMode === 'surah') {
            state.currentSurah = ((state.currentSurah - 1) % 114) + 1;
            state.playedOffset = 0;
            state.playbackStartTime = Date.now();

            try {
               resource = await global.createSurahResource(
                  state,
                  state.currentSurah - 1,
                  0,
                  0,
                  false,
               );
            } catch (surahError) {
               logger.warn(
                  'Guild ' +
                     guildId +
                     ' Surah ' +
                     state.currentSurah +
                     ' Failed: ' +
                     surahError.message,
               );
               const workingReciter = findWorkingReciter(state.currentReciter);
               if (workingReciter) {
                  state.currentReciter = workingReciter;
                  state.currentSurah = 1;
                  state.playedOffset = 0;
                  state.playbackStartTime = Date.now();
                  logger.info(
                     'Guild ' +
                        guildId +
                        ' Reciter ' +
                        state.currentReciter +
                        ' Failed Switched To ' +
                        workingReciter,
                  );
                  try {
                     resource = await global.createSurahResource(state, 0, 0, 0, true);
                  } catch (e) {
                     const alternativeIndex = findAvailableSurahForReciter(
                        state,
                        state.currentSurah - 1,
                     );
                     if (alternativeIndex !== -1) {
                        state.currentSurah = alternativeIndex + 1;
                        resource = await global.createSurahResource(
                           state,
                           alternativeIndex,
                           0,
                           0,
                           true,
                        );
                     }
                  }
               } else {
                  const alternativeIndex = findAvailableSurahForReciter(
                     state,
                     state.currentSurah - 1,
                  );
                  if (alternativeIndex !== -1) {
                     state.currentSurah = alternativeIndex + 1;
                     logger.info(
                        'Guild ' +
                           guildId +
                           ' Surah ' +
                           (state.currentSurah - 1) +
                           ' Failed Switched To Surah ' +
                           state.currentSurah,
                     );
                     resource = await global.createSurahResource(
                        state,
                        alternativeIndex,
                        0,
                        0,
                        true,
                     );
                  }
               }
            }
         } else if (state.currentRadioUrl) {
            state.playedOffset = 0;
            state.playbackStartTime = Date.now();
            const activeUrl =
               global.radioHealthChecker?.getActiveRadioUrl(state.currentRadioUrl) ||
               state.currentRadioUrl;
            state.currentRadioUrl = activeUrl;
            resource = await global.createRadioResource(activeUrl, 0);
         }

         if (resource) {
            state.player.play(resource);
            state.isPaused = false;
            state.pauseReason = null;
            state.errorCount = 0;
            logger.info('Guild ' + guildId + ' Playing Surah ' + state.currentSurah);
         } else {
            logger.warn('Guild ' + guildId + ' No Resource Created On Idle');
            state.isPaused = true;
            state.pauseReason = 'no_resource';
         }
      } catch (error) {
         state.errorCount++;
         logger.error(
            'Auto Resume Failed For Guild ' + guildId + ' Attempt ' + state.errorCount,
            error,
         );
         if (state.errorCount >= MAX_ERROR_COUNT) {
            state.isPaused = true;
            state.pauseReason = 'auto_resume_failed';
            logger.warn('Guild ' + guildId + ' Max Error Count Reached Pausing Playback');
         }
      }

      setTimeout(() => {
         idleHandled = false;
      }, 1000);
   });

   player.on('error', async (error) => {
      logger.error('Player Error In Guild ' + guildId, error.message);
      const state = getGuildStateById(guildId);
      if (state) {
         state.errorCount++;
         if (state.errorCount >= MAX_ERROR_COUNT) {
            state.isPaused = true;
            state.pauseReason = 'player_error';
         }

         if (!errorRecoveryInProgress) {
            errorRecoveryInProgress = true;
            try {
               await new Promise((resolve) => setTimeout(resolve, ERROR_RECOVERY_DELAY_MS));
               if (state.connection && !state.connection.destroyed) {
                  state.connection.subscribe(state.player);
                  state.player.stop();
                  if (state.playbackMode === 'surah') {
                     const resource = await global.createSurahResource(
                        state,
                        state.currentSurah - 1,
                        0,
                        0,
                        true,
                     );
                     state.player.play(resource);
                     state.isPaused = false;
                     state.pauseReason = null;
                     state.errorCount = 0;
                  }
               }
            } catch (recoveryError) {
               logger.error('Error Recovery Failed For Guild ' + guildId, recoveryError);
            } finally {
               errorRecoveryInProgress = false;
            }
         }
      }
   });

   player.on(AudioPlayerStatus.Playing, () => {
      const state = getGuildStateById(guildId);
      if (state) {
         state.errorCount = 0;
         state.isPaused = false;
         state.pauseReason = null;
         logger.debug('Guild ' + guildId + ' Player Now Playing');
      }
   });

   player.on(AudioPlayerStatus.Buffering, () => {
      const state = getGuildStateById(guildId);
      if (state) {
         logger.info('Guild ' + guildId + ' Player Buffering');
      }
   });

   player.on(AudioPlayerStatus.Paused, () => {
      const state = getGuildStateById(guildId);
      if (state) {
         logger.info('Guild ' + guildId + ' Player Paused');
      }
   });

   player.on('debug', (info) => {
      if (info.includes('socket closed') || info.includes('UDP socket')) {
         logger.warn('Guild ' + guildId + ' Voice socket issue detected: ' + info);
      }
   });

   player.on('subscribe', () => {
      logger.info('Guild ' + guildId + ' Player Subscribed To Connection');
   });

   player.on('unsubscribe', () => {
      logger.info('Guild ' + guildId + ' Player Unsubscribed From Connection');
      const state = getGuildStateById(guildId);
      if (state && state.connection && !state.connection.destroyed) {
         setTimeout(() => {
            if (state.connection && !state.connection.destroyed) {
               state.connection.subscribe(state.player);
               logger.info('Guild ' + guildId + ' Player Auto Resubscribed');
            }
         }, 1000);
      }
   });
}

module.exports.setupPlayerEvents = setupPlayerEvents;
