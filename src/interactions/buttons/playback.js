const { wrapInteraction, safeError } = require('@interactions/flow/deferReply');
const { checkAuthorization, resolveGuildState } = require('@auth/guard');
const { rebuildAndSendControlPanel } = require('@ui/controlPanelBuilder');
// const { createSurahResource, createRadioResource, stopPlayer } = require('@audio');
const { createSurahResource, createRadioResource } = require('@audio');
const logger = require('@logging/logger');

module.exports = {
    customId: 'playback',
    async execute(interaction) {
        await wrapInteraction(
            interaction,
            async () => {
                const { guildId, guildState } = resolveGuildState(interaction);
                const authorized = await checkAuthorization(interaction, interaction.customId);
                if (!authorized) return;

                if (!guildState || !guildState.player) {
                    await safeError(interaction, 'حدث خطأ في حالة التشغيل يرجى استخدام زر الخروج ثم الدخول مرة اخرى');
                    return;
                }
                if (!guildState.connection || guildState.connection.destroyed) {
                    await safeError(interaction, 'الاتصال الصوتي غير متوفر');
                    return;
                }
                if (!guildState.channelId) {
                    await safeError(interaction, 'معرف القناة مفقود');
                    return;
                }

                // Use player.paused boolean for reliable state checking instead of potentially undefined state.status
                const isPaused = guildState.player.paused === true;
                const isPlaying = !isPaused && (guildState.player.state?.status === 'playing' || guildState.player.playing === true);

                if (interaction.customId === 'next' && guildState.playbackMode !== 'surah') {
                    await safeError(interaction, 'السورة التالية غير متاحة في وضع الراديو');
                    return;
                }
                if (interaction.customId === 'prev' && guildState.playbackMode !== 'surah') {
                    await safeError(interaction, 'السورة السابقة غير متاحة في وضع الراديو');
                    return;
                }

                // Native pause: suspends stream without dropping track position
                if (interaction.customId === 'pause') {
                    if (isPlaying) {
                        await guildState.player.pause(true);
                        guildState.isPaused = true;
                        guildState.pauseReason = 'manual';
                        guildState.lastActivity = Date.now();
                        if (typeof global.saveRuntimeStates === 'function') global.saveRuntimeStates();
                        const { updateVoiceStatus } = require('@audio/voiceStatus');
                        await updateVoiceStatus(guildId, guildState, global.client);
                    }
                    await rebuildAndSendControlPanel(interaction, guildState, guildId);
                    return;
                }
                // Native resume: continues from exact paused timestamp
                if (interaction.customId === 'resume') {
                    if (isPaused) {
                        await guildState.player.resume();
                        guildState.isPaused = false;
                        guildState.pauseReason = null;
                        guildState.lastActivity = Date.now();
                        if (typeof global.saveRuntimeStates === 'function') global.saveRuntimeStates();
                        const { updateVoiceStatus } = require('@audio/voiceStatus');
                        await updateVoiceStatus(guildId, guildState, global.client);
                    }
                    await rebuildAndSendControlPanel(interaction, guildState, guildId);
                    return;
                }

                if (interaction.customId === 'next' || interaction.customId === 'prev') {
                    if (typeof guildState.player.stopPlaying === 'function') {
                        guildState.player.stopPlaying();
                    } else {
                        guildState.player.stop();
                    }
                    await new Promise((resolve) => setTimeout(resolve, 150));

                    let targetSurah = guildState.currentSurah;
                    if (interaction.customId === 'next') {
                        targetSurah = guildState.currentSurah < global.surahNames.length ? guildState.currentSurah + 1 : 1;
                    } else {
                        targetSurah = guildState.currentSurah > 1 ? guildState.currentSurah - 1 : global.surahNames.length;
                    }
                    guildState.currentSurah = targetSurah;
                    const audioResource = await createSurahResource(guildState, guildState.currentSurah - 1);
                    if (audioResource) {
                        guildState.player.play({ track: audioResource });
                    }
                    guildState.isPaused = false;
                    guildState.pauseReason = null;
                    guildState.lastActivity = Date.now();
                    if (typeof global.saveRuntimeStates === 'function') global.saveRuntimeStates();
                }

                await rebuildAndSendControlPanel(interaction, guildState, guildId);
            },
            { context: { label: 'playback_button', logger } },
        );
    },
};
