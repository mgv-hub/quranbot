const { ChannelType, PermissionsBitField } = require('discord.js');
const logger = require('@logging/logger');
const { channel_names, permissions_config } = require('@config/constants');
const { ERRORS } = require('@interactions/buttons/sys-config');

async function getVoiceChannel(guild, setupData, guildState) {
    let targetChannelId = null;
    if (setupData && setupData.voiceChannelId) {
        targetChannelId = setupData.voiceChannelId;
    } else if (guildState.channelId) {
        targetChannelId = guildState.channelId;
    }
    if (!targetChannelId) {
        return { channel: null, error: ERRORS.NO_SETUP };
    }
    let targetChannel = guild.channels.cache.get(targetChannelId);
    if (!targetChannel) {
        targetChannel = await guild.channels.fetch(targetChannelId).catch(() => null);
    }
    if (!targetChannel) {
        // Use centralized constant
        const fallbackChannel = guild.channels.cache.find((c) => c.name === channel_names.voice && c.type === ChannelType.GuildVoice);
        if (fallbackChannel) {
            targetChannel = fallbackChannel;
            targetChannelId = fallbackChannel.id;
            logger.info('Guild ' + guild.id + ' Auto Fixed Voice Channel ID To ' + targetChannelId);
        }
    }
    if (!targetChannel) {
        return { channel: null, error: ERRORS.NO_CHANNEL };
    }
    return { channel: targetChannel, channelId: targetChannelId };
}

function checkBotPermissions(channel, botMember) {
    const channelPerms = channel.permissionsFor(botMember);
    return channelPerms.has(PermissionsBitField.Flags.Connect) && channelPerms.has(PermissionsBitField.Flags.Speak);
}

module.exports.getVoiceChannel = getVoiceChannel;
module.exports.checkBotPermissions = checkBotPermissions;
