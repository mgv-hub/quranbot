const logger = require('@infrastructure/Logging/Logger');
const { time_constants } = require('@config/Constants');
const { queueAzkarSend } = require('@modules/Azkar/Services/AzkarExecutionQueueProcessor');

const azkar_interval_ms = time_constants.azkar_interval_ms;
let globalTimer = null;

function initTimer() {
    if (globalTimer) return;
    globalTimer = setInterval(() => {
        if (!global.guildStates) return;
        for (const [gid, st] of global.guildStates.entries()) {
            if (st.azkarChannelId) {
                queueAzkarSend(st.azkarChannelId, gid, 5, false);
            }
        }

    }, azkar_interval_ms);
}

function startAzkarTimerForGuild(gid, cid, isFirst = true) {
    const { getGuildState } = require('@state/GuildStateManager');
    const st = getGuildState(gid);

    if (!st) {
        logger.error('Azkar Cannot Start Timer Guild State Not Found ' + gid);
        return { success: false, reason: 'Guild state not found' };
    }

    st.azkarChannelId = cid;
    queueAzkarSend(cid, gid, 5, isFirst);
    initTimer();

    return { success: true, channelId: cid };
}

module.exports.startAzkarTimerForGuild = startAzkarTimerForGuild;