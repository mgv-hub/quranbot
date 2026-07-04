const logger = require('@logging/logger');
// const { AudioPlayerStatus } = require('@discordjs/voice');
const { ChannelType } = require('discord.js');
const { getGuildState } = require('../state/GuildStateManager');
const persistentStateManager = require('@state/PersistentStateManager');
// const voiceManager = require('@audio/voice-connection');
const { initializeConnection, syncVoiceState, createSurahResource, createRadioResource } = require('@audio');
let restorationActive = false;

async function restoreGuildStates(client, activeGuildIds) {
    const setups = global.setupGuilds || {};
    const guildsToRestoreSet = new Set();

    for (const gid of activeGuildIds) {
        if (setups[gid]?.voiceChannelId) {
            guildsToRestoreSet.add(gid);
        } else {
            const stored = persistentStateManager.getGuildState(gid);

            if (stored?.voiceChannelId) {
                guildsToRestoreSet.add(gid);
                if (!setups[gid]) setups[gid] = {};
                setups[gid].voiceChannelId = stored.voiceChannelId;
            }
        }
    }

    const guildsToRestore = Array.from(guildsToRestoreSet);
    if (restorationActive) return;
    if (guildsToRestore.length === 0) {
        return;
    }
    restorationActive = true;
    let successCount = 0;
    let failureCount = 0;
    for (let index = 0; index < guildsToRestore.length; index++) {
        const guildId = guildsToRestore[index];
        setTimeout(async () => {
            try {
                const guild = client.guilds.cache.get(guildId);
                if (!guild) return;
                const setupData = setups[guildId];
                if (!setupData || !setupData.voiceChannelId) {
                    failureCount++;
                    return;
                }
                const guildState = getGuildState(guildId);
                const isConnected = guildState.player && !guildState.player.destroyed && guildState.channelId;
                if (!isConnected) {
                    let targetChannel = guild.channels.cache.get(setupData.voiceChannelId);
                    if (!targetChannel) {
                        targetChannel = await guild.channels.fetch(setupData.voiceChannelId).catch(() => null);
                    }
                    if (targetChannel && targetChannel.type === ChannelType.GuildVoice) {
                        logger.info(`Guild ${guildId} Re-establishing Lavalink Connection...`);
                        const joinResult = await initializeConnection(guildId, guildState, targetChannel, guild.voiceAdapterCreator);
                        if (!joinResult.success) {
                            logger.error(`Failed To Re-connect Guild ${guildId}`);
                            failureCount++;
                            return;
                        }
                        logger.info(`Guild ${guildId} Connection Re-established`);
                    }
                }
                // guildState.currentReciter = storedState.currentReciter;
                // guildState.currentSurah = storedState.currentSurahIndex + 1;
                // guildState.playbackMode = storedState.playbackMode;
                // guildState.playbackMode = 'radio';
                // guildState.controlMode = 'everyone';

                const storedState = persistentStateManager.getGuildState(guildId);
                // if (storedState?.currentRadioIndex !== undefined && global.quranRadios?.[storedState.currentRadioIndex]) {
                //     guildState.currentRadioIndex = storedState.currentRadioIndex;
                //     guildState.currentRadioUrl = global.quranRadios[storedState.currentRadioIndex].url;
                // } else if (global.quranRadios && global.quranRadios.length > 0) {
                //     guildState.currentRadioIndex = 0;
                //     guildState.currentRadioUrl = global.quranRadios[0].url;
                guildState.playbackMode = storedState?.playbackMode || 'radio';
                guildState.controlMode = storedState?.controlMode || 'everyone';

                if (guildState.playbackMode === 'surah') {
                    const saved = guildState.savedQuranState;
                    if (saved) {
                        guildState.currentReciter = saved.currentReciter || storedState?.currentReciter || 'reciter_1_ar';
                        guildState.currentSurah = saved.currentSurah || (storedState?.currentSurahIndex || 0) + 1;
                        guildState.currentPage = saved.currentPage || 0;
                        guildState.currentReciterPage = saved.currentReciterPage || 0;
                        guildState.playedOffset = saved.playedOffset || 0;
                    } else {
                        guildState.currentReciter = storedState?.currentReciter || 'reciter_1_ar';
                        guildState.currentSurah = (storedState?.currentSurahIndex || 0) + 1;
                        guildState.currentPage = 0;
                        guildState.currentReciterPage = 0;
                        guildState.playedOffset = storedState?.playedOffset || 0;
                    }
                } else {
                    const saved = guildState.savedRadioState;
                    if (saved && global.quranRadios?.[saved.currentRadioIndex]) {
                        guildState.currentRadioIndex = saved.currentRadioIndex;
                        guildState.currentRadioPage = saved.currentRadioPage;
                        guildState.currentRadioUrl = saved.currentRadioUrl || global.quranRadios[saved.currentRadioIndex].url;
                        guildState.playedOffset = saved.playedOffset || 0;
                    } else if (global.quranRadios && global.quranRadios.length > 0) {
                        guildState.currentRadioIndex = storedState?.currentRadioIndex ?? 0;
                        guildState.currentRadioPage = Math.floor(guildState.currentRadioIndex / 25);
                        guildState.currentRadioUrl = global.quranRadios[guildState.currentRadioIndex]?.url;
                        guildState.playedOffset = 0;
                    }
                }
                // guildState.currentRadioPage = Math.floor(guildState.currentRadioIndex / 25);
                guildState.isPaused = false;
                guildState.pauseReason = null;
                // guildState.playedOffset = storedState?.playedOffset || 0;
                persistentStateManager.setManualDisconnect(guildId, false);
                await syncVoiceState(guildId, guildState);
                let radioFailed = false;
                if (guildState.playbackMode === 'radio' && guildState.currentRadioUrl) {
                    try {
                        const audioResource = await createRadioResource(guildState.currentRadioUrl);
                        if (audioResource) {
                            guildState.player.play({ track: audioResource });
                            guildState.isPaused = false;
                            guildState.playbackStartTime = Date.now();
                            logger.info(`Started Playback On Restore For Guild ${guildId}`);
                        } else {
                            radioFailed = true;
                        }
                    } catch (radioError) {
                        radioFailed = true;
                    }
                }
                if (guildState.playbackMode !== 'radio' || radioFailed) {
                    guildState.playbackMode = 'surah';

                    try {
                        const audioResource = await createSurahResource(guildState, guildState.currentSurah - 1);
                        if (audioResource) {
                            guildState.player.play({ track: audioResource });
                            guildState.isPaused = false;
                            guildState.playbackStartTime = Date.now();

                            if (guildState.playedOffset > 0) {
                                setTimeout(() => {
                                    if (guildState.player && !guildState.player.destroyed) {
                                        guildState.player.seek(guildState.playedOffset).catch(() => {});
                                    }
                                }, 1000);
                            }
                        }
                    } catch (surahError) {
                        guildState.isPaused = true;
                    }
                }
                successCount++;
                logger.info(`Restored State For Guild ${guildId} Successfully`);
            } catch (error) {
                if (error.message && error.message.includes('maximum player capacity')) {
                    logger.info(`Lavalink nodes at capacity, scheduling delayed retry for guild ${guildId}`);
                    setTimeout(async () => {
                        try {
                            const setupData = global.setupGuilds[guildId];
                            if (!setupData?.voiceChannelId) return;
                            const guild = client.guilds.cache.get(guildId);
                            if (!guild) return;
                            const guildState = getGuildState(guildId);
                            const targetChannel =
                                guild.channels.cache.get(setupData.voiceChannelId) ||
                                (await guild.channels.fetch(setupData.voiceChannelId).catch(() => null));
                            if (targetChannel && targetChannel.type === ChannelType.GuildVoice && !guildState.player?.destroyed) {
                                await initializeConnection(guildId, guildState, targetChannel, guild.voiceAdapterCreator);
                                logger.info(`Delayed restoration successful for guild ${guildId}`);
                                successCount++;
                            }
                        } catch {}
                    }, 10000);
                } else {
                    logger.error(`Error Restoring Guild ${guildId}`, error);
                    failureCount++;
                }
            } finally {
                if (successCount + failureCount === guildsToRestore.length) {
                    logger.info(`State Restoration Complete ${successCount} Restored ${failureCount} Failed Or Skipped`);
                    restorationActive = false;
                }
            }
        }, index * 1000);
    }
}
module.exports.restoreGuildStates = restoreGuildStates;
