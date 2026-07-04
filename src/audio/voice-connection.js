const { createAudioPlayer, joinVoiceChannel } = require('@discordjs/voice');
const { setupPlayerEvents } = require('../state/GuildStateManager');
const persistentState = require('@state/PersistentStateManager');
const logger = require('@logging/logger');

async function teardownConnection(guildId, guildState) {
    if (!guildState) return;

    // Clear adhkar timer to prevent orphaned intervals
    if (guildState.azkarTimer) {
        clearInterval(guildState.azkarTimer);
        guildState.azkarTimer = null;
        guildState.azkarChannelId = null;
    }

    // Unsubscribe and destroy connection, ignoring expected teardown errors
    if (guildState.connection && !guildState.connection.destroyed) {
        try {
            guildState.connection.unsubscribe(guildState.player);
        } catch {
            // Expected if already closing
        }
        try {
            guildState.connection.destroy();
        } catch (err) {
            logger.warn(`Error destroying connection in guild ${guildId}`, err);
        }
    }

    guildState.connection = null;
    guildState.channelId = null;
}

async function resetPlayer(guildId, guildState) {
    if (!guildState?.player) return false;
    try {
        guildState.player.stop();
        guildState.player.removeAllListeners();
        const freshPlayer = createAudioPlayer({
            behaviors: {
                noSubscriberTimeout: 60000,
                maxMissedFrames: 500,
            },
        });
        guildState.player = freshPlayer;
        guildState.errorCount = 0;
        guildState.isPaused = true;
        guildState.pauseReason = 'player_reset';
        setupPlayerEvents(guildId, freshPlayer);
        logger.info(`Guild ${guildId} Player Reset`);
        return true;
    } catch (error) {
        logger.error(`Guild ${guildId} Player Reset Failed`, error);
        return false;
    }
}

async function syncVoiceState(guildId, guildState, triggerGlobalSave = true) {
    const storedState = persistentState.getGuildState(guildId);
    storedState.voiceChannelId = guildState.channelId;
    storedState.playbackMode = guildState.playbackMode;
    storedState.currentReciter = guildState.currentReciter;
    storedState.currentSurahIndex = guildState.currentSurah - 1;
    storedState.connectionStatus = !!guildState.connection && !guildState.connection.destroyed;
    storedState.isPaused = guildState.isPaused;

    persistentState.updateGuildState(guildId, storedState);

    if (triggerGlobalSave && typeof global.saveRuntimeStates === 'function') {
        setImmediate(() => {
            global.saveRuntimeStates().catch((err) => logger.error('Async Runtime Save Failed', err));
        });
    }
}

async function initializeConnection(guildId, guildState, targetChannel, adapterCreator) {
    await teardownConnection(guildId, guildState);
    await resetPlayer(guildId, guildState);

    guildState.connection = await joinVoiceChannel({
        channelId: targetChannel.id,
        guildId,
        adapterCreator,
        selfDeaf: true,
    });

    guildState.channelId = targetChannel.id;
    persistentState.setManualDisconnect(guildId, false);
    guildState.connection.subscribe(guildState.player);
    logger.info(`Guild ${guildId} Connection Subscribed To Player`);

    return { success: true, connection: guildState.connection };
}

module.exports.teardownConnection = teardownConnection;
module.exports.resetPlayer = resetPlayer;
module.exports.syncVoiceState = syncVoiceState;
module.exports.initializeConnection = initializeConnection;
