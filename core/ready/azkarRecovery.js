require('pathlra-aliaser');
const logger = require('@logger');
const { startAzkarTimerForGuild } = require('@AzkarManager-core_state');
const { getGuildState } = require('@GuildStateManager-core_state');
const persistentStateManager = require('@PersistentStateManager-core_state');
async function recoverAzkarTimers(guild, fixedSetupData, guildId) {
   if (fixedSetupData.azkarChannelId) {
      let azkarChannel = null;
      try {
         azkarChannel =
            guild.channels.cache.get(fixedSetupData.azkarChannelId) ||
            (await guild.channels.fetch(fixedSetupData.azkarChannelId).catch(() => null));
      } catch (error) {
         logger.info(
            'Guild ' +
               guildId +
               ' Azkar Channel ' +
               fixedSetupData.azkarChannelId +
               ' Not Accessible',
         );
      }
      if (azkarChannel && azkarChannel.isTextBased()) {
         const state = getGuildState(guildId);
         const persistentState = persistentStateManager.getGuildState(guildId);
         state.azkarChannelId = fixedSetupData.azkarChannelId;
         persistentState.azkarChannelId = fixedSetupData.azkarChannelId;
         if (state.azkarTimer) {
            clearInterval(state.azkarTimer);
            state.azkarTimer = null;
         }

         try {
            await startAzkarTimerForGuild(guildId, fixedSetupData.azkarChannelId, false);
            logger.info(
               'Started Azkar Timer For Guild ' +
                  guildId +
                  ' Channel ' +
                  fixedSetupData.azkarChannelId,
            );
         } catch (err) {
            logger.error('Failed To Start Azkar Timer For Guild ' + guildId, err);
         }
      } else {
         logger.info(
            'Guild ' + guildId + ' Azkar Channel Not Valid Type Or Not Found Skipping',
         );
         const state = getGuildState(guildId);
         const persistentState = persistentStateManager.getGuildState(guildId);
         state.azkarChannelId = null;
         persistentState.azkarChannelId = null;
      }
   }
}

module.exports.recoverAzkarTimers = recoverAzkarTimers;
