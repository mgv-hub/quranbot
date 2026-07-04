const logger = require('@logging/logger');
const { startAzkarTimerForGuild } = require('../state/azkarManager');
const { getGuildState } = require('../state/GuildStateManager');
const persistentStateManager = require('@state/PersistentStateManager');

async function recoverAzkarTimers(guild, fixedSetupData, guildId) {
    if (fixedSetupData.azkarChannelId) {
        let adhkarChannel = null;
        try {
            adhkarChannel =
                guild.channels.cache.get(fixedSetupData.azkarChannelId) ||
                (await guild.channels.fetch(fixedSetupData.azkarChannelId).catch(() => null));
        } catch (error) {
            logger.info('Guild ' + guildId + ' Azkar Channel ' + fixedSetupData.azkarChannelId + ' Not Accessible');
        }
        if (adhkarChannel && adhkarChannel.isTextBased()) {
            const guildState = getGuildState(guildId);
            if (!guildState) {
                logger.warn('Guild ' + guildId + ' State Not Found Skipping Azkar Recovery');
                return;
            }
            const storedState = persistentStateManager.getGuildState(guildId);
            guildState.azkarChannelId = fixedSetupData.azkarChannelId;
            storedState.azkarChannelId = fixedSetupData.azkarChannelId;
            if (guildState.azkarTimer) {
                clearInterval(guildState.azkarTimer);
                guildState.azkarTimer = null;
            }
            try {
                await startAzkarTimerForGuild(guildId, fixedSetupData.azkarChannelId, false);
                logger.info('Started Azkar Timer For Guild ' + guildId + ' Channel ' + fixedSetupData.azkarChannelId);
            } catch (err) {
                logger.error('Failed To Start Azkar Timer For Guild ' + guildId, err);
            }
        } else {
            logger.info('Guild ' + guildId + ' Azkar Channel Not Valid Type Or Not Found Skipping');
            const guildState = getGuildState(guildId);
            if (guildState) {
                const storedState = persistentStateManager.getGuildState(guildId);
                guildState.azkarChannelId = fixedSetupData.azkarChannelId;
                storedState.azkarChannelId = fixedSetupData.azkarChannelId;
            }
        }
    }
}
module.exports.recoverAzkarTimers = recoverAzkarTimers;
