const { executeVoiceLeave } = require('@modules/Audio/Interactions/Helpers/VoiceLeaveHelper');
const { ERRORS } = require('@shared/Errors/SysConfig');

async function leaveVoiceChannelHandler(guildId, guildState) {
    const result = await executeVoiceLeave(guildId, guildState);
    if (!result.success) return { success: false, error: ERRORS.NOT_IN_VC };
    return { success: true };
}

module.exports.leaveVoiceChannelHandler = leaveVoiceChannelHandler;
