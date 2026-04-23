require('pathlra-aliaser')();

const logger = require('@logger');
const { loadGuildStatesFromFirebase, saveGuildStatesToFirebase } = require('@firebase-core_utils');

async function cleanGuildStates(client) {
   try {
      const guildStates = await loadGuildStatesFromFirebase();
      if (!guildStates || Object.keys(guildStates).length === 0) {
         logger.info('No Guild States Data To Clean');
         return { cleaned: 0, reason: 'No data' };
      }

      const botGuildIds = new Set(client.guilds.cache.keys());
      const validGuildStates = {};
      let removedCount = 0;

      for (const [guildId, stateData] of Object.entries(guildStates)) {
         if (!botGuildIds.has(guildId)) {
            removedCount++;
            logger.info('Removed Guild State Bot Not In: ' + guildId);
            continue;
         }

         const guild = client.guilds.cache.get(guildId);
         if (!guild) {
            removedCount++;
            logger.info('Removed Guild State Not Found: ' + guildId);
            continue;
         }

         if (stateData.voiceChannelId) {
            let voiceChannel = guild.channels.cache.get(stateData.voiceChannelId);
            if (!voiceChannel) {
               voiceChannel = await guild.channels.fetch(stateData.voiceChannelId).catch(() => null);
            }
            if (!voiceChannel) {
               stateData.voiceChannelId = null;
               stateData.connectionStatus = false;
               logger.info('Guild ' + guildId + ' Voice Channel Deleted Cleared State');
            }
         }

         validGuildStates[guildId] = stateData;
      }

      if (removedCount > 0) {
         await saveGuildStatesToFirebase(validGuildStates);
         logger.info('Saved Cleaned Guild States: ' + Object.keys(validGuildStates).length);
      }

      return { cleaned: removedCount, remaining: Object.keys(validGuildStates).length };
   } catch (error) {
      logger.error('Error Cleaning Guild States', error);
      return { cleaned: 0, error: error.message };
   }
}

module.exports.cleanGuildStates = cleanGuildStates;
