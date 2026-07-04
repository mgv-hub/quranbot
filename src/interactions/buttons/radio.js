const { wrapInteraction, safeError } = require('@interactions/flow/deferReply');
const { checkAuthorization, resolveGuildState } = require('@auth/guard');
const { rebuildAndSendControlPanel } = require('@ui/controlPanelBuilder');
const { createRadioResource, createSurahResource, stopPlayer } = require('@audio');
const logger = require('@logging/logger');
const { emoji, gif } = require('@helpers/emojis');

module.exports = {
    customId: 'radio',
    async execute(interaction) {
        await wrapInteraction(
            interaction,
            async () => {
                const { guildId, guildState } = resolveGuildState(interaction);
                const authorized = await checkAuthorization(interaction, interaction.customId);
                if (!authorized) return;

                if (interaction.customId === 'toggle_radio') {
                    /**
                    if (guildState.player.state.status === 'playing') stopPlayer(guildState);
                    if (guildState.playbackMode === 'surah') {
                        guildState.playbackMode = 'radio';
                        guildState.currentRadioIndex = guildState.currentRadioIndex ?? 0;
                        guildState.currentRadioUrl = global.quranRadios[guildState.currentRadioIndex]?.url ?? global.quranRadios[0]?.url;
                        guildState.currentRadioPage = Math.floor(guildState.currentRadioIndex / 25);

                        if (guildState.currentRadioUrl) {
                            const radioUrl = guildState.currentRadioUrl;
                            if (!radioUrl) {
                                guildState.playbackMode = 'surah';
                                const surahAudio = await createSurahResource(guildState, guildState.currentSurah - 1);
                                guildState.player.play(surahAudio);
                            } else {
                                const radioAudio = await createRadioResource(radioUrl);
                                guildState.player.play(radioAudio);
                  **/
                    try {
                        const currentPosition = guildState.player && !guildState.player.destroyed ? guildState.player.position || 0 : 0;
                        if (guildState.player && !guildState.player.destroyed) {
                            guildState.player.stopPlaying();
                        }
                        if (guildState.playbackMode === 'surah') {
                            guildState.savedQuranState = {
                                currentSurah: guildState.currentSurah,
                                currentReciter: guildState.currentReciter,
                                currentPage: guildState.currentPage,
                                currentReciterPage: guildState.currentReciterPage,
                                playedOffset: currentPosition,
                            };
                            guildState.playbackMode = 'radio';
                            // guildState.currentRadioIndex = guildState.currentRadioIndex ?? 0;
                            const savedRadio = guildState.savedRadioState || { currentRadioIndex: 0, currentRadioPage: 0 };
                            guildState.currentRadioIndex = savedRadio.currentRadioIndex;
                            guildState.currentRadioPage = savedRadio.currentRadioPage;
                            if (!global.quranRadios || global.quranRadios.length === 0) {
                                throw new Error('No radio stations loaded');
                            }

                            guildState.currentRadioUrl =
                                global.quranRadios[guildState.currentRadioIndex]?.url ?? global.quranRadios[0]?.url;

                            let radioTrack = null;
                            let attempts = 0;
                            let lastError = null;
                            const maxAttempts = Math.min(3, global.quranRadios.length);
                            while (!radioTrack && attempts < maxAttempts) {
                                try {
                                    radioTrack = await createRadioResource(guildState.currentRadioUrl);
                                } catch (e) {
                                    lastError = e;
                                    logger.warn(
                                        `Radio stream failed Guild: ${guildId} URL: ${guildState.currentRadioUrl} Reason: ${e.message}`,
                                    );
                                    attempts++;
                                    const nextIdx = (guildState.currentRadioIndex + attempts) % global.quranRadios.length;
                                    guildState.currentRadioIndex = nextIdx;
                                    guildState.currentRadioPage = Math.floor(nextIdx / 25);
                                    guildState.currentRadioUrl = global.quranRadios[nextIdx]?.url;
                                }
                            }
                            if (!radioTrack) {
                                //   logger.warn(`Radio stream unavailable for guild ${guildId}, switching to surah mode`);
                                //   guildState.playbackMode = 'surah';
                                //   guildState.currentRadioUrl = null;
                                //   const availableReciters = Object.keys(global.reciters || {});
                                //   if (guildState.savedQuranState) {
                                //       guildState.currentSurah = guildState.savedQuranState.currentSurah;
                                //       guildState.currentReciter = guildState.savedQuranState.currentReciter;
                                //       guildState.currentPage = guildState.savedQuranState.currentPage;
                                //       guildState.currentReciterPage = guildState.savedQuranState.currentReciterPage;
                                //       guildState.playedOffset = guildState.savedQuranState.playedOffset || 0;
                                //   } else {
                                //       guildState.currentSurah = 1;
                                //       guildState.currentReciter = availableReciters?.[0] || 'reciter_1_ar';
                                //       guildState.currentPage = 0;
                                //       guildState.currentReciterPage = 0;
                                //       guildState.playedOffset = 0;
                                const failedUrl = guildState.currentRadioUrl;
                                logger.error(
                                    `All radio streams unavailable | Guild: ${guildId} | Last URL: ${failedUrl} | Reason: ${lastError?.message || 'Unknown'}`,
                                );

                                if (guildState.player && !guildState.player.destroyed) {
                                    guildState.player.stopPlaying();
                                }

                                await interaction
                                    .followUp({
                                        content: `${emoji.close} فشل تشغيل الراديو، اختر رابط آخر.`,
                                        flags: 64,
                                    })
                                    .catch(() => {});
                                await rebuildAndSendControlPanel(interaction, guildState, guildId);
                                return;
                            }

                            if (!guildState.player || guildState.player.destroyed) {
                                await rebuildAndSendControlPanel(interaction, guildState, guildId);
                                return;
                            }
                            guildState.player.play({ track: radioTrack });
                        } else {
                            guildState.savedRadioState = {
                                currentRadioIndex: guildState.currentRadioIndex,
                                currentRadioPage: guildState.currentRadioPage,
                                playedOffset: currentPosition,
                            };
                            guildState.playbackMode = 'surah';
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
                            if (guildState.currentSurah < 1 || guildState.currentSurah > 114) {
                                guildState.currentSurah = 1;
                            }
                            const surahTrack = await createSurahResource(guildState, guildState.currentSurah - 1);
                            if (!surahTrack) throw new Error('Failed to fetch surah track');
                            if (!guildState.player || guildState.player.destroyed) {
                                await rebuildAndSendControlPanel(interaction, guildState, guildId);
                                return;
                            }
                            guildState.player.play({ track: surahTrack });
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
                        await rebuildAndSendControlPanel(interaction, guildState, guildId);
                    } catch (err) {
                        logger.error(`Toggle Radio Error Guild: ${guildId} URL: ${guildState.currentRadioUrl} Reason: ${err.message}`);
                        guildState.isPaused = true;
                        guildState.pauseReason = 'radio_stream_failed';

                        if (typeof global.saveRuntimeStates === 'function') await global.saveRuntimeStates();
                        await rebuildAndSendControlPanel(interaction, guildState, guildId);
                    }
                } else if (interaction.customId === 'prev_radio_page' || interaction.customId === 'next_radio_page') {
                    if (guildState.playbackMode !== 'radio') {
                        return await safeError(interaction, 'تصفح صفحات الراديو غير متاح في وضع السور');
                    }
                    const totalRadioPages = Math.ceil(global.quranRadios.length / 25);
                    const currentPage = guildState.currentRadioPage || 0;
                    if (interaction.customId === 'prev_radio_page' && currentPage > 0) {
                        guildState.currentRadioPage = currentPage - 1;
                    } else if (interaction.customId === 'next_radio_page' && currentPage < totalRadioPages - 1) {
                        guildState.currentRadioPage = currentPage + 1;
                    }
                    guildState.currentRadioIndex = guildState.currentRadioPage * 25;
                    global.saveRuntimeStates();
                }

                await rebuildAndSendControlPanel(interaction, guildState, guildId);
            },
            { context: { label: 'radio_button', logger } },
        );
    },
};
