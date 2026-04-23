require('pathlra-aliaser')();

const logger = require('@logger');
const { AZKAR_INTERVAL_MS } = require('@azkar-config-core_state');
const { setFirstMessage, getFirstMessage, deleteFirstMessage } = require('@azkar-cache-core_state');
const { sendRandomAzkar } = require('@azkar-sender-core_state');

function startAzkarTimerForGuild(guildId, azkarChannelId, isFirstSetup = true) {
   const { getGuildState } = require('@GuildStateManager-core_state');
   const state = getGuildState(guildId);
   if (!state) {
      logger.error('Azkar Cannot Start Timer Guild State Not Found ' + guildId);
      return { success: false, reason: 'Guild state not found' };
   }
   if (state.azkarTimer) {
      clearInterval(state.azkarTimer);
      state.azkarTimer = null;
   }
   state.azkarChannelId = azkarChannelId;
   if (isFirstSetup) {
      setFirstMessage(guildId, true);
   }
   logger.info('Azkar Starting Timer For Guild ' + guildId + ' Channel ' + azkarChannelId);
   sendRandomAzkar(azkarChannelId, guildId, 5, isFirstSetup);
   state.azkarTimer = setInterval(() => sendRandomAzkar(azkarChannelId, guildId, 5, false), AZKAR_INTERVAL_MS);
   logger.info('Azkar Timer Started For Guild ' + guildId + ' Interval 30 Minutes');
   return { success: true, channelId: azkarChannelId };
}

function stopAzkarTimerForGuild(guildId) {
   const state = global.guildStates.get(guildId);
   if (state && state.azkarTimer) {
      clearInterval(state.azkarTimer);
      state.azkarTimer = null;
      deleteFirstMessage(guildId);
      logger.info('Azkar Timer Stopped For Guild ' + guildId);
      return { success: true };
   }
   return { success: false, reason: 'No active timer' };
}

function resetAzkarFirstMessage(guildId) {
   setFirstMessage(guildId, true);
   logger.info('Azkar First Message Reset For Guild ' + guildId);
   return { success: true };
}

function isAzkarTimerActive(guildId) {
   const state = global.guildStates.get(guildId);
   return state && state.azkarTimer !== null;
}

module.exports.startAzkarTimerForGuild = startAzkarTimerForGuild;
module.exports.stopAzkarTimerForGuild = stopAzkarTimerForGuild;
module.exports.resetAzkarFirstMessage = resetAzkarFirstMessage;
module.exports.isAzkarTimerActive = isAzkarTimerActive;
