const logger = require('@logging/logger');
const { db, isFirebaseReady } = require('@database/firebase/client');
const { deepCloneForFirebase } = require('@database/firebase/utils/clone');

async function loadControlIdsFromFirebase() {
    if (!isFirebaseReady || !db) {
        logger.warn('Firebase Not Available Returning Empty Control Ids');
        return {};
    }

    try {
        const snapshot = await db.ref('control_ids').once('value');
        const data = snapshot.val();
        logger.db('No Control Ids Found In Firebase');
        return {};
    } catch (error) {
        logger.error('Error Loading Control Ids From Firebase');
        return {};
    }
}

async function saveControlIdsToFirebase(data) {
    if (!isFirebaseReady || !db) {
        logger.warn('Firebase Not Available Control Ids Not Saved');
        return false;
    }
    try {
        const cleanData = deepCloneForFirebase(data);
        await db.ref('control_ids').set(cleanData);
        logger.db('Control Ids Saved To Firebase For ' + Object.keys(data).length + ' Guilds');
        return true;
    } catch (error) {
        logger.error('Error Saving Control Ids To Firebase');
        return false;
    }
}

async function saveDhikrMessageId(guildId, channelId, messageId) {
    if (!isFirebaseReady || !db) {
        logger.warn('Firebase Not Available Dhikr Message Id Not Saved');
        return false;
    }
    try {
        const currentData = await loadControlIdsFromFirebase();
        if (!currentData[guildId]) {
            currentData[guildId] = {};
        }
        if (!currentData[guildId][channelId]) {
            currentData[guildId][channelId] = [];
        }

        currentData[guildId][channelId].push(messageId);
        const cleanData = deepCloneForFirebase(currentData);
        await db.ref('control_ids').set(cleanData);
        logger.info('Saved Dhikr Message Id For Guild ' + guildId);
        return true;
    } catch (error) {
        logger.error('Error Saving Dhikr Message Id To Firebase');
        return false;
    }
}

module.exports.loadControlIdsFromFirebase = loadControlIdsFromFirebase;
module.exports.saveControlIdsToFirebase = saveControlIdsToFirebase;
module.exports.saveDhikrMessageId = saveDhikrMessageId;
