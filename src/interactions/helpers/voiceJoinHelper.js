const { initializeConnection, syncVoiceState, createSurahResource, createRadioResource } = require('@audio');
const logger = require('@logging/logger');
const voiceLogger = require('@logging/voiceLogger');
const coreLoader = require('@bot/bootstrap');

async function validateTargetChannel(guild, channelId) {
    const channel = guild.channels.cache.get(channelId) || (await guild.channels.fetch(channelId).catch(() => null));

    if (!channel || channel.type !== coreLoader.ChannelType.GuildVoice) {
        return { valid: false, error: { title: 'خطأ في القناة', desc: 'القناة المحددة لم تعد موجودة أو ليست غرفة صوتية.' } };
    }

    const botPerms = channel.permissionsFor(guild.members.me);
    if (!botPerms.has(coreLoader.PermissionsBitField.Flags.Connect) || !botPerms.has(coreLoader.PermissionsBitField.Flags.Speak)) {
        return {
            valid: false,
            error: { title: 'صلاحيات غير كافية', desc: 'البوت ليس لديه الصلاحيات الكاملة للانضمام إلى هذه الغرفة الصوتية.' },
        };
    }

    return { valid: true, channel };
}

function restorePlaybackDefaults(guildState) {
    if (guildState.playbackMode === 'surah') {
        const savedQuran = guildState.savedQuranState;
        const availableReciters = Object.keys(global.reciters || {});

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
        if (savedRadio && global.quranRadios?.[savedRadio.currentRadioIndex]) {
            guildState.currentRadioIndex = savedRadio.currentRadioIndex;
            guildState.currentRadioPage = savedRadio.currentRadioPage;
            guildState.currentRadioUrl = global.quranRadios[savedRadio.currentRadioIndex].url;
        } else if (global.quranRadios?.length) {
            guildState.currentRadioIndex = 0;
            guildState.currentRadioPage = 0;
            guildState.currentRadioUrl = global.quranRadios[0].url;
        }
    }

    guildState.isPaused = false;
    guildState.pauseReason = null;
}

async function executeVoiceJoin(guildId, guildState, targetChannel, adapterCreator) {
    voiceLogger.connection(guildId, 'Initializing voice connection from prompt');

    const joinResult = await initializeConnection(guildId, guildState, targetChannel, adapterCreator);
    if (!joinResult.success) {
        voiceLogger.error(guildId, 'Connection initialization failed', null, { joinResult });
        throw new Error('Connection initialization failed');
    }

    restorePlaybackDefaults(guildState);

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
}

module.exports = {
    validateTargetChannel,
    executeVoiceJoin,
};
