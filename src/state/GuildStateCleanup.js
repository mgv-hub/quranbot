const logger = require('@infrastructure/Logging/Logger');
const { getGuildStateById, deleteGuildState } = require('@state/GuildStateStore');
const { decrementVoiceConnections } = require('@state/GuildStateVoice');
const { clearGuildIdleTimerVc } = require('@modules/Audio/Voice/VoiceIdle');

// Remove guild state and clean up associated resources
function removeGuildState(guildId) {
    const state = getGuildStateById(guildId);
    if (!state) return;
    try {
        if (state.inactivityTimer) clearTimeout(state.inactivityTimer);
        if (state.azkarTimer) clearInterval(state.azkarTimer);
        if (state.player) state.player.stop();

        if (state.rawConnection) {
            try {
                state.rawConnection.destroy();
            } catch (e) {}
            state.rawConnection = null;
        }
        if (state.connection && !state.connection.destroyed) {
            decrementVoiceConnections();
        }

        clearGuildIdleTimerVc(guildId);
        deleteGuildState(guildId);
        logger.info('Cleaned Up State For Guild ' + guildId);
    } catch (error) {
        logger.error('Error Cleaning State For Guild ' + guildId);
    }
}

function cleanupGuildState(guildId) {
    const state = getGuildStateById(guildId);
    if (!state) return;
    try {
        if (state.inactivityTimer) {
            clearTimeout(state.inactivityTimer);
            state.inactivityTimer = null;
        }
        if (state.azkarTimer) {
            clearInterval(state.azkarTimer);
            state.azkarTimer = null;
        }
        if (state.player) {
            state.player.stop();
            state.player.removeAllListeners();
        }
        if (state.rawConnection) {
            try {
                state.rawConnection.destroy();
            } catch (e) {}
            state.rawConnection = null;
        }
        if (state.connection && !state.connection.destroyed) {
            decrementVoiceConnections();
            state.connection.destroy();
        }
        clearGuildIdleTimerVc(guildId);
        deleteGuildState(guildId);
        logger.info('Cleaned Up State For Guild ' + guildId);
    } catch (error) {
        logger.error('Error Cleaning State For Guild ' + guildId, error);
    }
}

function cleanupDestroyedConnections() {
    const { getGuildStatesMap } = require('@state/GuildStateStore');
    const guildStates = getGuildStatesMap();
    let cleanedCount = 0;
    for (const [guildId, state] of guildStates.entries()) {
        if (state.connection?.destroyed || !state.channelId) {
            cleanupGuildState(guildId);
            cleanedCount++;
        }
    }
    if (cleanedCount > 0) {
        logger.info('Cleaned Up ' + cleanedCount + ' Destroyed Voice Connections');
    }
    return cleanedCount;
}

module.exports.removeGuildState = removeGuildState;
module.exports.cleanupGuildState = cleanupGuildState;
module.exports.cleanupDestroyedConnections = cleanupDestroyedConnections;
