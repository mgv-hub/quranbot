const { AudioPlayerStatus } = require('@discordjs/voice');
const logger = require('@logging/logger');
const { createSurahResource } = require('@audio');
const { player_config } = require('@interactions/buttons/sys-config');

async function ensurePlaybackStarted(guildState, guildId) {
    try {
        await new Promise((resolve) => setTimeout(resolve, player_config.PLAYBACK_START_DELAY_MS));

        if (!guildState.connection || guildState.connection.destroyed) {
            logger.warn('Guild ' + guildId + ' Connection Lost During Playback Start');
            return false;
        }

        guildState.connection.subscribe(guildState.player);
        logger.info('Guild ' + guildId + ' Player Subscribed To Connection');

        if (guildState.player.state.status === AudioPlayerStatus.Idle) {
            logger.info('Guild ' + guildId + ' Player Idle After Join Starting Playback');

            if (guildState.playbackMode === 'surah') {
                const audioResource = await createSurahResource(guildState, guildState.currentSurah - 1, 0, 0, false);
                // guildState.player.play(audioResource);
                if (!audioResource) throw new Error('Audio resource creation returned undefined');
                guildState.player.play({ track: audioResource });
                guildState.isPaused = false;
                guildState.pauseReason = null;
            } else if (guildState.currentRadioUrl) {
                const { createRadioResource } = require('@audio');
                // const radioResource = await createRadioResource(guildState.currentRadioUrl, 0);
                // if (!radioResource) throw new Error('Radio resource creation returned undefined');
                let attempts = 0;
                let radioResource = null;
                while (!radioResource && attempts < Math.min(3, global.quranRadios?.length || 0)) {
                    try {
                        radioResource = await createRadioResource(guildState.currentRadioUrl);
                    } catch (e) {
                        attempts++;
                        const nextIdx = (guildState.currentRadioIndex + attempts) % (global.quranRadios?.length || 1);
                        guildState.currentRadioIndex = nextIdx;
                        guildState.currentRadioUrl = global.quranRadios?.[nextIdx]?.url;
                        guildState.currentRadioPage = Math.floor(nextIdx / 25);
                    }
                }
                if (!radioResource) throw new Error('Radio stream invalid after retries');
                guildState.player.play({ track: radioResource });
                guildState.isPaused = false;
                guildState.pauseReason = null;
            }

            logger.info('Guild ' + guildId + ' Playback Started Successfully');
            return true;
        }

        return true;
    } catch (error) {
        logger.error('Guild ' + guildId + ' Ensure Playback Failed', error);
        if (guildState.playbackMode === 'radio' && !guildState.savedRadioState) {
            guildState.savedRadioState = {
                currentRadioIndex: guildState.currentRadioIndex || 0,
                currentRadioPage: guildState.currentRadioPage || 0,
            };
        }
        guildState.playbackMode = 'surah';
        return false;
    }
}

async function startPlayback(guildState, guildId) {
    try {
        if (guildState.playbackMode === 'surah') {
            const audioResource = await createSurahResource(guildState, guildState.currentSurah - 1, 0, 0, false);
            if (!audioResource) {
                throw new Error('Failed to fetch surah from Lavalink');
            }

            guildState.player.play({ track: audioResource });
        } else if (guildState.currentRadioUrl) {
            const { createRadioResource } = require('@audio');
            let attempts = 0;
            let radioResource = null;
            while (!radioResource && attempts < Math.min(3, global.quranRadios?.length || 0)) {
                try {
                    radioResource = await createRadioResource(guildState.currentRadioUrl);
                } catch (e) {
                    attempts++;
                    const nextIdx = (guildState.currentRadioIndex + attempts) % (global.quranRadios?.length || 1);
                    guildState.currentRadioIndex = nextIdx;
                    guildState.currentRadioUrl = global.quranRadios?.[nextIdx]?.url;
                    guildState.currentRadioPage = Math.floor(nextIdx / 25);
                }
            }
            if (!radioResource) {
                throw new Error('Failed to fetch radio stream from Lavalink');
            }
            guildState.player.play({ track: radioResource });
        }

        guildState.isPaused = false;
        guildState.pauseReason = null;
        guildState.lastActivity = Date.now();
        return true;
    } catch (error) {
        logger.error('Guild ' + guildId + ' Start Playback Failed', error);
        if (guildState.playbackMode === 'radio' && !guildState.savedRadioState) {
            guildState.savedRadioState = {
                currentRadioIndex: guildState.currentRadioIndex || 0,
                currentRadioPage: guildState.currentRadioPage || 0,
            };
        }
        guildState.playbackMode = 'surah';
        return false;
    }
}

module.exports.ensurePlaybackStarted = ensurePlaybackStarted;
module.exports.startPlayback = startPlayback;
