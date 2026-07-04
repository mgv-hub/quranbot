const coreLoader = require('@bot/bootstrap');
const { cache_config, memory_config, limits } = require('@config/constants');

const interactionCache = new Map();
const embedCache = new Map();

const max_interaction_cache_size = cache_config.interaction.max_size;
const interaction_cache_ttl_ms = cache_config.interaction.ttl_ms;
const memory_cleanup_interval_ms = memory_config.cleanup_interval_ms;
const memory_check_interval_ms = memory_config.check_interval_ms;
const high_memory_threshold_mb = memory_config.high_threshold_mb;
const max_concurrent_guilds = limits.max_concurrent_guilds;

const activeGuildPlays = new Map();

function canPlayAudio(guildId) {
    const activeCount = Array.from(activeGuildPlays.values()).filter((v) => v).length;
    if (activeCount >= max_concurrent_guilds) {
        return false;
    }
    return true;
}

function setGuildPlaying(guildId, isPlaying) {
    if (isPlaying) {
        activeGuildPlays.set(guildId, Date.now());
    } else {
        activeGuildPlays.delete(guildId);
    }
}

function setupMemoryManagement() {
    setInterval(() => {
        cleanupMemory();
    }, memory_cleanup_interval_ms);

    setInterval(() => {
        const memoryStats = process.memoryUsage();
        const heapUsedMB = memoryStats.heapUsed / 1024 / 1024;

        if (heapUsedMB > high_memory_threshold_mb) {
            coreLoader.logger.warn(`High Memory Usage ${heapUsedMB.toFixed(2)}MB`);
            aggressiveMemoryCleanup();
        }
    }, memory_check_interval_ms);
}

function cleanupMemory() {
    const currentTime = Date.now();
    for (const [cacheKey, timestamp] of interactionCache.entries()) {
        if (currentTime - timestamp > interaction_cache_ttl_ms) {
            interactionCache.delete(cacheKey);
        }
    }

    const EMBED_CACHE_TTL = 30000;
    for (const [cacheKey, { timestamp, active }] of embedCache.entries()) {
        const effectiveTTL = active ? EMBED_CACHE_TTL : EMBED_CACHE_TTL * 2;
        if (currentTime - timestamp > effectiveTTL) {
            embedCache.delete(cacheKey);
        }
    }

    const now = Date.now();
    for (const [gid, ts] of activeGuildPlays.entries()) {
        if (now - ts > 3600000) activeGuildPlays.delete(gid);
    }
}

function aggressiveMemoryCleanup() {
    try {
        const interactionEntries = Array.from(interactionCache.entries());
        const interactionToRemove = Math.max(1, Math.floor(interactionEntries.length / 2));
        for (let i = 0; i < interactionToRemove; i++) {
            interactionCache.delete(interactionEntries[i][0]);
        }

        const embedEntries = Array.from(embedCache.entries());
        const embedToRemove = Math.max(1, Math.floor(embedEntries.length / 3));
        for (let i = 0; i < embedToRemove; i++) {
            embedCache.delete(embedEntries[i][0]);
        }
        activeGuildPlays.clear();
        if (global.gc) {
            global.gc();
        }

        coreLoader.logger.info('Memory Cleaned Up Successfully');
    } catch (error) {
        coreLoader.logger.error('Aggressive Memory Cleanup Failed');
    }
}

setupMemoryManagement();

module.exports.interactionCache = interactionCache;
module.exports.embedCache = embedCache;
module.exports.max_interaction_cache_size = max_interaction_cache_size;
module.exports.interaction_cache_ttl_ms = interaction_cache_ttl_ms;
module.exports.canPlayAudio = canPlayAudio;
module.exports.setGuildPlaying = setGuildPlaying;
module.exports.cleanupMemory = cleanupMemory;
module.exports.aggressiveMemoryCleanup = aggressiveMemoryCleanup;
