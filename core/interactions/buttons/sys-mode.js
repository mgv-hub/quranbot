require('pathlra-aliaser');

const persistentStateManager = require('@PersistentStateManager-core_state');

async function toggleControlMode(guildId, state) {
   state.controlMode = state.controlMode === 'everyone' ? 'admins' : 'everyone';
   const persistentState = persistentStateManager.getGuildState(guildId);
   persistentState.controlMode = state.controlMode;
   persistentStateManager.updateGuildState(guildId, persistentState);
   global.saveRuntimeStates();
   return { success: true, newMode: state.controlMode };
}

module.exports.toggleControlMode = toggleControlMode;
