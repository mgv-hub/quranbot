require('pathlra-aliaser')();
const { ChannelType } = require('discord.js');
const logger = require('@logger');
const {
   loadTrackedGuildsFromFirebase,
   saveTrackedGuildsToFirebase,
} = require('@firebase-core_utils');
const client = global.client;
let trackedGuilds = [];
async function loadTrackedGuilds() {
   try {
      const data = await loadTrackedGuildsFromFirebase();
      trackedGuilds = Array.isArray(data) ? data : [];
      logger.info('Tracked Guilds Loaded From Firebase');
   } catch (err) {
      logger.error('Failed To Load Tracked Guilds From Firebase');
      trackedGuilds = [];
   }
}
async function saveTrackedGuilds() {
   try {
      await saveTrackedGuildsToFirebase(trackedGuilds);
      logger.info('Tracked Guilds Saved To Firebase');
   } catch (err) {
      logger.error('Failed To Save Tracked Guilds To Firebase');
   }
}
async function cleanupTrackedGuilds() {
   try {
      const initialLength = trackedGuilds.length;
      const botGuildIds = new Set(client.guilds.cache.keys());
      trackedGuilds = trackedGuilds.filter((g) => botGuildIds.has(g.guildId));
      const removedCount = initialLength - trackedGuilds.length;
      if (removedCount > 0) {
         await saveTrackedGuilds();
         logger.info(`Cleaned Up ${removedCount} Guilds Bot Is No Longer In`);
      } else {
         logger.info('No Cleanup Needed All Tracked Guilds Are Valid');
      }
   } catch (err) {
      logger.error('Failed To Cleanup Tracked Guilds');
   }
}
async function syncTrackedGuilds() {
   try {
      await cleanupTrackedGuilds();
      let addedCount = 0;
      for (const guild of client.guilds.cache.values()) {
         const exists = trackedGuilds.some((g) => g.guildId === guild.id);
         if (!exists) {
            let owner = null;
            try {
               owner = await guild.fetchOwner();
            } catch (e) {
               logger.warn(`Could Not Fetch Owner For Guild ${guild.id}`);
            }
            const guildInfo = {
               guildId: guild.id,
               guildName: guild.name,
               ownerId: owner?.id || 'unknown',
               ownerUsername: owner?.user?.username || 'unknown',
               ownerGlobalName: owner?.user?.globalName || owner?.user?.username || 'unknown',
               invite: null,
               memberCount: guild.memberCount,
               createdAt: new Date().toISOString(),
            };
            trackedGuilds.push(guildInfo);
            addedCount++;
            logger.info(`Added Existing Guild To Tracking ${guild.name} ${guild.id}`);
         }
      }
      if (addedCount > 0) {
         await saveTrackedGuilds();
         logger.info(`Sync Complete Added ${addedCount} Existing Guilds To Tracking`);
      } else {
         logger.info('Sync Complete All Guilds Already Tracked');
      }
   } catch (err) {
      logger.error('Failed To Sync Tracked Guilds');
   }
}
client.on('guildCreate', async (guild) => {
   try {
      const owner = await guild.fetchOwner();
      const guildInfo = {
         guildId: guild.id,
         guildName: guild.name,
         ownerId: owner.id,
         ownerUsername: owner.user.username,
         ownerGlobalName: owner.user.globalName || owner.user.username,
         invite: null,
         memberCount: guild.memberCount,
         createdAt: new Date().toISOString(),
      };
      trackedGuilds.push(guildInfo);
      await saveTrackedGuilds();
      logger.info(`Added New Guild ${guild.name} ${guild.id}`);
   } catch (err) {
      logger.error('Failed To Track New Guild');
   }
});
client.on('guildDelete', async (guild) => {
   const initialLength = trackedGuilds.length;
   trackedGuilds = trackedGuilds.filter((g) => g.guildId !== guild.id);
   if (trackedGuilds.length < initialLength) {
      await saveTrackedGuilds();
      logger.info(`Removed Guild ${guild.name} ${guild.id}`);
   }
});
loadTrackedGuilds();
client.once('clientReady', () => {
   setTimeout(() => {
      syncTrackedGuilds();
   }, 5000);
});
module.exports.trackedGuilds = trackedGuilds;
module.exports.saveTrackedGuilds = saveTrackedGuilds;
module.exports.loadTrackedGuilds = loadTrackedGuilds;
module.exports.syncTrackedGuilds = syncTrackedGuilds;
module.exports.cleanupTrackedGuilds = cleanupTrackedGuilds;
