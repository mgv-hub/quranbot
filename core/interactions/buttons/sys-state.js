require('pathlra-aliaser');

const persistentStateManager = require('@PersistentStateManager-core_state');

async function saveGuildState(guildId, state) {
   const persistentState = persistentStateManager.getGuildState(guildId);
   persistentState.voiceChannelId = state.channelId;
   persistentState.playbackMode = state.playbackMode;
   persistentState.currentReciter = state.currentReciter;
   persistentState.currentSurahIndex = state.currentSurah - 1;
   persistentState.connectionStatus = state.connection && !state.connection.destroyed;
   persistentState.isPaused = state.isPaused;
   persistentStateManager.updateGuildState(guildId, persistentState);
   global.saveRuntimeStates();
}

function getPersistentState(guildId) {
   return persistentStateManager.getGuildState(guildId);
}

module.exports.saveGuildState = saveGuildState;
module.exports.getPersistentState = getPersistentState;
