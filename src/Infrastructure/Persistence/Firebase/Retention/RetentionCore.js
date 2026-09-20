const logger = require('@infrastructure/Logging/Logger');
const { db, isFirebaseReady } = require('@infrastructure/Persistence/Firebase/FirebaseIndex');
const { deepCloneForFirebase } = require('@infrastructure/Persistence/Firebase/Utils/FirebaseClone');
const { ChannelType } = require('discord.js');
const { channel_names } = require('@config/Constants');

const retention_days = 15;
const retention_ms = retention_days * 24 * 60 * 60 * 1000;
const cleanupInterval = 24 * 60 * 60 * 1000;
const RETENTION_INDEX_PATH = 'retention_index';

function getFirebaseServices() {
    // Lazy load firebase services
    const firebase = require('@infrastructure/Persistence/Firebase/FirebaseIndex');
    return {
        loadSetupGuildsFromFirebase: firebase.loadSetupGuildsFromFirebase,
        saveSetupGuildsToFirebase: firebase.saveSetupGuildsToFirebase,
        loadGuildStatesFromFirebase: firebase.loadGuildStatesFromFirebase,
        saveGuildStatesToFirebase: firebase.saveGuildStatesToFirebase,
        loadControlIdsFromFirebase: firebase.loadControlIdsFromFirebase,
        saveControlIdsToFirebase: firebase.saveControlIdsToFirebase,
    };
}

async function markGuildAsLeft(guildId) {
    if (!isFirebaseReady || !db) return;
    const now = Date.now();

    const updates = {};
    updates[`${RETENTION_INDEX_PATH}/${guildId}/isLeft`] = true;
    updates[`${RETENTION_INDEX_PATH}/${guildId}/leftAt`] = now;
    await db.ref().update(updates);

    if (global.guildStates) global.guildStates.delete(guildId);

    if (global.setupGuilds) delete global.setupGuilds[guildId];
    // logger.db(`Guild ${guildId} marked as left in retention index at ${now}`);
}

async function markGuildAsPresent(guildId) {
    if (!isFirebaseReady || !db) return;
    await db.ref(`${RETENTION_INDEX_PATH}/${guildId}`).remove();

    logger.db(`Guild ${guildId} marked as present (removed from retention index)`);
}

async function clearGuildData(guildId) {
    if (!isFirebaseReady || !db) {
        return false;
    }

    try {
        const updates = {
            [`setup_guilds/${guildId}`]: null,
            [`guild_states/${guildId}`]: null,
            [`${RETENTION_INDEX_PATH}/${guildId}`]: null,
        };

        const controlSnapshot = await db.ref(`control_ids/${guildId}`).once('value');

        if (controlSnapshot.exists()) {
            updates[`control_ids/${guildId}`] = null;
        }

        const trackedSnapshot = await db.ref('tracked_guilds').once('value');
        const trackedGuilds = trackedSnapshot.val() || [];
        const filteredTrackedGuilds = trackedGuilds.filter((guild) => guild.guildId !== guildId);

        if (filteredTrackedGuilds.length !== trackedGuilds.length) {
            updates.tracked_guilds = deepCloneForFirebase(filteredTrackedGuilds);
        }
        await db.ref().update(updates);
        global.guildStates?.delete(guildId);
        if (global.setupGuilds) {
            delete global.setupGuilds[guildId];
        }
        logger.db(`Cleared all stored data for guild ${guildId}`);
        return true;
    } catch (error) {
        logger.error('Failed to clear guild data', error);

        return false;
    }
}

async function isWithinRetentionGracePeriod(guildId) {
    if (!db) return false;
    const snap = await db.ref(`${RETENTION_INDEX_PATH}/${guildId}`).once('value');
    const data = snap.val();
    if (!data || !data.isLeft || !data.leftAt) return false;
    return Date.now() - data.leftAt < retention_ms;
}

module.exports.retention_days = retention_days;
module.exports.retention_ms = retention_ms;
module.exports.cleanupInterval = cleanupInterval;
module.exports.RETENTION_INDEX_PATH = RETENTION_INDEX_PATH;
module.exports.getFirebaseServices = getFirebaseServices;
module.exports.markGuildAsLeft = markGuildAsLeft;
module.exports.markGuildAsPresent = markGuildAsPresent;
module.exports.clearGuildData = clearGuildData;
module.exports.isWithinRetentionGracePeriod = isWithinRetentionGracePeriod;
