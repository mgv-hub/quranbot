const { teardownConnection, syncVoiceState } = require('@modules/Audio/Voice/AudioConnection');
const persistentState = require('@state/PersistentStateManager');
const voiceLogger = require('@infrastructure/Logging/VoiceLogger');

async function executeVoiceLeave(guildId, gs) {
    const hasLavalink = gs.connection && !gs.connection.destroyed;
    const hasRaw = !!gs.rawConnection;

    if (!hasLavalink && !hasRaw) {
        return { success: false, error: 'البوت غير موجود في روم صوتي حاليا' };
    }

    if (gs.player && !gs.player.destroyed) {
        if (gs.player.stopPlaying) gs.player.stopPlaying();
    }

    gs.isPaused = true;
    gs.pauseReason = 'manual_leave';
    await teardownConnection(guildId, gs);
    persistentState.setManualDisconnect(guildId, true);
    await syncVoiceState(guildId, gs);
    voiceLogger.connection(guildId, 'Voice leave completed');
    return { success: true, error: null };
}

module.exports.executeVoiceLeave = executeVoiceLeave;
