require('pathlra-aliaser')();

const { AudioPlayerStatus } = require('@discordjs/voice');
const logger = require('@logger');
const { getGuildStatesMap } = require('@guild-state-store-core_state');
const { VOICE_CONFIG } = require('@configConstants-core_utils');

let watchdogInterval = null;

async function evaluateGuildState(guildId, state) {
   if (!state.connection || state.connection.destroyed) return;
   if (!state.player) return;

   const currentStatus = state.player.state.status;
   const isSupposedToBePlaying = !state.isPaused && state.channelId;
   if (!isSupposedToBePlaying) return;

   const lastActivityTime = state.lastActivity || state.playbackStartTime || Date.now();
   const timeSinceActivity = Date.now() - lastActivityTime;
   const bufferTimeout = VOICE_CONFIG.WATCHDOG_BUFFER_TIMEOUT_MS || 180000;

   if (currentStatus === AudioPlayerStatus.Buffering && timeSinceActivity > bufferTimeout) {
      logger.warn('Watchdog Guild ' + guildId + ' Stuck Buffering Initiating Recovery');
      await performRecovery(guildId, state, 'buffer_timeout');
      return;
   }

   if (currentStatus === AudioPlayerStatus.Idle && timeSinceActivity > bufferTimeout) {
      logger.warn('Watchdog Guild ' + guildId + ' Idle Without Pause Initiating Recovery');
      await performRecovery(guildId, state, 'idle_timeout');
      return;
   }

   if (currentStatus === AudioPlayerStatus.Playing && state.pauseReason) {
      state.isPaused = false;
      state.pauseReason = null;
      state.lastActivity = Date.now();
      logger.info('Watchdog Guild ' + guildId + ' Cleared Stale Pause Reason');
   }
}

async function performRecovery(guildId, state, reason) {
   try {
      if (!state.connection || state.connection.destroyed) {
         state.isPaused = true;
         state.pauseReason = 'connection_lost';
         return;
      }

      state.recoveryAttempts = (state.recoveryAttempts || 0) + 1;
      const maxAttempts = VOICE_CONFIG.WATCHDOG_MAX_RECOVERIES || 3;

      if (state.recoveryAttempts >= maxAttempts) {
         logger.warn(
            'Watchdog Guild ' + guildId + ' Max Recovery Attempts Reached Disconnecting',
         );
         state.player.stop();
         state.connection.destroy();
         state.connection = null;
         state.channelId = null;
         state.isPaused = true;
         state.pauseReason = 'watchdog_max_retries';
         state.recoveryAttempts = 0;
         if (typeof global.saveRuntimeStates === 'function') {
            await global.saveRuntimeStates();
         }
         return;
      }

      state.player.stop();
      state.connection.subscribe(state.player);

      let resource = null;
      if (state.playbackMode === 'surah') {
         resource = await global.createSurahResource(
            state,
            state.currentSurah - 1,
            0,
            0,
            true,
         );
      } else if (state.currentRadioUrl) {
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
         state.playbackStartTime = Date.now();
         state.lastActivity = Date.now();
         logger.info('Watchdog Guild ' + guildId + ' Recovery Successful After ' + reason);
      } else {
         logger.error(
            'Watchdog Guild ' + guildId + ' Failed To Create Resource After ' + reason,
         );
         await performRecovery(guildId, state, 'resource_creation_failed');
      }
   } catch (error) {
      logger.error('Watchdog Guild ' + guildId + ' Recovery Failed ' + error.message);
      state.errorCount = (state.errorCount || 0) + 1;
      const errorLimit = VOICE_CONFIG.MAX_ERROR_COUNT || 5;
      if (state.errorCount >= errorLimit) {
         state.isPaused = true;
         state.pauseReason = 'watchdog_error_limit';
         state.recoveryAttempts = 0;
      }
   }
}

function startVoiceWatchdog() {
   if (watchdogInterval) return;
   const checkInterval = VOICE_CONFIG.WATCHDOG_CHECK_INTERVAL_MS || 300000;
   watchdogInterval = setInterval(async () => {
      const guildStates = getGuildStatesMap();
      for (const [guildId, state] of guildStates.entries()) {
         try {
            await evaluateGuildState(guildId, state);
         } catch (err) {
            logger.debug('Watchdog Guild ' + guildId + ' Evaluation Skipped ' + err.message);
         }
      }
   }, checkInterval);
   logger.info('Voice Watchdog Started Interval ' + checkInterval + 'ms');
}

function stopVoiceWatchdog() {
   if (watchdogInterval) {
      clearInterval(watchdogInterval);
      watchdogInterval = null;
   }
}

module.exports.startVoiceWatchdog = startVoiceWatchdog;
module.exports.stopVoiceWatchdog = stopVoiceWatchdog;
