const logger = require('@logging/logger');
const voiceLogger = require('@logging/voiceLogger');
const { ChannelType } = require('discord.js');
// const { AudioPlayerStatus } = require('@discordjs/voice');
const { getGuildStateById } = require('@state/guild-state-store');
const persistentStateManager = require('@state/PersistentStateManager');
const { initializeConnection, syncVoiceState } = require('@audio');

async function recoverVoiceConnection(guild, fixedSetupData, guildId) {
    voiceLogger.recovery(guildId, 'Starting voice recovery', {
        voiceChannelId: fixedSetupData?.voiceChannelId,
        hasSetupData: !!fixedSetupData,
    });
    if (!fixedSetupData || !fixedSetupData.voiceChannelId) {
        const storedState = persistentStateManager.getGuildState(guildId);
        if (storedState?.voiceChannelId) {
            fixedSetupData = { ...(fixedSetupData || {}), voiceChannelId: storedState.voiceChannelId };
        } else {
            voiceLogger.recovery(guildId, 'Recovery skipped no voice channel ID in setup');
            return;
        }
    }
    let targetVoiceChannel = null;
    try {
        voiceLogger.recovery(guildId, 'Fetching target voice channel', {
            channelId: fixedSetupData.voiceChannelId,
        });
        targetVoiceChannel =
            guild.channels.cache.get(fixedSetupData.voiceChannelId) ||
            (await guild.channels.fetch(fixedSetupData.voiceChannelId).catch(() => null));
    } catch (error) {
        voiceLogger.recovery(guildId, 'Failed to fetch voice channel', {
            channelId: fixedSetupData.voiceChannelId,
            error: error.message,
        });
        logger.info(`Guild ${guildId} Voice Channel ${fixedSetupData.voiceChannelId} Not Accessible`);
    }
    if (targetVoiceChannel && targetVoiceChannel.type === ChannelType.GuildVoice) {
        voiceLogger.recovery(guildId, 'Target voice channel found', {
            channelId: targetVoiceChannel.id,
            channelName: targetVoiceChannel.name,
        });
        const guildState = getGuildStateById(guildId);
        try {
            voiceLogger.recovery(guildId, 'Attempting voice reconnection');
            await initializeConnection(guildId, guildState, targetVoiceChannel, guild.voiceAdapterCreator);
            voiceLogger.recovery(guildId, 'Voice connection re-established');

            const storedState = persistentStateManager.getGuildState(guildId);

            guildState.playbackMode = storedState?.playbackMode || 'radio';
            guildState.controlMode = storedState?.controlMode || 'everyone';
            if (guildState.playbackMode === 'radio') {
                const savedRadio = guildState.savedRadioState;
                if (savedRadio && global.quranRadios?.[savedRadio.currentRadioIndex]) {
                    guildState.currentRadioIndex = savedRadio.currentRadioIndex;
                    guildState.currentRadioPage = savedRadio.currentRadioPage;
                    guildState.currentRadioUrl = savedRadio.currentRadioUrl || global.quranRadios[savedRadio.currentRadioIndex].url;
                    guildState.playedOffset = savedRadio.playedOffset || 0;
                } else if (global.quranRadios && global.quranRadios.length > 0) {
                    guildState.currentRadioIndex = 0;
                    guildState.currentRadioPage = 0;
                    guildState.currentRadioUrl = global.quranRadios[0].url;
                    guildState.playedOffset = 0;
                }
            } else {
                const savedQuran = guildState.savedQuranState;
                const availableReciters = Object.keys(global.reciters || {});
                if (savedQuran) {
                    guildState.currentReciter = savedQuran.currentReciter;
                    guildState.currentSurah = savedQuran.currentSurah;
                    guildState.currentPage = savedQuran.currentPage;
                    guildState.currentReciterPage = savedQuran.currentReciterPage;
                    guildState.playedOffset = savedQuran.playedOffset || 0;
                } else {
                    guildState.currentReciter = availableReciters.length > 0 ? availableReciters[0] : 'reciter_1_ar';
                    guildState.currentSurah = 1;
                    guildState.currentPage = 0;
                    guildState.currentReciterPage = 0;
                    guildState.playedOffset = storedState?.playedOffset || 0;
                }
            }
            guildState.isPaused = false;
            guildState.pauseReason = null;
            guildState.playbackStartTime = Date.now();
            guildState.lastActivity = Date.now();

            guildState.currentRadioPage = Math.floor(guildState.currentRadioIndex / 25);
            voiceLogger.recovery(guildId, 'Restored playback state', {
                mode: guildState.playbackMode,
                radioUrl: guildState.currentRadioUrl,
            });
            try {
                let trackToPlay = null;
                if (guildState.playbackMode === 'radio' && guildState.currentRadioUrl) {
                    trackToPlay = await global.createRadioResource(guildState.currentRadioUrl);
                }
                if (!trackToPlay) {
                    voiceLogger.warn(guildId, 'Radio resource failed during recovery, falling back to surah');
                    guildState.playbackMode = 'surah';
                    const availableReciters = Object.keys(global.reciters || {});
                    guildState.currentReciter = availableReciters.length > 0 ? availableReciters[0] : 'reciter_1_ar';
                    guildState.currentSurah = 1;
                    trackToPlay = await global.createSurahResource(guildState, guildState.currentSurah - 1);
                }
                if (trackToPlay) {
                    guildState.player.play({ track: trackToPlay });
                    guildState.isPaused = false;
                    guildState.pauseReason = null;
                    voiceLogger.recovery(guildId, 'Started playback after recovery');

                    if (guildState.playbackMode === 'surah' && guildState.playedOffset > 0) {
                        setTimeout(() => {
                            if (guildState.player && !guildState.player.destroyed) {
                                guildState.player.seek(guildState.playedOffset).catch(() => {});
                            }
                        }, 1500);
                    }
                }
            } catch (playbackError) {
                voiceLogger.error(guildId, 'Voice recovery completed successfully', playbackError);
                guildState.isPaused = true;
                guildState.pauseReason = 'recovery_playback_failed';
            }
            await syncVoiceState(guildId, guildState);
            voiceLogger.recovery(guildId, 'Voice recovery completed successfully');
        } catch (connectionError) {
            voiceLogger.error(guildId, 'Failed to reconnect voice channel', connectionError);
        }
    } else {
        voiceLogger.recovery(guildId, 'Voice channel not found or invalid type', {
            channelFound: !!targetVoiceChannel,
            channelType: targetVoiceChannel?.type,
            expectedType: ChannelType.GuildVoice,
        });
        // logger.info(`Guild ${guildId} Voice Channel Not Found Or Invalid Type Skipping`);
        // const guildState = getGuildStateById(guildId);
        // const storedState = persistentStateManager.getGuildState(guildId);
        // if (guildState) guildState.channelId = null;
        // if (storedState) storedState.voiceChannelId = null;
    }
}

module.exports.recoverVoiceConnection = recoverVoiceConnection;
