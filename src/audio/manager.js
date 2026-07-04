// const { getGuildStateById } = require('../state/guild-state-store');
const { initializeConnection, teardownConnection, syncVoiceState } = require('./connection');
// const { stopPlayer } = require('./player');
const { createSurahResource, createRadioResource } = require('./resource');
const logger = require('@logging/logger');

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

    const availableReciters = Object.keys(global.reciters || {});
    if (guildState.playbackMode === 'surah') {
        const savedQuran = guildState.savedQuranState;
        if (savedQuran) {
            guildState.currentReciter = savedQuran.currentReciter;
            guildState.currentSurah = savedQuran.currentSurah;
            guildState.currentPage = savedQuran.currentPage;
            guildState.currentReciterPage = savedQuran.currentReciterPage;
            guildState.playedOffset = savedQuran.playedOffset || 0;
        } else {
            guildState.currentReciter = availableReciters[Math.floor(Math.random() * availableReciters.length)];
            guildState.currentSurah = Math.floor(Math.random() * 114) + 1;
            guildState.playedOffset = 0;
        }
    } else {
        const savedRadio = guildState.savedRadioState;
        if (savedRadio) {
            guildState.currentRadioIndex = savedRadio.currentRadioIndex;
            guildState.currentRadioPage = savedRadio.currentRadioPage;
        } else {
            guildState.currentRadioIndex = 0;
            guildState.currentRadioPage = 0;
        }
        if (!guildState.currentRadioUrl && global.quranRadios?.[guildState.currentRadioIndex]) {
            guildState.currentRadioUrl = global.quranRadios[guildState.currentRadioIndex].url;
        }
    }
    guildState.isPaused = false;
    guildState.pauseReason = null;

    logger.info(`Guild ${guildId} Bot Joined Voice Channel ${targetChannel.id} Playing Surah ${guildState.currentSurah}`);

    const track =
        guildState.playbackMode === 'surah'
            ? await createSurahResource(guildState, guildState.currentSurah - 1)
            : await createRadioResource(guildState.currentRadioUrl);

    if (track) {
        guildState.player.play({ track: track });
        if (guildState.playbackMode === 'surah' && guildState.playedOffset > 0) {
            setTimeout(() => {
                if (guildState.player && !guildState.player.destroyed) {
                    guildState.player.seek(guildState.playedOffset).catch(() => {});
                }
            }, 500);
        }
    }
    await syncVoiceState(guildId, guildState);
    return true;
}

async function handleLeave(guildId, guildState) {
    if (!guildState.player || guildState.player.destroyed) {
        throw new Error('Bot not in voice channel');
    }

    // stopPlayer(guildState);
    guildState.player.stopPlaying();
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
            let targetSurah = guildState.currentSurah < global.surahNames.length ? guildState.currentSurah + 1 : 1;
            guildState.currentSurah = targetSurah;
            // guildState.player.stopPlaying();
            guildState.playedOffset = 0;
            const track = await global.createSurahResource(guildState, targetSurah - 1);
            // const res = await global.createSurahResource(guildState, targetSurah - 1, 0, 0, false);
            if (track) {
                guildState.player.queue.add(track);
                if (!guildState.player.playing && !guildState.player.paused) {
                    await guildState.player.play();
                }
            }
            // guildState.player.play(res);
            guildState.isPaused = false;
            guildState.pauseReason = null;
            break;
        }

        case 'prev': {
            if (guildState.playbackMode !== 'surah') throw new Error('Previous unavailable in radio mode');
            let targetSurah = guildState.currentSurah > 1 ? guildState.currentSurah - 1 : global.surahNames.length;
            guildState.currentSurah = targetSurah;
            // guildState.player.stopPlaying();
            guildState.playedOffset = 0;
            const track = await global.createSurahResource(guildState, targetSurah - 1);
            if (track) {
                guildState.player.queue.add(track);
                if (!guildState.player.playing && !guildState.player.paused) {
                    await guildState.player.play();
                }
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
            const { updateVoiceStatus } = require('./voiceStatus');
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
                const currentPosition = guildState.player && guildState.player.position ? guildState.player.position : 0;
                if (guildState.playbackMode === 'surah') {
                    guildState.savedQuranState = {
                        currentSurah: guildState.currentSurah,
                        currentReciter: guildState.currentReciter,
                        currentPage: guildState.currentPage,
                        currentReciterPage: guildState.currentReciterPage,
                        playedOffset: currentPosition,
                    };
                    /**
                    const savedRadio = guildState.savedRadioState || { currentRadioIndex: 0, currentRadioPage: 0 };
                    guildState.currentRadioIndex = savedRadio.currentRadioIndex;
                    guildState.currentRadioPage = savedRadio.currentRadioPage;
                    if (!global.quranRadios || global.quranRadios.length === 0) {
                        throw new Error('No radio stations available');
                    }
                    guildState.currentRadioUrl = global.quranRadios[guildState.currentRadioIndex]?.url || global.quranRadios[0].url;
                    **/
                    guildState.playbackMode = 'radio';
                    // guildState.currentRadioIndex = guildState.currentRadioIndex ?? 0;
                    // guildState.currentRadioPage = Math.floor(guildState.currentRadioIndex / 25);
                    /**
                    const validatedUrl = global.radioHealthChecker?.getActiveRadioUrl(guildState.currentRadioUrl);
                    if (!validatedUrl) {
                        guildState.playbackMode = 'surah';
                        const surahRes = await global.createSurahResource(guildState, guildState.currentSurah - 1, 0, 0, false);
                        guildState.player.play(surahRes);
                    } else {
                        guildState.player.stop();
                        const radioRes = await global.createRadioResource(validatedUrl, 0);
                        guildState.player.play(radioRes);
                    }
                    **/
                    const savedRadio = guildState.savedRadioState || { currentRadioIndex: 0, currentRadioPage: 0 };
                    guildState.currentRadioIndex = savedRadio.currentRadioIndex;
                    guildState.currentRadioPage = savedRadio.currentRadioPage;
                    if (!global.quranRadios || global.quranRadios.length === 0) {
                        throw new Error('No radio stations available');
                    }
                    guildState.currentRadioUrl = global.quranRadios[guildState.currentRadioIndex]?.url || global.quranRadios[0].url;

                    const track = await global.createRadioResource(guildState.currentRadioUrl);
                    if (track) {
                        guildState.player.queue.add(track);
                        if (!guildState.player.playing && !guildState.player.paused) {
                            await guildState.player.play();
                        }
                    }
                } else {
                    guildState.savedRadioState = {
                        currentRadioIndex: guildState.currentRadioIndex,
                        currentRadioPage: guildState.currentRadioPage,
                        playedOffset: currentPosition,
                    };
                    /*
                    const availableReciters = Object.keys(global.reciters || {});
                    const savedQuran = guildState.savedQuranState || {
                        currentSurah: 1,
                        currentReciter: availableReciters?.[0] || 'reciter_1_ar',
                        currentPage: 0,
                        currentReciterPage: 0,
                    };
                    guildState.currentSurah = savedQuran.currentSurah;
                    guildState.currentReciter = savedQuran.currentReciter;
                    guildState.currentPage = savedQuran.currentPage;
                    guildState.currentReciterPage = savedQuran.currentReciterPage;
                    guildState.currentRadioUrl = null;
                    **/

                    guildState.playbackMode = 'surah';
                    // guildState.player.stop();
                    // guildState.player.stopPlaying();
                    const savedQuran = guildState.savedQuranState;
                    const availableReciters = Object.keys(global.reciters || {});

                    if (savedQuran) {
                        guildState.currentSurah = savedQuran.currentSurah;
                        guildState.currentReciter = savedQuran.currentReciter;
                        guildState.currentPage = savedQuran.currentPage;
                        guildState.currentReciterPage = savedQuran.currentReciterPage;
                        guildState.playedOffset = savedQuran.playedOffset || 0;
                    } else {
                        guildState.currentSurah = 1;
                        guildState.currentReciter = availableReciters?.[0] || 'reciter_1_ar';
                        guildState.currentPage = 0;
                        guildState.currentReciterPage = 0;
                        guildState.playedOffset = 0;
                    }

                    const track = await global.createSurahResource(guildState, guildState.currentSurah - 1);
                    if (track) {
                        guildState.player.queue.add(track);
                        if (!guildState.player.playing && !guildState.player.paused) {
                            await guildState.player.play();
                        }
                    }

                    if (guildState.playedOffset > 0 && guildState.player && !guildState.player.destroyed) {
                        setTimeout(() => {
                            if (guildState.player && !guildState.player.destroyed) {
                                guildState.player.seek(guildState.playedOffset).catch(() => {});
                            }
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
