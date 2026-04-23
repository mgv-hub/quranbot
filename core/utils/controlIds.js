require('pathlra-aliaser')();
const logger = require('@logger');
const { loadControlIdsFromFirebase, saveControlIdsToFirebase } = require('@firebase-core_utils');
let memoryCache = {};
let isCacheLoaded = false;
async function loadCache() {
   if (isCacheLoaded) return;
   memoryCache = await loadControlIdsFromFirebase();
   isCacheLoaded = true;
}
async function deleteOldControlMessages(guildId, channelId, newMessageId) {
   if (!global.client) {
      logger.warn('Client Not Available For Message Deletion');
      return;
   }
   if (memoryCache[guildId] && memoryCache[guildId][channelId]) {
      const oldMessageIds = memoryCache[guildId][channelId];
      if (Array.isArray(oldMessageIds)) {
         const channel =
            global.client.channels.cache.get(channelId) ||
            (await global.client.channels.fetch(channelId).catch(() => null));
         if (channel) {
            for (const oldMessageId of oldMessageIds) {
               if (oldMessageId !== newMessageId) {
                  try {
                     const oldMessage = await channel.messages.fetch(oldMessageId).catch(() => null);
                     if (oldMessage) {
                        await oldMessage.delete().catch(() => {});
                     }
                  } catch (error) {
                     logger.debug('Failed To Delete Old Message ' + oldMessageId);
                  }
               }
            }
         }
      }
   }
}
async function saveControlId(guildId, channelId, messageId) {
   if (!isCacheLoaded) {
      await loadCache();
   }
   await deleteOldControlMessages(guildId, channelId, messageId);
   if (!memoryCache[guildId]) {
      memoryCache[guildId] = {};
   }
   memoryCache[guildId][channelId] = [messageId];
   await saveControlIdsToFirebase(memoryCache);
}
async function saveDhikrMessageId(guildId, channelId, messageId) {
   if (!isCacheLoaded) {
      await loadCache();
   }
   if (!memoryCache[guildId]) {
      memoryCache[guildId] = {};
   }
   if (!memoryCache[guildId][channelId]) {
      memoryCache[guildId][channelId] = [];
   }
   memoryCache[guildId][channelId].push(messageId);
   await saveControlIdsToFirebase(memoryCache);
   logger.info('Saved Dhikr Message Id For Guild ' + guildId);
}
async function readControlIds() {
   if (!isCacheLoaded) {
      await loadCache();
   }
   return memoryCache;
}
async function removeControlId(guildId, channelId, messageId) {
   if (!isCacheLoaded) {
      await loadCache();
   }
   if (memoryCache[guildId] && memoryCache[guildId][channelId]) {
      memoryCache[guildId][channelId] = [];
      await saveControlIdsToFirebase(memoryCache);
   }
}
async function flushCache() {
   await saveControlIdsToFirebase(memoryCache);
}
async function init() {
   await loadCache();
}
init().catch((error) => {
   logger.error('Failed To Initialize Control Message Id System');
});

module.exports.saveControlId = saveControlId;
module.exports.readControlIds = readControlIds;
module.exports.removeControlId = removeControlId;
module.exports.flushCache = flushCache;
module.exports.saveDhikrMessageId = saveDhikrMessageId;
