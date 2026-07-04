const logger = require('@logging/logger');
const voiceLogger = require('@logging/voiceLogger');

function registerLavalinkEvents(manager, lavalinkNodeConfig, selectBest) {
    manager.nodeManager.on('connect', (node) => {
        const config = lavalinkNodeConfig.get(node.id);
        logger.lavalink(`Lavalink node "${node.id}" connected | ${config?.location || 'Unknown'} ${config?.flag || ''}`);
    });

    manager.nodeManager.on('disconnect', async (node, reason) => {
        logger.debug(`Node "${node.id}" disconnected`, reason?.message || reason);
        const playersToMigrate = Array.from(manager.players.values()).filter((p) => p.node?.id === node.id);

        if (playersToMigrate.length > 0) {
            logger.lavalink(`Starting player failover migration ${playersToMigrate.length} from node ${node.id}`);
            for (const player of playersToMigrate) {
                try {
                    const newNode = selectBest(manager);
                    if (newNode && newNode.id !== node.id) {
                        const guildId = player.guildId;
                        const guildState = global.guildStates?.get(guildId);

                        if (guildState && guildState.channelId) {
                            guildState.failoverActive = true;
                            const currentPosition = player.position || 0;
                            const wasPaused = player.paused || false;
                            const mode = guildState.playbackMode;
                            await player.destroy().catch(() => {});

                            const newPlayer = await manager.createPlayer({
                                guildId: guildId,
                                voiceChannelId: guildState.channelId,
                                textChannelId: null,
                                selfDeaf: true,
                                node: newNode.id,
                            });

                            guildState.player = newPlayer;
                            guildState.connection = newPlayer;
                            await newPlayer.connect();
                            let track = null;

                            if (mode === 'surah') {
                                track = await global.createSurahResource(guildState, guildState.currentSurah - 1);
                            } else if (mode === 'radio' && guildState.currentRadioUrl) {
                                track = await global.createRadioResource(guildState.currentRadioUrl);
                            }

                            if (track) {
                                await newPlayer.play({
                                    track,
                                });
                                if (mode === 'surah' && currentPosition > 0) {
                                    setTimeout(() => {
                                        if (newPlayer && !newPlayer.destroyed) {
                                            newPlayer.seek(currentPosition).catch(() => {});
                                        }
                                    }, 500);
                                }

                                if (wasPaused) {
                                    setTimeout(() => {
                                        if (newPlayer && !newPlayer.destroyed) {
                                            newPlayer.pause(true).catch(() => {});
                                        }
                                    }, 600);
                                }
                            }

                            guildState.failoverActive = false;
                            logger.lavalink(`Player successfully migrated to node "${newNode.id}" guild: ${guildId}`);
                        }
                    } else {
                        logger.warn(`No available node found for player migration guild ${player.guildId}`);
                    }
                } catch (err) {
                    const guildId = player.guildId;
                    const guildState = global.guildStates?.get(guildId);
                    if (guildState) guildState.failoverActive = false;

                    logger.error(`Player migration failed guild ${player.guildId}, node: ${node.id}`, err);
                }
            }
        }
    });

    manager.nodeManager.on('error', (node, error) => {
        const msg = error?.message || '';
        if (msg.includes('Hostname/IP does not match') || msg.includes('Unable to connect') || msg.includes('ECONNREFUSED')) {
            logger.warn(`Node "${node.id}" connection issue: ${msg}`);
        } else {
            logger.error(`Node "${node.id}" error`, error);
        }
    });

    manager.on('playerCreate', (player) => {
        const nodeId = player.node?.id || 'unknown';
        const config = lavalinkNodeConfig.get(nodeId);
        const players = Array.from(manager.players.values()).filter((p) => p.node?.id === nodeId).length;
        logger.lavalink(`Player created | Guild: ${player.guildId} | Node: ${nodeId} | Load: ${players}/${config?.maxPlayers || 'N/A'}`);
    });

    manager.on('playerDisconnect', async (player, payload) => {
        const guildId = player.guildId;
        voiceLogger.connection(guildId, 'Player disconnected from Lavalink', { code: payload?.code });
        const guildState = global.guildStates?.get(guildId);
        // Only nullify if the disconnected player is still the active player to prevent race conditions during node migration
        if (guildState && guildState.player === player) {
            guildState.player = null;
            guildState.connection = null;
            guildState.channelId = null;
            guildState.isPaused = true;
            guildState.pauseReason = 'lavalink_disconnect';

            if (typeof global.saveRuntimeStates === 'function') {
                global.saveRuntimeStates().catch(() => {});
            }
        }
    });
}

module.exports.registerLavalinkEvents = registerLavalinkEvents;
