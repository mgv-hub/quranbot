// core/interactions/buttons/sys-leave.js
require('pathlra-aliaser');
const logger = require('@logger');
const persistentStateManager = require('@PersistentStateManager-core_state');
const { stopPlayer } = require('@sys-player-core_interactions_buttons');
const { ERRORS } = require('@sys-config-core_interactions_buttons');

async function leaveVoiceChannelHandler(guildId, state) {
   if (state.connection && !state.connection.destroyed) {
      stopPlayer(state);
      state.isPaused = true;
      state.pauseReason = 'manual_leave';

      try {
         state.connection.unsubscribe(state.player);
      } catch (error) {
         logger.info('Error unsubscribing player in guild ' + guildId);
      }

      try {
         state.connection.destroy();
      } catch (error) {
         logger.warn('Error destroying connection in guild ' + guildId, error);
      }

      state.connection = null;
      state.channelId = null;

      persistentStateManager.setManualDisconnect(guildId, true);
      const persistentState = persistentStateManager.getGuildState(guildId);
      persistentState.connectionStatus = false;
      persistentState.voiceChannelId = null;
      persistentStateManager.updateGuildState(guildId, persistentState);

      global.saveRuntimeStates();

      logger.info('Guild ' + guildId + ' Bot Disconnected From Voice Channel');
      return { success: true };
   } else {
      return { success: false, error: ERRORS.NOT_IN_VC };
   }
}

module.exports.leaveVoiceChannelHandler = leaveVoiceChannelHandler;
