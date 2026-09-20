const logger = require('@infrastructure/Logging/Logger');
const voiceLogger = require('@infrastructure/Logging/VoiceLogger');
// const persistentState = require('@state/PersistentStateManager');
const auditLogger = require('@infrastructure/Logging/AuditLogger');
const botClient = require('@bootstrap/BotSetup').client;
const { voiceIdle, checkInitialIdleState } = require('@modules/Audio/Voice/VoiceIdle');

// Monitor voice state changes to handle external bot disconnections
botClient.on('voiceStateUpdate', async (previousState, currentState) => {
    // Only process events related to the bot itself
    if (previousState.id !== botClient.user.id && currentState.id !== botClient.user.id) {
        const guildId = currentState.guild.id;
        const guildState = global.guildStates.get(guildId);

        if (!guildState?.channelId) return;
        if (currentState.channelId === guildState.channelId || previousState.channelId === guildState.channelId) {
            await voiceIdle(guildId, botClient);
        }
        return;
    }

    const guildId = previousState.guild.id || currentState.guild.id;
    const guildState = global.guildStates.get(guildId);
    if (!guildState) return;

    const wasConnected = previousState.channelId !== null;
    const isCurrentlyConnected = currentState.channelId !== null;

    if (wasConnected && !isCurrentlyConnected) {
        if (guildState.player && !guildState.player.destroyed) return;
        if (!guildState.channelId) return;

        voiceLogger.connection(guildId, 'Bot externally disconnected from voice channel');
        auditLogger.logVoiceExternalDisconnect(previousState.guild, previousState.channelId, currentState.member?.user || null);

        if (guildState.player && !guildState.player.destroyed) {
            try { await guildState.player.destroy().catch(() => {}); } catch (e) {}
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
        if (typeof global.saveRuntimeStates === 'function') await global.saveRuntimeStates();
        logger.info(`Guild ${guildId} Voice State Cleaned Up After External Disconnect`);
    } else if (!wasConnected && isCurrentlyConnected) {
        voiceLogger.connection(guildId, 'Bot joined voice channel');
        auditLogger.logVoiceExternalJoin(currentState.guild, currentState.channelId, currentState.member?.user || null);
        guildState.channelId = currentState.channelId;
        if (guildState.player && !guildState.player.destroyed) {
            guildState.connection = guildState.player;
            guildState.isPaused = false;
            guildState.pauseReason = null;
        }
        await checkInitialIdleState(guildId, botClient);
    } else if (wasConnected && isCurrentlyConnected && previousState.channelId !== currentState.channelId) {
        guildState.channelId = currentState.channelId;
        if (guildState.player && !guildState.player.destroyed) guildState.connection = guildState.player;
        auditLogger.logVoiceChannelChange(previousState.guild || currentState.guild, previousState.channelId, currentState.channelId, currentState.member?.user || null);
        await checkInitialIdleState(guildId, botClient);
    }
    await voiceIdle(guildId, botClient);
});

module.exports = {};
