const voiceLogger = require('@logging/voiceLogger');
const logger = require('@logging/logger');
const { getGuildStateById } = require('@state/guild-state-store');
const { time } = require('discord.js');
const timers = new Map();

function getCtx(guildId) {
    const state = getGuildStateById(guildId);
    if (!state || !state.channelId || !state.player || state.player.destroyed) return null;
    return state;
}

// count only users (ignore bots)
function users(channel) {
    if (!channel || !channel.members) return 0;
    return channel.members.filter((m) => !m.user.bot).size;
}

function getGuild(client, guildId) {
    return client.guilds.cache.get(guildId) || null;
}

// pause playback
async function pause(state, guildId, client) {
    const guild = getGuild(client, guildId);
    const guildName = guild?.name ?? 'unknown';
    if (!state.player || state.player.destroyed || state.player.paused) return;
    try {
        await state.player.pause(true);
        state.isPaused = true;
        state.pauseReason = 'inactivity';
        if (global.saveRuntimeStates) await global.saveRuntimeStates();
        const { updateVoiceStatus } = require('@audio/voiceStatus');
        await updateVoiceStatus(guildId, state, client);
        voiceLogger.player(guildId, 'auto stop (empty vc)', {
            reason: 'no_users_30s',
            mode: state.playback,
        });
        logger.info(`auto stop (empty vc) ${guildName} id ${guildId}`);
    } catch (e) {
        voiceLogger.error(guildId, 'pause failed', e);
    }
}

// resume playback
async function resume(state, guildId) {
    if (!state.player || state.player.destroyed) return;
    if (!state.isPaused || state.pauseReason !== 'inactivity') return;
    try {
        await state.player.resume();
        state.isPaused = false;
        state.pauseReason = null;
        if (global.saveRuntimeStates) await global.saveRuntimeStates();
        const { updateVoiceStatus } = require('@audio/voiceStatus');
        await updateVoiceStatus(guildId, state, global.client);
        voiceLogger.player(guildId, 'auto resume (users back)', {
            reason: 'users_returned',
            mode: state.playback,
        });
        logger.user(`auto resume (users back) ${guildName} id ${guildId}`);
    } catch (e) {
        voiceLogger.error(guildId, 'resume failed', e);
    }
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
    if (!state) {
        clearTimer(guildId);
        return;
    }
    let channel = await resolveChannel(client, state.channelId);
    if (!channel || channel.type !== 2) {
        clearTimer(guildId);
        return;
    }
    const count = users(channel);
    if (count > 0) {
        clearTimer(guildId);
        if (state.isPaused && state.pauseReason === 'inactivity') {
            await resume(state, guildId);
        }
        return;
    }
    if (state.isPaused) return;
    clearTimer(guildId);
    const t = setTimeout(async () => {
        const latest = getCtx(guildId);
        if (!latest || latest.isPaused) return;
        const ch = await resolveChannel(client, latest.channelId);
        if (ch && users(ch) === 0) {
            await pause(latest, guildId, client);
        }
        timers.delete(guildId);
    }, 30000);
    timers.set(guildId, t);
}

function clearGuildIdleTimerVc(guildId) {
    clearTimer(guildId);
}

function clearAllIdleVc() {
    for (const [, t] of timers) {
        clearTimeout(t);
    }
    timers.clear();
}

module.exports.voiceIdle = voiceIdle;
module.exports.clearGuildIdleTimerVc = clearGuildIdleTimerVc;
module.exports.clearAllIdleVc = clearAllIdleVc;
