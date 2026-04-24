require('pathlra-aliaser')();
const logger = require('@logger');
const { ref, set, get, serverTimestamp, increment, update } = require('firebase/database');
const { db, isFirebaseReady } = require('@firebase-core_utils');
const STATS_UPDATE_INTERVAL_MS = 60000;
const STATS_PATH = 'bot_statistics';
let statsInterval = null;
let isStatsInitialized = false;

let localStats = {
   totalServers: 0,
   recitations: 0,
   versesSent: 0,
   commandsUsed: 0,
   activeToday: 0,
   azkarSent: 0,
   uptime: 99.9,
   voiceConnections: 0,
   lastUpdated: null,
};

async function initializeStats() {
   if (isStatsInitialized) {
      logger.info('Statistics already initialized');
      return;
   }
   if (!isFirebaseReady || !db) {
      setTimeout(() => initializeStats(), 5000);
      return;
   }
   try {
      const snapshot = await get(ref(db, STATS_PATH));
      if (snapshot.exists()) {
         localStats = snapshot.val();
      } else {
         const initialStats = {
            totalServers: 0,
            recitations: 0,
            commandsUsed: 0,
            activeToday: 0,
            azkarSent: 0,
            uptime: 99.9,
            voiceConnections: 0,
            lastUpdated: serverTimestamp(),
         };
         await set(ref(db, STATS_PATH), initialStats);
         localStats = initialStats;
      }
      isStatsInitialized = true;
   } catch (error) {
      setTimeout(() => initializeStats(), 5000);
   }
}
module.exports.initializeStats = initializeStats;

function getConnectedVoiceCount() {
   let count = 0;
   const client = global.client;
   if (!client) return 0;
   if (client.guilds && client.guilds.cache) {
      client.guilds.cache.forEach((guild) => {
         if (
            guild.members &&
            guild.members.me &&
            guild.members.me.voice &&
            guild.members.me.voice.channelId
         ) {
            count++;
         }
      });
   }
   if (count === 0 && global.guildStates) {
      for (const [guildId, state] of global.guildStates.entries()) {
         if (state.connection && !state.connection.destroyed && state.channelId) {
            const actualGuild = client.guilds.cache.get(guildId);
            if (
               actualGuild &&
               actualGuild.members &&
               actualGuild.members.me &&
               actualGuild.members.me.voice &&
               actualGuild.members.me.voice.channelId
            ) {
               count++;
            }
         }
      }
   }
   if (count === 0 && client.voice && client.voice.adapters) {
      count = client.voice.adapters.size;
   }
   return count;
}

async function updateStats() {
   if (!isFirebaseReady || !db) return;
   if (!global.client) return;
   try {
      const guildCount = global.client.guilds.cache.size;
      const uptime = global.client.uptime || 0;
      const uptimePercent = Math.min(99.9, 99 + (uptime / 86400000) * 0.9);
      const voiceCount = getConnectedVoiceCount();
      const updates = {
         totalServers: guildCount,
         uptime: parseFloat(uptimePercent.toFixed(1)),
         voiceConnections: voiceCount,
         lastUpdated: serverTimestamp(),
      };
      await update(ref(db, STATS_PATH), updates);
   } catch (error) {}
}

function incrementStat(statName, amount = 1) {
   if (!isStatsInitialized) {
      logger.warn('Statistics not initialized yet skipping incremen', statName);
      return;
   }
   if (!isFirebaseReady || !db) {
      return;
   }
   try {
      const updates = {};
      updates[`${statName}`] = increment(amount);
      updates[`lastUpdated`] = serverTimestamp();
      update(ref(db, STATS_PATH), updates)
         .then(() => {})
         .catch((error) => {
            logger.error(`Error ${statName}`, error);
         });
   } catch (error) {}
}
module.exports.incrementStat = incrementStat;

function startStatsTracker() {
   if (statsInterval) {
      clearInterval(statsInterval);
   }
   updateStats();
   statsInterval = setInterval(updateStats, STATS_UPDATE_INTERVAL_MS);
}
module.exports.startStatsTracker = startStatsTracker;

module.exports.updateStats = updateStats;

function stopStatsTracker() {
   if (statsInterval) {
      clearInterval(statsInterval);
      statsInterval = null;
      logger.info('tracker stopped');
   }
}
module.exports.stopStatsTracker = stopStatsTracker;

function getIsInitialized() {
   return isStatsInitialized;
}
module.exports.getIsInitialized = getIsInitialized;
