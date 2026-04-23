require('pathlra-aliaser')();
const imp = require('@loader-core_bootstrap');
const interactionCache = new Map();
const embedCache = new Map();
const { CACHE_CONFIG, MEMORY_CONFIG, LIMITS } = require('@configConstants-core_utils');
const MAX_INTERACTION_CACHE_SIZE = CACHE_CONFIG.INTERACTION.MAX_SIZE;
const INTERACTION_CACHE_TTL_MS = CACHE_CONFIG.INTERACTION.TTL_MS;
const MEMORY_CLEANUP_INTERVAL_MS = MEMORY_CONFIG.CLEANUP_INTERVAL_MS;
const MEMORY_CHECK_INTERVAL_MS = MEMORY_CONFIG.CHECK_INTERVAL_MS;
const HIGH_MEMORY_THRESHOLD_MB = MEMORY_CONFIG.HIGH_THRESHOLD_MB;
const MAX_CONCURRENT_GUILDS = LIMITS.MAX_CONCURRENT_GUILDS;
const activeGuildPlays = new Map();

function canPlayAudio(guildId) {
   const activeCount = Array.from(activeGuildPlays.values()).filter((v) => v).length;
   if (activeCount >= MAX_CONCURRENT_GUILDS) {
      return false;
   }
   return true;
}

function setGuildPlaying(guildId, isPlaying) {
   activeGuildPlays.set(guildId, isPlaying);
}

function setupMemoryManagement() {
   setInterval(() => {
      cleanupMemory();
   }, MEMORY_CLEANUP_INTERVAL_MS);
   setInterval(() => {
      const memoryUsage = process.memoryUsage();
      const mbUsed = memoryUsage.heapUsed / 1024 / 1024;
      if (mbUsed > HIGH_MEMORY_THRESHOLD_MB) {
         imp.logger.warn(`High Memory Usage ${mbUsed.toFixed(2)}`);
         aggressiveMemoryCleanup();
      }
   }, MEMORY_CHECK_INTERVAL_MS);
}

function cleanupMemory() {
   const now = Date.now();
   for (const [key, timestamp] of interactionCache.entries()) {
      if (now - timestamp > INTERACTION_CACHE_TTL_MS) {
         interactionCache.delete(key);
      }
   }
   const EMBED_CACHE_TTL = 30000;
   for (const [key, { timestamp, active }] of embedCache.entries()) {
      const cacheTtl = active ? EMBED_CACHE_TTL : EMBED_CACHE_TTL * 2;
      if (now - timestamp > cacheTtl) {
         embedCache.delete(key);
      }
   }
}

function aggressiveMemoryCleanup() {
   try {
      const interactionEntries = Array.from(interactionCache.entries());
      const toRemove = Math.max(1, Math.floor(interactionEntries.length / 2));
      for (let i = 0; i < toRemove; i++) {
         interactionCache.delete(interactionEntries[i][0]);
      }
      const embedEntries = Array.from(embedCache.entries());
      const embedToRemove = Math.max(1, Math.floor(embedEntries.length / 3));
      for (let i = 0; i < embedToRemove; i++) {
         embedCache.delete(embedEntries[i][0]);
      }
      if (global.gc) {
         global.gc();
      }
      imp.logger.info('Memory Cleaned Up Successfully');
   } catch (error) {
      imp.logger.error('Aggressive Memory Cleanup Failed');
   }
}

setupMemoryManagement();

module.exports.interactionCache = interactionCache;
module.exports.embedCache = embedCache;
module.exports.MAX_INTERACTION_CACHE_SIZE = MAX_INTERACTION_CACHE_SIZE;
module.exports.INTERACTION_CACHE_TTL_MS = INTERACTION_CACHE_TTL_MS;
module.exports.canPlayAudio = canPlayAudio;
module.exports.setGuildPlaying = setGuildPlaying;
module.exports.cleanupMemory = cleanupMemory;
module.exports.aggressiveMemoryCleanup = aggressiveMemoryCleanup;
