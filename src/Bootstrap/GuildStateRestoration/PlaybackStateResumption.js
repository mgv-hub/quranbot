const logger = require('@infrastructure/Logging/Logger');
const { getGuildState } = require('@state/GuildStateManager');
const persistentStateManager = require('@state/PersistentStateManager');
const { syncVoiceState } = require('@modules/Audio/AudioModule');
const { restorePlaybackState, startPlayback } = require('@modules/Audio/Interactions/Helpers/VoiceJoinHelper');

async function resumeGuildPlayback(guildId) {
    const storedState = persistentStateManager.getGuildState(guildId);
    const guildState = getGuildState(guildId);
    
    guildState.controlMode = storedState?.controlMode || 'everyone';
    restorePlaybackState(guildState);
    guildState.isPaused = false;
    guildState.pauseReason = null;
    persistentStateManager.setManualDisconnect(guildId, false);

    await syncVoiceState(guildId, guildState);

    if (!guildState.rawConnection) {
        const played = await startPlayback(guildState, guildId);
        if (!played && guildState.playbackMode === 'radio') {
            guildState.playbackMode = 'surah';
            await startPlayback(guildState, guildId);
        }
    }

    logger.info(`Restored State For Guild ${guildId} Successfully`);
}

module.exports.resumeGuildPlayback = resumeGuildPlayback;
