const logger = require('@logging/logger');
const persistentState = require('@state/PersistentStateManager');
const { teardownConnection, syncVoiceState, stopPlayer } = require('@audio');
const { ERRORS } = require('@interactions/buttons/sys-config');

async function leaveVoiceChannelHandler(guildId, guildState) {
    if (guildState.connection && !guildState.connection.destroyed) {
        stopPlayer(guildState);
        guildState.isPaused = true;
        guildState.pauseReason = 'manual_leave';

        await teardownConnection(guildId, guildState);
        persistentState.setManualDisconnect(guildId, true);
        await syncVoiceState(guildId, guildState);

        logger.info(`Guild ${guildId} Bot Disconnected From Voice Channel`);
        return { success: true };
    } else {
        return { success: false, error: ERRORS.NOT_IN_VC };
    }
}

module.exports.leaveVoiceChannelHandler = leaveVoiceChannelHandler;
