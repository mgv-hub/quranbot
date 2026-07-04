const { getGuildStateById } = require('../state/guild-state-store');
const persistentState = require('../state/PersistentStateManager');
const { ChannelType } = require('discord.js');
const logger = require('@logging/logger');
const { initializeConnection, syncVoiceState } = require('./connection');
// const { AudioPlayerStatus } = require('@discordjs/voice');
const { time_constants } = require('@config/constants');

const RECOVERY_DELAY_MS = time_constants.error_recovery_delay_ms || 7000;
const RECONNECT_ATTEMPT_DELAY = 2000;

async function recoverVoiceConnection(guild, fixedSetupData, guildId) {
    if (!fixedSetupData.voiceChannelId) return;

    let targetChannel =
        guild.channels.cache.get(fixedSetupData.voiceChannelId) ||
        (await guild.channels.fetch(fixedSetupData.voiceChannelId).catch(() => null));
    if (!targetChannel || targetChannel.type !== ChannelType.GuildVoice) return;

    const state = getGuildStateById(guildId);
    const storedState = persistentState.getGuildState(guildId);

    if (!storedState?.manualDisconnectFlag && (!state.connection || state.connection.destroyed)) {
        try {
            await initializeConnection(guildId, state, targetChannel, guild.voiceAdapterCreator);
            state.playbackMode = storedState?.playbackMode || 'surah';
            state.isPaused = false;

            const available = Object.keys(global.reciters || {});
            state.currentReciter = storedState?.currentReciter || available[Math.floor(Math.random() * available.length)];
            state.currentSurah = (storedState?.currentSurahIndex || 0) + 1;
            state.playedOffset = storedState?.playedOffset || 0;
            state.playbackStartTime = Date.now();

            try {
                const resource = await global.createSurahResource(state, state.currentSurah - 1, 0, 0, false);
                if (resource) {
                    state.player.play({ track: resource });
                    state.isPaused = false;
                    state.pauseReason = null;
                }

                await new Promise((r) => setTimeout(r, 3000));
                if (state.player?.state?.status === 'idle') {
                    const retry = await global.createSurahResource(state, state.currentSurah - 1, 0, 0, true);
                    if (retry) {
                        state.player.play({ track: retry });
                    }
                }
            } catch {
                state.isPaused = true;
            }

            storedState.connectionStatus = true;
            storedState.voiceChannelId = targetChannel.id;
            persistentState.updateGuildState(guildId, storedState);
            await syncVoiceState(guildId, state);
            logger.info(`Guild ${guildId} Voice Recovered And Playing`);
        } catch (error) {
            logger.error(`Guild ${guildId} Recovery Failed`, error);
        }
    } else if (state.connection && !state.connection.destroyed && state.player?.state?.status === 'idle') {
        try {
            const resource = await global.createSurahResource(state, state.currentSurah - 1, 0, 0, false);
            if (resource) {
                state.player.play({ track: resource });
                state.isPaused = false;
                state.pauseReason = null;
            }
        } catch {}
        if (state.connection?.subscribe) {
            state.connection.subscribe(state.player);
        }
    }
}

async function restoreGuildStates(client, activeGuildIds) {
    const allStored = persistentState.getAllStates();
    const toRestore = Object.keys(allStored).filter((gid) => activeGuildIds.has(gid));
    if (toRestore.length === 0) return;

    for (let i = 0; i < toRestore.length; i++) {
        const guildId = toRestore[i];
        setTimeout(async () => {
            const guild = client.guilds.cache.get(guildId);
            if (!guild) return;

            const stored = allStored[guildId];
            const channel = guild.channels.cache.get(stored.voiceChannelId);
            if (channel?.type === ChannelType.GuildVoice && channel.permissionsFor(guild.members.me)?.has('Connect')) {
                const state = getGuildStateById(guildId);
                try {
                    await initializeConnection(guildId, state, channel, guild.voiceAdapterCreator);
                    state.currentReciter = stored.currentReciter;
                    state.currentSurah = stored.currentSurahIndex + 1;
                    state.playbackMode = stored.playbackMode;
                    state.isPaused = false;
                    state.playedOffset = stored.playedOffset || 0;

                    if (stored.playbackMode === 'surah') {
                        try {
                            const res = await global.createSurahResource(state, stored.currentSurahIndex, 0);
                            if (res) {
                                state.player.play({ track: res });
                            }
                            await new Promise((r) => setTimeout(r, 3000));
                            if (state.player?.state?.status === 'idle') {
                                state.player.play({
                                    track: await global.createSurahResource(state, stored.currentSurahIndex, 0),
                                });
                            }
                        } catch {
                            state.isPaused = true;
                        }
                    }

                    persistentState.setManualDisconnect(guildId, false);
                    await syncVoiceState(guildId, state);
                } catch {}
            }
        }, i * RECONNECT_ATTEMPT_DELAY);
    }
}

module.exports.recoverVoiceConnection = recoverVoiceConnection;
module.exports.restoreGuildStates = restoreGuildStates;
