require('pathlra-aliaser');

const { AudioPlayerStatus } = require('@discordjs/voice');
const logger = require('@logger');
const { createSurahResource } = require('@audioUtils-core_utils');
const { PLAYER_CONFIG } = require('@sys-config-core_interactions_buttons');

async function ensurePlaybackStarted(state, guildId) {
   try {
      await new Promise((resolve) =>
         setTimeout(resolve, PLAYER_CONFIG.PLAYBACK_START_DELAY_MS),
      );

      if (!state.connection || state.connection.destroyed) {
         logger.warn('Guild ' + guildId + ' Connection Lost During Playback Start');
         return false;
      }

      state.connection.subscribe(state.player);
      logger.info('Guild ' + guildId + ' Player Subscribed To Connection');

      if (state.player.state.status === AudioPlayerStatus.Idle) {
         logger.info('Guild ' + guildId + ' Player Idle After Join Starting Playback');

         if (state.playbackMode === 'surah') {
            const resource = await createSurahResource(
               state,
               state.currentSurah - 1,
               0,
               0,
               false,
            );
            state.player.play(resource);
            state.isPaused = false;
            state.pauseReason = null;
         } else if (state.currentRadioUrl) {
            const { createRadioResource } = require('@audioUtils-core_utils');
            const resource = await createRadioResource(state.currentRadioUrl, 0);
            state.player.play(resource);
            state.isPaused = false;
            state.pauseReason = null;
         }

         logger.info('Guild ' + guildId + ' Playback Started Successfully');
         return true;
      }

      return true;
   } catch (error) {
      logger.error('Guild ' + guildId + ' Ensure Playback Failed', error);
      return false;
   }
}

async function startPlayback(state, guildId) {
   try {
      if (state.playbackMode === 'surah') {
         const resource = await createSurahResource(
            state,
            state.currentSurah - 1,
            0,
            0,
            false,
         );
         state.player.play(resource);
      } else if (state.currentRadioUrl) {
         const { createRadioResource } = require('@audioUtils-core_utils');
         const resource = await createRadioResource(state.currentRadioUrl, 0);
         state.player.play(resource);
      }
      state.isPaused = false;
      state.pauseReason = null;
      state.lastActivity = Date.now();
      return true;
   } catch (error) {
      logger.error('Guild ' + guildId + ' Start Playback Failed', error);
      return false;
   }
}

module.exports.ensurePlaybackStarted = ensurePlaybackStarted;
module.exports.startPlayback = startPlayback;
