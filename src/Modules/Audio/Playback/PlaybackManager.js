// const { getGuildStateById } = require('@state/GuildStateStore');
const { initializeConnection, teardownConnection, syncVoiceState } = require('@modules/Audio/Voice/AudioConnection');
// const { stopPlayer } = require('@modules/Audio/Playback/PlayerEvents');
const { createSurahResource, createRadioResource } = require('@modules/Audio/Playback/AudioResource');
const logger = require('@infrastructure/Logging/Logger');
const { restorePlaybackState } = require('@state/PlaybackUtils');

/**
async function handleJoin(interaction, guildId, guildState, targetChannel) {
    const joinResult = await initializeConnection(guildId, guildState, targetChannel, interaction.guild.voiceAdapterCreator);

    if (!joinResult.success) throw new Error('Failed to establish voice connection');

    const availableReciters = Object.keys(global.reciters || {});
    if (guildState.playbackMode === 'surah') {
        guildState.currentReciter = availableReciters[Math.floor(Math.random() * availableReciters.length)];
        guildState.currentSurah = Math.floor(Math.random() * 114) + 1;
    }
    guildState.isPaused = false;
    guildState.pauseReason = null;

    logger.info(`Guild ${guildId} Bot Joined Voice Channel ${targetChannel.id} Playing Surah ${guildState.currentSurah}`);
    await syncVoiceState(guildId, guildState);
    return true;
}
**/
async function handleJoin(interaction, guildId, guildState, targetChannel) {
    const joinResult = await initializeConnection(guildId, guildState, targetChannel, interaction.guild.voiceAdapterCreator);

    if (!joinResult.success) throw new Error('Failed to establish voice connection');

    restorePlaybackState(guildState);
    logger.info(`Guild ${guildId} Bot Joined Voice Channel ${targetChannel.id}`);

    let resource = null;
    if (guildState.playbackMode === 'surah') {
        resource = await createSurahResource(guildState, guildState.currentSurah - 1);
    } else if (guildState.playbackMode === 'radio' && guildState.currentRadioUrl) {
        resource = await createRadioResource(guildState.currentRadioUrl);
    }

    if (resource) {
        if (guildState.player?.queue) {
            guildState.player.queue.add(resource);
            if (!guildState.player.playing && !guildState.player.paused) {
                await guildState.player.play();
            }
        } else if (guildState.player?.play) {
            guildState.player.play({ track: resource });
        }
        if (guildState.playbackMode === 'surah' && guildState.playedOffset > 0) {
            setTimeout(() => {
                if (guildState.player && !guildState.player.destroyed) {
                    guildState.player.seek(guildState.playedOffset).catch(() => {});
                }
            }, 1000);
        }
    }

    guildState.isPaused = false;
    guildState.pauseReason = null;
    guildState.playbackStartTime = Date.now();

    await syncVoiceState(guildId, guildState);
    return true;
}

async function handleLeave(guildId, guildState) {
    if (!guildState.player || guildState.player.destroyed) {
        throw new Error('Bot not in voice channel');
    }

    // stopPlayer(guildState);
    if (guildState.player.stopPlaying) guildState.player.stopPlaying();
    guildState.isPaused = true;
    guildState.pauseReason = 'manual_leave';

    await teardownConnection(guildId, guildState);
    require('@state/PersistentStateManager').setManualDisconnect(guildId, true);
    await syncVoiceState(guildId, guildState);
    logger.info(`Guild ${guildId} Bot Disconnected From Voice Channel`);
    return true;
}

async function handlePlaybackControl(guildId, guildState, action) {
    // if (!guildState.connection || guildState.connection.destroyed) {
    if (!guildState.player || guildState.player.destroyed) {
        throw new Error('No active voice connection');
    }

    switch (action) {
        case 'next': {
            if (guildState.playbackMode !== 'surah') throw new Error('Next unavailable in radio mode');
            // guildState.player.stopPlaying();
            guildState.currentSurah = guildState.currentSurah < global.surahNames.length ? guildState.currentSurah + 1 : 1;
            guildState.playedOffset = 0;
            const track = await global.createSurahResource(guildState, guildState.currentSurah - 1);
            // const res = await global.createSurahResource(guildState, targetSurah - 1, 0, 0, false);
            if (track) {
                guildState.player.queue.add(track);
                if (!guildState.player.playing && !guildState.player.paused) await guildState.player.play();
            }

            guildState.isPaused = false;
            guildState.pauseReason = null;
            break;
        }

        case 'prev': {
            if (guildState.playbackMode !== 'surah') throw new Error('Previous unavailable in radio mode');
            // guildState.player.stopPlaying();
            guildState.currentSurah = guildState.currentSurah > 1 ? guildState.currentSurah - 1 : global.surahNames.length;
            guildState.playedOffset = 0;
            const track = await global.createSurahResource(guildState, guildState.currentSurah - 1);
            if (track) {
                guildState.player.queue.add(track);
                if (!guildState.player.playing && !guildState.player.paused) await guildState.player.play();
            }
            guildState.isPaused = false;
            guildState.pauseReason = null;
            break;
        }
        case 'pause': {
            /**
            if (guildState.player.state.status === 'playing') {
                guildState.player.pause();
                guildState.isPaused = true;
                guildState.pauseReason = 'manual';
            }
            **/
            if (guildState.player.paused) {
                await guildState.player.resume();
                guildState.isPaused = false;
                guildState.pauseReason = null;
            } else {
                await guildState.player.pause(true);
                guildState.isPaused = true;
                guildState.pauseReason = 'manual';
            }
            const { updateVoiceStatus } = require('@modules/Audio/Voice/VoiceStatus');
            updateVoiceStatus(guildId, guildState, global.client);
            break;
        }
        /**
        case 'resume': {
            if (guildState.player.state.status === 'paused' || guildState.player.state.status === 'idle') {
                let resource;
                if (guildState.playbackMode === 'surah') {
                    resource = await global.createSurahResource(guildState, guildState.currentSurah - 1, 0, 0, false);
                } else if (guildState.currentRadioUrl) {
                    const validatedUrl =
                        global.radioHealthChecker?.getActiveRadioUrl(guildState.currentRadioUrl) || guildState.currentRadioUrl;
                    resource = await global.createRadioResource(validatedUrl, 0);
                }
                if (resource) {
                    guildState.player.play(resource);
                    guildState.isPaused = false;
                    guildState.pauseReason = null;
                }
            }
            break;
        }
        **/
        case 'resume': {
            if (guildState.player.paused) {
                await guildState.player.resume();
                guildState.isPaused = false;
                guildState.pauseReason = null;
            }
            break;
        }
        case 'toggle_radio': {
            try {
                const pos = guildState.player?.position || 0;
                if (guildState.playbackMode === 'surah') {
                    guildState.savedQuranState = {
                        currentSurah: guildState.currentSurah,
                        currentReciter: guildState.currentReciter,
                        currentPage: guildState.currentPage,
                        currentReciterPage: guildState.currentReciterPage,
                        playedOffset: pos,
                    };

                    guildState.playbackMode = 'radio';
                    const sr = guildState.savedRadioState || { currentRadioIndex: 0, currentRadioPage: 0 };
                    guildState.currentRadioIndex = sr.currentRadioIndex;
                    guildState.currentRadioPage = sr.currentRadioPage;
                    if (!global.quranRadios?.length) throw new Error('No radio stations available');
                    guildState.currentRadioUrl = global.quranRadios[guildState.currentRadioIndex]?.url || global.quranRadios[0].url;

                    const track = await global.createRadioResource(guildState.currentRadioUrl);
                    if (track) {
                        guildState.player.queue.add(track);
                        if (!guildState.player.playing && !guildState.player.paused) await guildState.player.play();
                    }
                } else {
                    guildState.savedRadioState = {
                        currentRadioIndex: guildState.currentRadioIndex,
                        currentRadioPage: guildState.currentRadioPage,
                        playedOffset: pos,
                    };

                    guildState.playbackMode = 'surah';
                    const sq = guildState.savedQuranState;
                    const reciters = Object.keys(global.reciters || {});
                    if (sq) {
                        guildState.currentSurah = sq.currentSurah;
                        guildState.currentReciter = sq.currentReciter;
                        guildState.currentPage = sq.currentPage;
                        guildState.currentReciterPage = sq.currentReciterPage;
                        guildState.playedOffset = sq.playedOffset || 0;
                    } else {
                        guildState.currentSurah = 1;
                        guildState.currentReciter = reciters[0] || 'reciter_1_ar';
                        guildState.currentPage = 0;
                        guildState.currentReciterPage = 0;
                        guildState.playedOffset = 0;
                    }

                    const track = await global.createSurahResource(guildState, guildState.currentSurah - 1);
                    if (track) {
                        guildState.player.queue.add(track);
                        if (!guildState.player.playing && !guildState.player.paused) await guildState.player.play();
                    }
                    if (guildState.playedOffset > 0) {
                        setTimeout(() => {
                            if (guildState.player && !guildState.player.destroyed) guildState.player.seek(guildState.playedOffset).catch(() => {});
                        }, 500);
                    }
                }

                guildState.isPaused = false;
                guildState.pauseReason = null;
                if (typeof global.saveRuntimeStates === 'function') await global.saveRuntimeStates();
            } catch (err) {
                logger.error(`Toggle Radio Error Guild: ${guildId} URL: ${guildState.currentRadioUrl} Reason: ${err.message}`);
                guildState.isPaused = true;
                guildState.pauseReason = 'radio_stream_failed';
                if (typeof global.saveRuntimeStates === 'function') await global.saveRuntimeStates();
            }
            break;
        }

        default:
            throw new Error('Unknown playback action');
    }

    guildState.lastActivity = Date.now();
    if (typeof global.saveRuntimeStates === 'function') await global.saveRuntimeStates();
}

module.exports.handleJoin = handleJoin;
module.exports.handleLeave = handleLeave;
module.exports.handlePlaybackControl = handlePlaybackControl;
