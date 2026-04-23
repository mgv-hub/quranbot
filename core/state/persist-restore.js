require('pathlra-aliaser');

const logger = require('@logger');

function shouldRestore(state) {
   if (!state) return false;
   if (state.manualDisconnectFlag === true) return false;
   if (!state.voiceChannelId) return false;
   if (state.connectionStatus !== true) return false;
   return true;
}

async function restoreGuildState(guildId, guildStates, client) {
   const state = guildStates.get(guildId);
   if (!state || !shouldRestore(state)) {
      return {
         success: false,
         reason: 'No State Or Manual Disconnect Or Connection Status False',
      };
   }
   try {
      const guild = client.guilds.cache.get(guildId);
      if (!guild) {
         return {
            success: false,
            reason: 'Guild Not Found',
         };
      }
      const channel = guild.channels.cache.get(state.voiceChannelId);
      if (!channel) {
         return {
            success: false,
            reason: 'Voice Channel Not Found',
         };
      }
      const permissions = channel.permissionsFor(guild.members.me);
      if (!permissions.has('Connect') || !permissions.has('Speak')) {
         return {
            success: false,
            reason: 'Missing Permissions',
         };
      }
      return {
         success: true,
         state: state,
         channel: channel,
      };
   } catch (error) {
      logger.error('Failed To Restore State For Guild ' + guildId, error);
      return {
         success: false,
         reason: 'Error Occurred',
      };
   }
}

function setManualDisconnect(guildId, guildStates, scheduleSaveFn, value) {
   const state = guildStates.get(guildId);
   if (!state) return;
   state.manualDisconnectFlag = value;
   state.timestamp = Date.now();
   if (value === true) {
      state.connectionStatus = false;
   }
   scheduleSaveFn(guildId, guildStates, null);
   logger.info('Manual Disconnect Flag For Guild ' + guildId + ' Set To ' + value);
}

function clearGuildState(guildId, guildStates, clearSaveTimeoutFn) {
   logger.warn('Clear Guild State Called For ' + guildId);
   guildStates.delete(guildId);
   clearSaveTimeoutFn(guildId);
}

function getAllStates(guildStates, cleanStateFn) {
   const cleanStates = {};
   for (const [guildId, state] of guildStates.entries()) {
      cleanStates[guildId] = cleanStateFn(state);
   }
   return cleanStates;
}

module.exports.shouldRestore = shouldRestore;
module.exports.restoreGuildState = restoreGuildState;
module.exports.setManualDisconnect = setManualDisconnect;
module.exports.clearGuildState = clearGuildState;
module.exports.getAllStates = getAllStates;
