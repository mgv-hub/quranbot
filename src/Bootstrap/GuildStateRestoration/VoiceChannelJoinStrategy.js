const logger = require('@infrastructure/Logging/Logger');
const { ChannelType } = require('discord.js');
const { getGuildState } = require('@state/GuildStateManager');
const { initializeConnection, syncVoiceState } = require('@modules/Audio/AudioModule');

async function joinEmptyChannelViaRawVoice(guild, guildId, targetChannel) {
    const { joinVoiceChannel } = require('@discordjs/voice');
    const guildState = getGuildState(guildId);

    guildState.rawConnection = joinVoiceChannel({
        channelId: targetChannel.id,
        guildId: guild.id,
        adapterCreator: guild.voiceAdapterCreator,
        selfDeaf: true,
    });

    guildState.channelId = targetChannel.id;
    guildState.isPaused = true;
    guildState.pauseReason = 'inactivity_raw';

    await syncVoiceState(guildId, guildState);
    const { updateVoiceStatus, clearStatusCache } = require('@modules/Audio/Voice/VoiceStatus');
    clearStatusCache();
    await updateVoiceStatus(guildId, guildState, guild.client);

    logger.info(`Guild ${guildId} Joined via raw voice (channel empty)`);
}

async function joinActiveChannelViaLavalink(guild, guildId, targetChannel) {
    const guildState = getGuildState(guildId);
    logger.info(`Guild ${guildId} Re-establishing Lavalink Connection...`);
    const joinResult = await initializeConnection(guildId, guildState, targetChannel, guild.voiceAdapterCreator);

    if (!joinResult.success) {
        logger.error(`Failed To Re-connect Guild ${guildId}`);
        return false;
    }

    logger.info(`Guild ${guildId} Connection Re-established`);
    return true;
}

async function establishVoiceConnection(guild, guildId, setupData) {
    const guildState = getGuildState(guildId);
    const isConnected = guildState.player && !guildState.player.destroyed && guildState.channelId;
    if (isConnected) return true;

    let targetChannel = guild.channels.cache.get(setupData.voiceChannelId);
    if (!targetChannel) targetChannel = await guild.channels.fetch(setupData.voiceChannelId).catch(() => null);

    if (targetChannel && targetChannel.type === ChannelType.GuildVoice) {
        const humanCount = targetChannel.members.filter((m) => !m.user.bot).size;
        if (humanCount === 0) {
            await joinEmptyChannelViaRawVoice(guild, guildId, targetChannel);
        } else {
            const success = await joinActiveChannelViaLavalink(guild, guildId, targetChannel);
            if (!success) return false;
        }
    }
    return true;
}

module.exports.establishVoiceConnection = establishVoiceConnection;
