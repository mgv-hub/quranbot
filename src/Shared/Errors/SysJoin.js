const logger = require('@infrastructure/Logging/Logger');
const { teardownConnection } = require('@modules/Audio/AudioModule');
const { getVoiceChannel, checkBotPermissions } = require('@shared/Errors/SysVoice');
const { executeVoiceJoin } = require('@modules/Audio/Interactions/Helpers/VoiceJoinHelper');
const { checkInitialIdleState } = require('@modules/Audio/Voice/VoiceIdle');
const { ERRORS } = require('@shared/Errors/SysConfig');

async function joinVoiceChannelHandler(interaction, guildId, guildState) {
    const guildSetup = global.setupGuilds?.[guildId] || null;
    const channelLookup = await getVoiceChannel(interaction.guild, guildSetup, guildState);
    if (!channelLookup.channel) return { success: false, error: channelLookup.error };

    const { channel: targetChannel, channelId: targetChannelId } = channelLookup;
    if (!checkBotPermissions(targetChannel, interaction.guild.members.me)) {
        return { success: false, error: ERRORS.NO_PERMISSIONS };
    }

    try {
        const result = await executeVoiceJoin(guildId, guildState, targetChannel, interaction.guild.voiceAdapterCreator);

        if (result.idle) {
            await checkInitialIdleState(guildId, interaction.client || global.client);
        }

        if (!global.setupGuilds) global.setupGuilds = {};
        if (!global.setupGuilds[guildId]) global.setupGuilds[guildId] = { voiceChannelId: targetChannelId };

        return { success: true, voiceChannelId: targetChannelId, idleMode: result.idle };
    } catch (err) {
        if (err.message?.includes('maximum player capacity')) {
            logger.warn('Guild ' + guildId + ' Join failed: Lavalink nodes at max capacity');
            await teardownConnection(guildId, guildState);
            return { success: false, error: 'جميع الخوادم الصوتية ممتلئة حالياً، يرجى المحاولة لاحقاً' };
        }
        logger.error('Error Joining Via Button In Guild ' + guildId, err);
        await teardownConnection(guildId, guildState);
        return { success: false, error: ERRORS.JOIN_FAILED + ' ' + err.message };
    }
}

module.exports.joinVoiceChannelHandler = joinVoiceChannelHandler;
