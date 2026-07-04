const { wrapInteraction, safeError } = require('@interactions/flow/deferReply');
const { checkAuthorization, resolveGuildState } = require('@auth/guard');
const { rebuildAndSendControlPanel } = require('@ui/controlPanelBuilder');
const { createSurahResource, isSurahAvailable, getAvailableSurahCount } = require('@audio');
const logger = require('@logging/logger');
const persistentState = require('@state/PersistentStateManager');

module.exports = {
    customId: 'select_surah',
    async execute(interaction) {
        await wrapInteraction(
            interaction,
            async () => {
                const { guildId, guildState } = resolveGuildState(interaction);
                const authorized = await checkAuthorization(interaction, interaction.customId);
                if (!authorized) return;
                if (!guildState.player || guildState.player.destroyed) {
                    await safeError(interaction, 'البوت غير متصل بأي روم صوتي');
                    return;
                }

                //  if (guildState.playbackMode !== 'surah') {
                //      await safeError(interaction, 'اختيار السورة غير متاح في وضع الراديو');
                //      return;
                //  }
                if (!global.surahNames) {
                    await safeError(interaction, 'البيانات غير محملة بعد انتظر قليلا');
                    return;
                }

                const selectedSurahNum = parseInt(interaction.values[0]);
                if (selectedSurahNum >= 1 && selectedSurahNum <= global.surahNames.length) {
                    guildState.playbackMode = 'surah';
                    const surahIndex = selectedSurahNum - 1;
                    if (!isSurahAvailable(guildState, surahIndex)) {
                        const availableTotal = getAvailableSurahCount(guildState);
                        const reciterInfo = global.reciters[guildState.currentReciter];
                        const reciterDisplayName = reciterInfo?.name || guildState.currentReciter;

                        await safeError(
                            interaction,
                            'السورة غير متاحة القارئ الحالي ' +
                                reciterDisplayName +
                                ' لا يملك هذه السورة هذا القارئ لديه ' +
                                availableTotal +
                                ' سورة فقط',
                        );

                        return;
                    }
                    guildState.currentSurah = selectedSurahNum;
                    // guildState.disconnectAfterCurrentTrack = true;
                    try {
                        if (guildState.player.playing || guildState.player.state?.status === 'playing') {
                            guildState.player.stopPlaying();
                        }
                        const audioResource = await createSurahResource(guildState, surahIndex);
                        if (audioResource) {
                            guildState.player.play({ track: audioResource });
                            guildState.isPaused = false;
                            guildState.pauseReason = null;
                            persistentState.updateGuildState(guildId, {
                                currentSurahIndex: guildState.currentSurah - 1,
                                isPaused: false,
                                pauseReason: null,
                                // disconnectAfterCurrentTrack: true,
                            });
                        }
                    } catch (err) {
                        logger.error('Error Playing Surah ' + selectedSurahNum + ' In Guild ' + guildId, err);
                        await safeError(interaction, 'Error playing surah ' + err.message);
                        return;
                    }
                }
                await rebuildAndSendControlPanel(interaction, guildState, guildId);
            },
            { context: { label: 'surah_menu', logger } },
        );
    },
};
