const { ChannelType, PermissionsBitField } = require('discord.js');
const { initializeConnection, syncVoiceState } = require('@modules/Audio/Voice/AudioConnection');
const { createSurahResource, createRadioResource } = require('@modules/Audio/Playback/AudioResource');
const voiceLogger = require('@infrastructure/Logging/VoiceLogger');
const { restorePlaybackState } = require('@state/PlaybackUtils');

function countHumans(channel) {
    if (!channel?.members) return 0;
    return channel.members.filter((m) => !m.user.bot).size;
}

async function validateTargetChannel(guild, channelId) {
    const channel = guild.channels.cache.get(channelId) || (await guild.channels.fetch(channelId).catch(() => null));
    if (!channel || channel.type !== ChannelType.GuildVoice) {
        return { valid: false, channel: null, error: 'القناة المحددة لم تعد موجودة أو ليست غرفة صوتية.' };
    }

    const perms = channel.permissionsFor(guild.members.me);
    if (!perms.has(PermissionsBitField.Flags.Connect) || !perms.has(PermissionsBitField.Flags.Speak)) {
        return { valid: false, channel: null, error: 'البوت ليس لديه الصلاحيات الكاملة للانضمام إلى هذه الغرفة الصوتية.' };
    }
    return { valid: true, channel, error: null };
}

async function startPlayback(gs, guildId) {
    let resource = null;
    if (gs.playbackMode === 'surah') {
        resource = await createSurahResource(gs, gs.currentSurah - 1);
    } else if (gs.playbackMode === 'radio' && gs.currentRadioUrl) {
        resource = await createRadioResource(gs.currentRadioUrl);
    }

    if (!resource) return false;
    if (gs.player?.queue) {
        gs.player.queue.add(resource);
        if (!gs.player.playing && !gs.player.paused) {
            await gs.player.play();
        }
    } else if (gs.player?.play) {
        gs.player.play({ track: resource });
    }

    if (gs.playbackMode === 'surah' && gs.playedOffset > 0) {
        setTimeout(() => {
            if (gs.player && !gs.player.destroyed) {
                gs.player.seek(gs.playedOffset).catch(() => {});
            }
        }, 1000);
    }

    gs.isPaused = false;
    gs.pauseReason = null;
    gs.playbackStartTime = Date.now();
    return true;
}

async function executeVoiceJoin(guildId, gs, targetChannel, adapterCreator) {
    const joinResult = await initializeConnection(guildId, gs, targetChannel, adapterCreator);
    if (!joinResult.success) throw new Error('Connection initialization failed');
    restorePlaybackState(gs);

    const humans = countHumans(targetChannel);
    if (humans === 0) {
        await syncVoiceState(guildId, gs);
        return { joined: true, idle: true };
    }

    const played = await startPlayback(gs, guildId);
    if (!played && gs.playbackMode === 'radio') {
        gs.playbackMode = 'surah';
        await startPlayback(gs, guildId);
    }

    await syncVoiceState(guildId, gs);
    return { joined: true, idle: false };
}

module.exports.restorePlaybackState = restorePlaybackState;
module.exports.startPlayback = startPlayback;
module.exports.validateTargetChannel = validateTargetChannel;
module.exports.countHumans = countHumans;
module.exports.executeVoiceJoin = executeVoiceJoin;
