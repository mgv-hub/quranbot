const logger = require('@logging/logger');
const { loadControlIdsFromFirebase, saveControlIdsToFirebase } = require('@database/firebase');

// in-memory cache + loaded flag
let cache = {};
let loaded = false;

async function loadCache() {
    if (loaded) return;
    cache = await loadControlIdsFromFirebase();
    loaded = true;
}

async function deleteOldMsgs(guildId, channelId, keepId) {
    if (!global.client) {
        logger.warn('Client not ready for msg deletion');
        return;
    }

    const oldIds = cache[guildId]?.[channelId];
    if (!Array.isArray(oldIds)) return;

    const channel = global.client.channels.cache.get(channelId) || (await global.client.channels.fetch(channelId).catch(() => null));
    if (!channel) return;

    for (const id of oldIds) {
        if (id === keepId) continue;
        try {
            const msg = await channel.messages.fetch(id).catch(() => null);
            if (msg) await msg.delete().catch(() => {});
        } catch {
            logger.debug(`Failed to delete old msg ${id}`);
        }
    }
}

async function saveControlId(guildId, channelId, msgId) {
    if (!loaded) await loadCache();

    await deleteOldMsgs(guildId, channelId, msgId);

    if (!cache[guildId]) cache[guildId] = {};
    cache[guildId][channelId] = [msgId];

    await saveControlIdsToFirebase(cache);
}

async function saveDhikrMessageId(guildId, channelId, msgId) {
    if (!loaded) await loadCache();

    if (!cache[guildId]) cache[guildId] = {};
    if (!cache[guildId][channelId]) cache[guildId][channelId] = [];

    cache[guildId][channelId].push(msgId);
    await saveControlIdsToFirebase(cache);
    logger.info(`Saved dhikr msg for guild ${guildId}`);
}

async function readControlIds() {
    if (!loaded) await loadCache();
    return cache;
}

async function removeControlId(guildId, channelId) {
    if (!loaded) await loadCache();

    if (cache[guildId]?.[channelId]) {
        cache[guildId][channelId] = [];
        await saveControlIdsToFirebase(cache);
    }
}

async function flushCache() {
    await saveControlIdsToFirebase(cache);
}

(async () => {
    try {
        await loadCache();
    } catch (err) {
        logger.error('Cache init failed', err);
    }
})();

module.exports.saveControlId = saveControlId;
module.exports.readControlIds = readControlIds;
module.exports.removeControlId = removeControlId;
module.exports.flushCache = flushCache;
module.exports.saveDhikrMessageId = saveDhikrMessageId;
