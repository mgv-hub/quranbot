const logger = require('@logger');
const persistentStateManager = require('@PersistentStateManager-core_state');

async function saveRuntimeStates() {
   try {
      if (global.guildStates) {
         for (const [guildId, state] of global.guildStates.entries()) {
            const persistentState = persistentStateManager.getGuildState(guildId);
            if (persistentState) {
               persistentState.voiceChannelId = state.channelId;
               persistentState.playbackMode = state.playbackMode;
               persistentState.currentReciter = state.currentReciter;
               persistentState.currentSurahIndex = state.currentSurah - 1;
               persistentState.currentRadioIndex = state.currentRadioIndex;
               persistentState.currentRadioUrl = state.currentRadioUrl;
               persistentState.currentRadioPage = state.currentRadioPage || 0;
               persistentState.currentReciterPage = state.currentReciterPage || 0;
               persistentState.currentPage = state.currentPage || 0;
               persistentState.controlMode = state.controlMode;
               persistentState.isPaused = state.isPaused;
               persistentState.connectionStatus =
                  state.connection && !state.connection.destroyed;
               persistentState.playedOffset = state.playedOffset || 0;
               persistentState.playbackStartTime = state.playbackStartTime || 0;
               persistentStateManager.updateGuildState(guildId, persistentState);
            }
         }
      }
      await persistentStateManager.saveAllStates();
      logger.info('Runtime States Saved Successfully');
      return true;
   } catch (error) {
      logger.error('Error Saving Runtime States', error);
      return false;
   }
}
module.exports.saveRuntimeStates = saveRuntimeStates;

async function loadRuntimeStates() {
   try {
      const allStates = persistentStateManager.getAllStates();
      logger.info('Loaded ' + Object.keys(allStates).length + ' Runtime States');
      return allStates;
   } catch (error) {
      logger.error('Error Loading Runtime States', error);
      return {};
   }
}

module.exports.loadRuntimeStates = loadRuntimeStates;
async function restoreRuntimeStates(client) {
   try {
      const allStates = persistentStateManager.getAllStates();
      let restoredCount = 0;
      let failedCount = 0;
      for (const [guildId, state] of Object.entries(allStates)) {
         try {
            const guild = client.guilds.cache.get(guildId);
            if (!guild) {
               failedCount++;
               continue;
            }

            const guildState = require('@GuildStateManager-core_state').getGuildState(guildId);
            if (state.playbackMode) {
               guildState.playbackMode = state.playbackMode;
               logger.info(
                  'Guild ' + guildId + ' Restored Playback Mode: ' + state.playbackMode,
               );
            }
            if (state.currentReciter) guildState.currentReciter = state.currentReciter;
            if (state.currentSurahIndex !== undefined)
               guildState.currentSurah = state.currentSurahIndex + 1;
            if (state.currentRadioIndex !== undefined)
               guildState.currentRadioIndex = state.currentRadioIndex;
            if (state.currentRadioUrl) guildState.currentRadioUrl = state.currentRadioUrl;
            if (state.currentRadioPage !== undefined)
               guildState.currentRadioPage = state.currentRadioPage;
            if (state.currentReciterPage !== undefined)
               guildState.currentReciterPage = state.currentReciterPage;
            if (state.currentPage !== undefined) guildState.currentPage = state.currentPage;
            if (state.controlMode) guildState.controlMode = state.controlMode;
            if (state.playedOffset !== undefined) guildState.playedOffset = state.playedOffset;
            if (state.playbackStartTime !== undefined)
               guildState.playbackStartTime = state.playbackStartTime;
            restoredCount++;
            logger.info(
               'Restored State For Guild ' +
                  guildId +
                  ' Mode ' +
                  guildState.playbackMode +
                  ' Offset ' +
                  guildState.playedOffset,
            );
         } catch (error) {
            failedCount++;
            logger.error('Failed To Restore State For Guild ' + guildId, error);
         }
      }
      logger.info(
         'State Restoration Complete ' +
            restoredCount +
            ' Restored ' +
            failedCount +
            ' Failed',
      );
      return { success: true, restored: restoredCount, failed: failedCount };
   } catch (error) {
      logger.error('Error Restoring Runtime States', error);
      return { success: false, restored: 0, failed: 0 };
   }
}
module.exports.restoreRuntimeStates = restoreRuntimeStates;
