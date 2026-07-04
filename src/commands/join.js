const { wrapInteraction, safeError } = require('@interactions/flow/deferReply');
const { resolveGuildState } = require('@auth/guard');
const { initializeConnection, syncVoiceState } = require('@audio');
const { createSurahResource, createRadioResource } = require('@audio');
const logger = require('@logging/logger');
const voiceLogger = require('@logging/voiceLogger');
const coreLoader = require('@bot/bootstrap');

module.exports = {
    async execute(interaction) {
        await wrapInteraction(
            interaction,
            async () => {
                const { guildId, guildState } = resolveGuildState(interaction);
                voiceLogger.connection(guildId, 'Join command executed', {
                    userId: interaction.user.id,
                    channelId: interaction.channelId,
                    guildName: interaction.guild?.name,
                });
                const setupConfig = global.setupGuilds ? global.setupGuilds[guildId] : null;
                if (!setupConfig || !setupConfig.voiceChannelId) {
                    voiceLogger.connection(guildId, 'Join failed - no setup config', {
                        hasSetup: !!setupConfig,
                        voiceChannelId: setupConfig?.voiceChannelId,
                    });
                    await safeError(interaction, 'لم يتم اعداد فئة القرآن بعد استخدم امر الاعداد اولا');
                    return;
                }
                const targetChannelId = setupConfig.voiceChannelId;
                voiceLogger.connection(guildId, 'Fetching target voice channel', {
                    targetChannelId,
                });
                const voiceChannel =
                    interaction.guild.channels.cache.get(targetChannelId) ||
                    (await interaction.guild.channels.fetch(targetChannelId).catch(() => null));
                if (!voiceChannel || voiceChannel.type !== coreLoader.ChannelType.GuildVoice) {
                    voiceLogger.connection(guildId, 'Join failed - invalid channel', {
                        channelFound: !!voiceChannel,
                        channelType: voiceChannel?.type,
                        expectedType: coreLoader.ChannelType.GuildVoice,
                    });
                    await safeError(interaction, 'القناة الصوتية المعدة غير موجودة او غير صالحة يرجى اعادة الاعداد');
                    return;
                }
                const botPerms = voiceChannel.permissionsFor(interaction.guild.members.me);
                if (
                    !botPerms.has(coreLoader.PermissionsBitField.Flags.Connect) ||
                    !botPerms.has(coreLoader.PermissionsBitField.Flags.Speak)
                ) {
                    voiceLogger.connection(guildId, 'Join failed - invalid channel', {
                        missingPerms: botPerms.missing([
                            coreLoader.PermissionsBitField.Flags.Connect,
                            coreLoader.PermissionsBitField.Flags.Speak,
                        ]),
                    });
                    await safeError(interaction, 'البوت ليس لديه الصلاحيات الكاملة للانضمام الى هذه الغرفة الصوتية');
                    return;
                }
                voiceLogger.connection(guildId, 'Initializing voice connection');
                // const joinResult = await initializeConnection(guildId, guildState, voiceChannel, interaction.guild.voiceAdapterCreator);
                // if (!joinResult.success) {
                //    voiceLogger.error(guildId, 'Connection initialization failed', null, {
                //        joinResult,
                //    });
                //    throw new Error('Connection initialization failed');
                const botMember = interaction.guild.members.me;
                const isAlreadyInChannel = botMember?.voice?.channelId === targetChannelId;

                if (!isAlreadyInChannel) {
                    try {
                        const joinResult = await initializeConnection(
                            guildId,
                            guildState,
                            voiceChannel,
                            interaction.guild.voiceAdapterCreator,
                        );
                        if (!joinResult.success) {
                            voiceLogger.error(guildId, 'Connection initialization failed', null, {
                                joinResult,
                            });
                            throw new Error('Connection initialization failed');
                        }
                    } catch (err) {
                        if (err.message && err.message.includes('maximum player capacity')) {
                            logger.warn('Guild ' + guildId + ' Join failed: Lavalink nodes at max capacity');
                            await safeError(interaction, 'جميع الخوادم الصوتية ممتلئة حالياً، يرجى المحاولة لاحقاً');
                            return;
                        }
                        throw err;
                    }
                } else {
                    voiceLogger.connection(guildId, 'Bot already in target channel');
                }
                // guildState.playbackMode = guildState.playbackMode || 'surah';
                // const availableReciters = Object.keys(global.reciters || {});
                // guildState.currentReciter = availableReciters[Math.floor(Math.random() * availableReciters.length)];
                // guildState.currentSurah = Math.floor(Math.random() * 114) + 1;
                // guildState.isPaused = false;
                // guildState.pauseReason = null;

                if (guildState.playbackMode === 'surah') {
                    const savedQuran = guildState.savedQuranState;
                    const availableReciters = Object.keys(global.reciters || {});
                    /**
                    guildState.currentReciter = availableReciters[Math.floor(Math.random() * availableReciters.length)];
                    guildState.currentSurah = Math.floor(Math.random() * 114) + 1;
                    voiceLogger.connection(guildId, 'Preparing playback', {
                        mode: 'surah',
                        reciter: guildState.currentReciter,
                        surah: guildState.currentSurah,
                    });
                    voiceLogger.connection(guildId, 'Creating surah resource for playback');
                    const audioResource = await createSurahResource(guildState, guildState.currentSurah - 1);
                    if (audioResource) {
                        guildState.player.queue.add(audioResource);

                        if (!guildState.player.playing && !guildState.player.paused) {
                            await guildState.player.play();
                        }
                    **/
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
                    // voiceLogger.connection(guildId, 'Started radio playback');
                } else {
                    // guildState.playbackMode = 'radio';
                    // if (global.quranRadios && global.quranRadios.length > 0) {
                    //     if (!guildState.currentRadioIndex && guildState.currentRadioIndex !== 0) {
                    //         guildState.currentRadioIndex = 0;
                    //         guildState.currentRadioUrl = global.quranRadios[0].url;
                    //    }
                    const savedRadio = guildState.savedRadioState;
                    if (savedRadio && global.quranRadios?.[savedRadio.currentRadioIndex]) {
                        guildState.currentRadioIndex = savedRadio.currentRadioIndex;
                        guildState.currentRadioPage = savedRadio.currentRadioPage;
                        guildState.currentRadioUrl = global.quranRadios[savedRadio.currentRadioIndex].url;
                    } else if (global.quranRadios?.length) {
                        guildState.currentRadioIndex = 0;
                        guildState.currentRadioPage = 0;
                        guildState.currentRadioUrl = global.quranRadios[0].url;
                    }
                    /**
                    voiceLogger.connection(guildId, 'Preparing playback', {
                        mode: 'radio',
                        url: guildState.currentRadioUrl,
                    });
                    if (guildState.currentRadioUrl) {
                        voiceLogger.connection(guildId, 'Creating radio resource for playback', {
                            url: guildState.currentRadioUrl,
                        });
                        const streamUrl =
                            global.radioHealthChecker?.getActiveRadioUrl(guildState.currentRadioUrl) || guildState.currentRadioUrl;
                        const radioResource = await createRadioResource(streamUrl);
                        if (radioResource) {
                            guildState.player.queue.add(radioResource);
                            if (!guildState.player.playing && !guildState.player.paused) {
                                await guildState.player.play();
                    **/
                }
                guildState.isPaused = false;
                guildState.pauseReason = null;
                voiceLogger.connection(guildId, 'Preparing playback', {
                    mode: guildState.playbackMode,
                    reciter: guildState.currentReciter,
                    surah: guildState.currentSurah,
                });
                voiceLogger.connection(guildId, 'Creating resource for playback');
                let audioResource = null;
                if (guildState.playbackMode === 'surah') {
                    audioResource = await createSurahResource(guildState, guildState.currentSurah - 1);
                } else if (guildState.playbackMode === 'radio' && guildState.currentRadioUrl) {
                    audioResource = await createRadioResource(guildState.currentRadioUrl);
                }
                if (audioResource) {
                    guildState.player.queue.add(audioResource);
                    if (!guildState.player.playing && !guildState.player.paused) {
                        await guildState.player.play();
                    }
                    if (guildState.playbackMode === 'surah' && guildState.playedOffset > 0) {
                        setTimeout(() => {
                            if (guildState.player && !guildState.player.destroyed) {
                                guildState.player.seek(guildState.playedOffset).catch(() => {});
                            }
                        }, 1000);
                    }
                }
                await syncVoiceState(guildId, guildState);
                voiceLogger.connection(guildId, 'Voice state synced after join');
                await interaction.editReply({
                    content: 'تم الانضمام الى ' + voiceChannel.name + ' جاري التشغيل',
                    flags: 64,
                });
                voiceLogger.connection(guildId, 'Join command completed successfully');
            },
            { context: { label: 'join_command', logger } },
        );
    },
};
