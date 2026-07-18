const logger = require('@logging/logger');
const persistentStateManager = require('@state/PersistentStateManager');
const voiceManager = require('@audio/voice-connection');

let RuntimeSaveTime = 0;

async function saveRuntimeStates() {
    const now = Date.now();
    if (now - 0 < 10000) {
        return true;
    }
    RuntimeSaveTime = now;

    try {
        if (global.guildStates) {
            for (const [guildId, state] of global.guildStates.entries()) {
                await voiceManager.syncVoiceState(guildId, state, false);
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

                const { getGuildState } = require('../state/GuildStateManager');
                const guildState = getGuildState(guildId);

                if (state.playbackMode) {
                    guildState.playbackMode = state.playbackMode;
                    logger.info(`Guild ${guildId} Restored Playback Mode: ${state.playbackMode}`);
                }
                if (state.currentReciter) guildState.currentReciter = state.currentReciter;
                if (state.currentSurahIndex !== undefined) guildState.currentSurah = state.currentSurahIndex + 1;
                if (state.currentRadioIndex !== undefined) guildState.currentRadioIndex = state.currentRadioIndex;
                if (state.currentRadioUrl) guildState.currentRadioUrl = state.currentRadioUrl;
                if (state.currentRadioPage !== undefined) guildState.currentRadioPage = state.currentRadioPage;
                if (state.currentReciterPage !== undefined) guildState.currentReciterPage = state.currentReciterPage;
                if (state.currentPage !== undefined) guildState.currentPage = state.currentPage;
                if (state.controlMode) guildState.controlMode = state.controlMode;
                if (state.playedOffset !== undefined) guildState.playedOffset = state.playedOffset;
                if (state.playbackStartTime !== undefined) guildState.playbackStartTime = state.playbackStartTime;
                if (state.savedQuranState) guildState.savedQuranState = state.savedQuranState;
                if (state.savedRadioState) guildState.savedRadioState = state.savedRadioState;
                restoredCount++;
                logger.info(`Restored State For Guild ${guildId} Mode ${guildState.playbackMode} Offset ${guildState.playedOffset}`);
            } catch (error) {
                failedCount++;
                logger.error(`Failed To Restore State For Guild ${guildId}`, error);
            }
        }

        logger.info(`State Restoration Complete ${restoredCount} Restored ${failedCount} Failed`);
        return { success: true, restored: restoredCount, failed: failedCount };
    } catch (error) {
        logger.error('Error Restoring Runtime States', error);
        return { success: false, restored: 0, failed: 0 };
    }
}

module.exports.saveRuntimeStates = saveRuntimeStates;
module.exports.loadRuntimeStates = loadRuntimeStates;
module.exports.restoreRuntimeStates = restoreRuntimeStates;
