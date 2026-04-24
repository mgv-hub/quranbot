require('pathlra-aliaser')();

const logger = require('@logger');
const {
   loadControlIdsFromFirebase,
   saveControlIdsToFirebase,
} = require('@firebase-core_utils');

async function cleanControlIds(client) {
   try {
      const controlIds = await loadControlIdsFromFirebase();
      if (!controlIds || Object.keys(controlIds).length === 0) {
         logger.info('No Control IDs Data To Clean');
         return { cleaned: 0, reason: 'No data' };
      }

      const botGuildIds = new Set(client.guilds.cache.keys());
      const validControlIds = {};
      let removedCount = 0;

      for (const [guildId, channelData] of Object.entries(controlIds)) {
         if (!botGuildIds.has(guildId)) {
            removedCount++;
            logger.info('Removed Control IDs Bot Not In Guild: ' + guildId);
            continue;
         }

         const guild = client.guilds.cache.get(guildId);
         if (!guild) {
            removedCount++;
            logger.info('Removed Control IDs Guild Not Found: ' + guildId);
            continue;
         }

         const validChannelData = {};

         for (const [channelId, messageIds] of Object.entries(channelData)) {
            let channel = guild.channels.cache.get(channelId);
            if (!channel) {
               channel = await guild.channels.fetch(channelId).catch(() => null);
            }

            if (channel) {
               const validMessageIds = [];
               for (const messageId of Array.isArray(messageIds) ? messageIds : [messageIds]) {
                  try {
                     const message = await channel.messages.fetch(messageId).catch(() => null);
                     if (message) {
                        validMessageIds.push(messageId);
                     }
                  } catch (error) {
                     logger.debug('Message Not Found: ' + messageId);
                  }
               }

               if (validMessageIds.length > 0) {
                  validChannelData[channelId] = validMessageIds;
               }
            }
         }

         if (Object.keys(validChannelData).length > 0) {
            validControlIds[guildId] = validChannelData;
         }
      }

      if (removedCount > 0 || JSON.stringify(validControlIds) !== JSON.stringify(controlIds)) {
         await saveControlIdsToFirebase(validControlIds);
         logger.info('Saved Cleaned Control IDs');
      }

      return { cleaned: removedCount, remaining: Object.keys(validControlIds).length };
   } catch (error) {
      logger.error('Error Cleaning Control IDs', error);
      return { cleaned: 0, error: error.message };
   }
}

module.exports.cleanControlIds = cleanControlIds;
