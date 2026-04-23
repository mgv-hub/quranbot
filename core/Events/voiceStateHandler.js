require('pathlra-aliaser')();
const logger = require('@logger');
const persistentStateManager = require('@PersistentStateManager-core_state');
const client = require('@botSetup').client;

client.on('voiceStateUpdate', async (oldState, newState) => {
   if (oldState.id !== client.user.id && newState.id !== client.user.id) {
      return;
   }
   const guildId = oldState.guild.id || newState.guild.id;
   const state = global.guildStates.get(guildId);
   if (!state) {
      return;
   }
   const wasInChannel = oldState.channelId !== null;
   const isInChannel = newState.channelId !== null;
   if (wasInChannel && !isInChannel) {
      logger.info(`Guild ${guildId} Bot Was Externally Disconnected From Voice`);
      state.connection = null;
      state.channelId = null;
      state.isPaused = true;
      state.pauseReason = 'external_disconnect';
      if (state.azkarTimer) {
         clearInterval(state.azkarTimer);
         state.azkarTimer = null;
      }
      const persistentState = persistentStateManager.getGuildState(guildId);
      if (persistentState) {
         persistentState.connectionStatus = false;
         persistentState.voiceChannelId = null;
         persistentState.manualDisconnectFlag = false;
         persistentStateManager.updateGuildState(guildId, persistentState);
      }
      if (typeof global.saveRuntimeStates === 'function') {
         await global.saveRuntimeStates();
      }
      logger.info(`Guild ${guildId} Voice State Cleaned Up After External Disconnect`);
   }
});

module.exports = {};
