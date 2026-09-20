const logger = require('@infrastructure/Logging/Logger');
const { ChannelType } = require('discord.js');
const { getGuildState } = require('@state/GuildStateManager');
const { initializeConnection } = require('@modules/Audio/AudioModule');

function scheduleDelayedCapacityRetry(client, guildId) {
    logger.info(`Lavalink nodes at capacity, scheduling delayed retry for guild ${guildId}`);
    setTimeout(async () => {
        try {
            const setupData = global.setupGuilds[guildId];
            if (!setupData?.voiceChannelId) return;

            const guild = client.guilds.cache.get(guildId);
            if (!guild) return;

            const guildState = getGuildState(guildId);
            const targetChannel =
                guild.channels.cache.get(setupData.voiceChannelId) ||
                (await guild.channels.fetch(setupData.voiceChannelId).catch(() => null));

            if (targetChannel && targetChannel.type === ChannelType.GuildVoice && !guildState.player?.destroyed) {
                await initializeConnection(guildId, guildState, targetChannel, guild.voiceAdapterCreator);
                logger.info(`Delayed restoration successful for guild ${guildId}`);
                return true;
            }
        } catch {}
        return false;
    }, 10000);
}

module.exports.scheduleDelayedCapacityRetry = scheduleDelayedCapacityRetry;
