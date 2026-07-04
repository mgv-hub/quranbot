// const { joinVoiceChannel } = require('@discordjs/voice');
const persistentState = require('../state/PersistentStateManager');
const logger = require('@logging/logger');
const voiceLogger = require('@logging/voiceLogger');
const { time_constants } = require('@config/constants');
const { getBestNode, nodeConfigs } = require('@startup/botSetup');

if (!global.activeVoiceConnections) {
    global.activeVoiceConnections = 0;
}

let lavalinkrequest = time_constants.request_timeout_ms_30s;
let connection_time = 15000; // Later with @configConstants

function canJoinVoice() {
    //  if (!global.max_voice_connections_per_shard) {
    //      voiceLogger.debug('Voice capacity check: no limit configured, allowing join');
    //      return true;
    //  }
    const current = global.activeVoiceConnections || 0;
    //  const canJoin = current < global.max_voice_connections_per_shard;
    //  voiceLogger.debug(`Voice capacity check: ${current}/${global.max_voice_connections_per_shard} - canJoin: ${canJoin}`);
    return true;
}

function incrementVoiceConnections() {
    if (!global.activeVoiceConnections) {
        global.activeVoiceConnections = 0;
    }
    global.activeVoiceConnections++;
    voiceLogger.debug(`Voice connections incremented to ${global.activeVoiceConnections}`);
}

function decrementVoiceConnections() {
    if (!global.activeVoiceConnections) {
        global.activeVoiceConnections = 0;
    }
    if (global.activeVoiceConnections > 0) {
        global.activeVoiceConnections--;
        voiceLogger.debug(`Voice connections decremented to ${global.activeVoiceConnections}`);
    }
}

async function teardownConnection(guildId, guildState) {
    voiceLogger.connection(guildId, 'Starting teardown', {
        hasPlayer: !!guildState?.player,
        hasChannel: !!guildState?.channelId,
    });
    if (!guildState) {
        voiceLogger.connection(guildId, 'Teardown skipped - no guild state');
        return;
    }
    //  Stop adhkar timer to prevent orphaned intervals after disconnect
    //  if (guildState.azkarTimer) {
    //      clearInterval(guildState.azkarTimer);
    //      guildState.azkarTimer = null;
    //      guildState.azkarChannelId = null;
    //      voiceLogger.connection(guildId, 'Cleared azkar timer during teardown');
    //  }

    if (guildState.player && !guildState.player.destroyed) {
        try {
            if (typeof guildState.player.stopPlaying === 'function') {
                guildState.player.stopPlaying();
            }
            await new Promise((resolve) => setTimeout(resolve, 100));
            try {
                await guildState.player.destroy();
                voiceLogger.connection(guildId, 'Destroyed voice connection');
            } catch (destroyErr) {
                if (destroyErr.message?.includes('Destroy failed (expected during teardown)')) {
                    voiceLogger.connection(guildId, 'Player cleanup handled by library internal flow');
                } else {
                    throw destroyErr;
                }
            }
            voiceLogger.connection(guildId, 'Destroyed voice connection');
        } catch (err) {
            voiceLogger.connection(guildId, 'Destroy failed (expected during teardown)', {
                error: err.message,
            });
        }
    }
    const channelIdToClear = guildState.channelId;
    guildState.player = null; // 1
    guildState.channelId = null; // 2
    guildState.connection = null; // 3
    if (channelIdToClear) {
        const { setVoiceChannelStatus } = require('./voiceStatus');
        const client = require('@startup/botSetup').client;
        setVoiceChannelStatus(channelIdToClear, '', client);
    }
    voiceLogger.connection(guildId, 'Teardown complete - state cleared');
}

async function syncVoiceState(guildId, guildState) {
    voiceLogger.connection(guildId, 'Syncing voice state to persistent storage', {
        channelId: guildState.channelId,
        playbackMode: guildState.playbackMode,
        reciter: guildState.currentReciter,
        surahIndex: guildState.currentSurah,
        // oid connectionStatus: !!guildState.connection && !guildState.connection?.destroyed,
        connectionStatus: !!guildState.player && !guildState.player?.destroyed,
        isPaused: guildState.isPaused,
    });

    const storedState = persistentState.getGuildState(guildId);
    storedState.voiceChannelId = guildState.channelId;
    storedState.playbackMode = guildState.playbackMode;
    storedState.currentReciter = guildState.currentReciter;
    storedState.currentSurahIndex = guildState.currentSurah - 1;
    storedState.isPaused = guildState.isPaused;
    storedState.currentRadioIndex = guildState.currentRadioIndex;
    storedState.currentRadioPage = guildState.currentRadioPage;
    storedState.savedQuranState = guildState.savedQuranState;
    storedState.savedRadioState = guildState.savedRadioState;
    persistentState.updateGuildState(guildId, storedState);

    if (typeof global.saveRuntimeStates === 'function') {
        await global.saveRuntimeStates();
        voiceLogger.connection(guildId, 'Runtime states saved after sync');
    }
    voiceLogger.connection(guildId, 'Voice state sync completed');
}

async function initializeConnection(guildId, guildState, targetChannel, adapterCreator) {
    voiceLogger.connection(guildId, 'Initializing Lavalink player con', {
        channelId: targetChannel.id,
        guildName: targetChannel.guild?.name,
        // adapterAvailable: !!adapterCreator,
    });
    await teardownConnection(guildId, guildState);
    //const { resetPlayer } = require('./player');
    //await resetPlayer(guildId, guildState);
    try {
        const client = require('@startup/botSetup').client;
        if (!client.lavalink) {
            throw new Error('Lavalink manager not initialized');
        }
        voiceLogger.connection(guildId, 'Calling createPlayer', { selfDeaf: true });
        let bestNode = null;
        if (guildState.preferredLavalinkNode) {
            const node = client.lavalink.nodeManager.nodes.get(guildState.preferredLavalinkNode);
            if (node && node.connected) {
                const config = nodeConfigs.get(node.id);
                const playerCount = Array.from(client.lavalink.players.values()).filter((p) => p.node?.id === node.id).length;
                const isFull = config && playerCount >= config.maxPlayers;

                if (!isFull) {
                    bestNode = node;
                    voiceLogger.connection(guildId, `Using preferred node ${bestNode.id}`, {
                        location: require('@startup/botSetup').nodeConfigs.get(bestNode.id)?.location,
                    });
                } else {
                    voiceLogger.connection(guildId, `Preferred node ${node.id} is at full capacity, selecting alternative...`);
                }
            }
        }
        if (!bestNode) {
            bestNode = getBestNode(client.lavalink);
        }

        if (!bestNode) {
            throw new Error('All Lavalink nodes are currently at full capacity');
        }

        const playerOptions = {
            guildId,
            voiceChannelId: targetChannel.id,
            textChannelId: targetChannel.isTextBased ? (targetChannel.isTextBased() ? targetChannel.id : null) : null,
            selfDeaf: true,
            node: bestNode.id,
        };
        voiceLogger.connection(guildId, `Using node ${bestNode.id} for player creation`, {
            location: require('@startup/botSetup').nodeConfigs.get(bestNode.id)?.location,
        });
        // guildState.player = await client.lavalink.createPlayer({
        //     guildId,
        //    voiceChannelId: targetChannel.id,
        //     textChannelId: targetChannel.isTextBased ? (targetChannel.isTextBased() ? targetChannel.id : null) : null,
        //    selfDeaf: true,
        // });
        guildState.player = await client.lavalink.createPlayer(playerOptions);
        const connectPromise = guildState.player.connect();
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Voice connection timeout')), connection_time);
        });
        await Promise.race([connectPromise, timeoutPromise]);
        voiceLogger.connection(guildId, 'Lavalink player connected to voice channel successfully', {
            playerReady: !!guildState.player,
            playerDestroyed: guildState.player?.destroyed,
            assignedNode: guildState.player.node?.id,
        });
        guildState.channelId = targetChannel.id;
        guildState.connection = guildState.player;
        persistentState.setManualDisconnect(guildId, false);

        incrementVoiceConnections();
        logger.info(`Guild ${guildId} Voice Connection Established`);
        voiceLogger.connection(guildId, 'Player connected to channel and counters updated');
        const { updateVoiceStatus } = require('./voiceStatus');
        updateVoiceStatus(guildId, guildState, client);
        return { success: true, connection: guildState.player };
    } catch (err) {
        voiceLogger.error(guildId, 'Failed Lavalink connection', err, {
            channelId: targetChannel.id,
        });
        if (guildState.player && !guildState.player.destroyed) {
            try {
                await guildState.player.destroy();
            } catch (cleanupErr) {
                voiceLogger.debug(guildId, 'Cleanup after connection failure', { error: cleanupErr.message });
            }
        }
        guildState.player = null;
        guildState.channelId = null;
        guildState.connection = null;
        throw err;
    }
}

module.exports.canJoinVoice = canJoinVoice;
module.exports.incrementVoiceConnections = incrementVoiceConnections;
module.exports.decrementVoiceConnections = decrementVoiceConnections;
module.exports.teardownConnection = teardownConnection;
module.exports.syncVoiceState = syncVoiceState;
module.exports.initializeConnection = initializeConnection;
