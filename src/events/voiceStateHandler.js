const logger = require('@logging/logger');
const voiceLogger = require('@logging/voiceLogger');
// const persistentState = require('@state/PersistentStateManager');
const botClient = require('@startup/botSetup').client;
const { voiceIdle } = require('@state/voice-idle');

// Monitor voice state changes to handle external bot disconnections
botClient.on('voiceStateUpdate', async (previousState, currentState) => {
    // Only process events related to the bot itself
    if (previousState.id !== botClient.user.id && currentState.id !== botClient.user.id) {
        const guildId = currentState.guild.id;
        const guildState = global.guildStates.get(guildId);

        if (!guildState?.channelId) return;

        const userJoinedBotChannel = currentState.channelId === guildState.channelId;
        const userLeftBotChannel = previousState.channelId === guildState.channelId;

        if (userJoinedBotChannel || userLeftBotChannel) {
            await voiceIdle(guildId, botClient);
        }
        return;
    }
    const guildId = previousState.guild.id || currentState.guild.id;
    voiceLogger.connection(guildId, 'Voice state update detected for bot', {
        previousChannel: previousState.channelId,
        currentChannel: currentState.channelId,
        wasConnected: previousState.channelId !== null,
        isCurrentlyConnected: currentState.channelId !== null,
    });
    const guildState = global.guildStates.get(guildId);
    // Skip if we don't have state tracked for this guild
    if (!guildState) {
        voiceLogger.connection(guildId, 'Voice state update ignored - no guild state tracked');
        return;
    }
    const wasConnected = previousState.channelId !== null;
    const isCurrentlyConnected = currentState.channelId !== null;
    // Detect when bot gets kicked/disconnected from voice channel externally
    if (wasConnected && !isCurrentlyConnected) {
        // Prevent false positives during Lavalink queue transitions or internal state updates
        if (guildState.player && !guildState.player.destroyed) {
            voiceLogger.connection(guildId, 'Ignored temporary voice state change - Lavalink player still active');
            return;
        }

        if (!guildState.channelId && (!guildState.player || guildState.player.destroyed)) {
            return;
        }

        voiceLogger.connection(guildId, 'Bot externally disconnected from voice channel');

        // Destroy the Lavalink player to prevent state desync where the player is alive in memory but dead in Discord
        if (guildState.player && !guildState.player.destroyed) {
            try {
                await guildState.player.destroy().catch(() => {});
            } catch (e) {
                voiceLogger.debug(guildId, 'Failed to destroy player on external disconnect', { error: e.message });
            }
        }

        // Reset connection state locally
        guildState.connection = null;
        guildState.player = null;
        guildState.channelId = null;
        guildState.isPaused = true;
        guildState.pauseReason = 'external_disconnect';
        // Clear any active adhkar timer to prevent orphaned intervals
        //   if (guildState.azkarTimer) {
        //       clearInterval(guildState.azkarTimer);
        //       guildState.azkarTimer = null;
        //       voiceLogger.connection(guildId, 'Cleared azkar timer after external disconnect');
        //   }
        // const storedState = persistentState.getGuildState(guildId);
        // if (storedState) {
        // storedState.connectionStatus = false;
        // storedState.voiceChannelId = null;
        // storedState.manualDisconnectFlag = false;
        // persistentState.updateGuildState(guildId, storedState);
        // voiceLogger.connection(guildId, 'Persistent state updated after external disconnect');
        // }
        // Persist runtime changes if the save function is available
        if (typeof global.saveRuntimeStates === 'function') {
            await global.saveRuntimeStates();
            voiceLogger.connection(guildId, 'Runtime states saved after external disconnect');
        }
        logger.info(`Guild ${guildId} Voice State Cleaned Up After External Disconnect`);
        voiceLogger.connection(guildId, 'External disconnect cleanup completed');
    } else if (!wasConnected && isCurrentlyConnected) {
        voiceLogger.connection(guildId, 'Bot joined voice channel externally');
        guildState.channelId = currentState.channelId;
        if (guildState.player && !guildState.player.destroyed) {
            guildState.connection = guildState.player;
            guildState.isPaused = false;
            guildState.pauseReason = null;
        }
    } else if (wasConnected && isCurrentlyConnected && previousState.channelId !== currentState.channelId) {
        guildState.channelId = currentState.channelId;
        if (guildState.player && !guildState.player.destroyed) {
            guildState.connection = guildState.player;
        }
    }
    await voiceIdle(guildId, botClient);
});

module.exports = {};
