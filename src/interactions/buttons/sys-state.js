const voiceManager = require('@audio/voice-connection');
const persistentState = require('@state/PersistentStateManager');

// Sync runtime guild state to persistent storage for recovery across restarts
// Replaced inline persistent sync logic with centralized voiceManager.syncVoiceState
async function saveGuildState(guildId, guildState) {
    await voiceManager.syncVoiceState(guildId, guildState);
}

function getPersistentState(guildId) {
    return persistentState.getGuildState(guildId);
}

module.exports.saveGuildState = saveGuildState;
module.exports.getPersistentState = getPersistentState;
