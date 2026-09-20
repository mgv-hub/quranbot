const voiceLogger = require('@infrastructure/Logging/VoiceLogger');
const logger = require('@infrastructure/Logging/Logger');
const { getGuildStateById } = require('@state/GuildStateStore');
const { joinVoiceChannel } = require('@discordjs/voice');
const { restorePlaybackState, startPlayback } = require('@modules/Audio/Interactions/Helpers/VoiceJoinHelper');
const timers = new Map();

function getCtx(guildId) {
    const state = getGuildStateById(guildId);
    if (!state || !state.channelId) return null;
    const hasPlayer = state.player && !state.player.destroyed;
    const hasRaw = !!state.rawConnection;
    if (!hasPlayer && !hasRaw) return null;
    return state;
}

// count only users (ignore bots)
function users(channel) {
    if (!channel?.members) return 0;
    return channel.members.filter((m) => !m.user.bot).size;
}

function getGuild(client, guildId) {
    return client.guilds.cache.get(guildId) || null;
}

async function switchToRaw(state, guildId, client) {
    const guild = getGuild(client, guildId);
    if (!guild) return;

    state.savedPlaybackState = {
        position: state.player?.position || 0,
        mode: state.playbackMode,
        surah: state.currentSurah,
        reciter: state.currentReciter,
        radioUrl: state.currentRadioUrl,
        radioIndex: state.currentRadioIndex,
        radioPage: state.currentRadioPage,
    };

    if (state.player && !state.player.destroyed) {
        try { await state.player.destroy(); } catch (e) {
            voiceLogger.error(guildId, 'Failed to destroy Lavalink player for raw switch', e);
        }
    }
    state.player = null;
    state.isPaused = true;
    state.pauseReason = 'inactivity_raw';

    const channel = guild.channels.cache.get(state.channelId);
    if (channel && !state.rawConnection) {
        try {
            const delayMs = 1500 + Math.floor(Math.random() * 2000);
            await new Promise((resolve) => setTimeout(resolve, delayMs));
            state.rawConnection = joinVoiceChannel({
                channelId: channel.id,
                guildId: guild.id,
                adapterCreator: guild.voiceAdapterCreator,
                selfDeaf: true,
            });
            voiceLogger.player(guildId, 'Switched to raw Discord voice connection (idle)');
        } catch (e) {
            voiceLogger.error(guildId, 'Failed to join raw voice connection', e);
        }
    }

    if (global.saveRuntimeStates) await global.saveRuntimeStates();
    const { updateVoiceStatus, clearStatusCache } = require('@modules/Audio/Voice/VoiceStatus');
    clearStatusCache();
    await updateVoiceStatus(guildId, state, client);
    logger.info(`Switched to raw voice connection (idle) ${guild.name} id ${guildId}`);
}

async function switchToLavalink(state, guildId, client) {
    if (state.rawConnection) {
        try { state.rawConnection.destroy(); } catch (e) {}
        state.rawConnection = null;
    }

    const guild = getGuild(client, guildId);
    const channel = guild.channels.cache.get(state.channelId);
    if (!channel) return;

    const { initializeConnection } = require('@modules/Audio/Voice/AudioConnection');
    const joinResult = await initializeConnection(guildId, state, channel, guild.voiceAdapterCreator);
    if (!joinResult.success) {
        voiceLogger.error(guildId, 'Failed to re-initialize Lavalink connection');
        return;
    }

    const saved = state.savedPlaybackState;
    if (saved) {
        state.playbackMode = saved.mode;
        state.currentSurah = saved.surah;
        state.currentReciter = saved.reciter;
        state.currentRadioUrl = saved.radioUrl;
        state.currentRadioIndex = saved.radioIndex;
        state.currentRadioPage = saved.radioPage;

        const { createSurahResource, createRadioResource } = require('@modules/Audio/Playback/AudioResource');
        let track = null;
        try {
            if (saved.mode === 'surah') track = await createSurahResource(state, saved.surah - 1);
            else if (saved.radioUrl) track = await createRadioResource(saved.radioUrl);
        } catch (e) {
            voiceLogger.error(guildId, 'Failed to recreate track on resume', e);
        }

        if (track) {
            state.player.play({ track });
            if (saved.position > 0) {
                setTimeout(() => {
                    if (state.player && !state.player.destroyed) state.player.seek(saved.position).catch(() => {});
                }, 1000);
            }
        }
        state.savedPlaybackState = null;
    } else {
        restorePlaybackState(state);
        await startPlayback(state, guildId);
    }

    state.isPaused = false;
    state.pauseReason = null;

    if (global.saveRuntimeStates) await global.saveRuntimeStates();
    const { updateVoiceStatus, clearStatusCache } = require('@modules/Audio/Voice/VoiceStatus');
    clearStatusCache();
    await updateVoiceStatus(guildId, state, client);
    voiceLogger.player(guildId, 'Switched back to Lavalink from raw connection');
    logger.info(`Switched back to Lavalink ${guild.name} id ${guildId}`);
}

function clearTimer(guildId) {
    const t = timers.get(guildId);
    if (!t) return;
    clearTimeout(t);
    timers.delete(guildId);
}

async function resolveChannel(client, channelId) {
    return client.channels.cache.get(channelId) || (await client.channels.fetch(channelId).catch(() => null));
}

async function voiceIdle(guildId, client) {
    const state = getCtx(guildId);
    if (!state) { clearTimer(guildId); return; }
    let channel = await resolveChannel(client, state.channelId);
    if (!channel || channel.type !== 2) { clearTimer(guildId); return; }

    const count = users(channel);
    if (count > 0) {
        clearTimer(guildId);
        if (state.rawConnection && !state.player) await switchToLavalink(state, guildId, client);
        return;
    }
    if (state.rawConnection) return;
    clearTimer(guildId);
    const t = setTimeout(async () => {
        const latest = getCtx(guildId);
        if (!latest || latest.rawConnection) return;
        const ch = await resolveChannel(client, latest.channelId);
        if (ch && users(ch) === 0) await switchToRaw(latest, guildId, client);
        timers.delete(guildId);
    }, 6000);
    timers.set(guildId, t);
}

async function checkInitialIdleState(guildId, client) {
    const state = getGuildStateById(guildId);
    if (!state?.channelId) return;

    const channel = await resolveChannel(client, state.channelId);
    if (!channel || channel.type !== 2) return;

    if (users(channel) === 0 && !state.rawConnection) {
        setTimeout(async () => {
            const latest = getGuildStateById(guildId);
            if (!latest || latest.rawConnection) return;
            const ch = await resolveChannel(client, latest.channelId);
            if (ch && users(ch) === 0) await switchToRaw(latest, guildId, client);
        }, 120000);
    }
}

function clearGuildIdleTimerVc(guildId) {
    clearTimer(guildId);
    const state = getGuildStateById(guildId);
    if (state?.rawConnection) {
        try { state.rawConnection.destroy(); } catch (e) {}
        state.rawConnection = null;
    }
}

function clearAllIdleVc() {
    for (const [, t] of timers) clearTimeout(t);
    timers.clear();
}

module.exports.voiceIdle = voiceIdle;
module.exports.checkInitialIdleState = checkInitialIdleState;
module.exports.clearGuildIdleTimerVc = clearGuildIdleTimerVc;
module.exports.clearAllIdleVc = clearAllIdleVc;
