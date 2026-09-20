const logger = require('@infrastructure/Logging/Logger');
const { db, isFirebaseReady } = require('@infrastructure/Persistence/Firebase/FirebaseClient');
const { deepCloneForFirebase } = require('@infrastructure/Persistence/Firebase/Utils/FirebaseClone');

async function loadStatusFromFirebase() {
    if (!isFirebaseReady || !db) {
        logger.warn('Firebase Not Available Returning Empty Status');
        return {};
    }
    try {
        const snapshot = await db.ref('bot_status').once('value');
        const data = snapshot.val();
        if (data) {
            logger.db('Loaded Bot Status From Firebase');
            return data;
        }
        return {};
    } catch (error) {
        logger.error('Error Loading Bot Status From Firebase', error);
        return {};
    }
}

async function saveStatusToFirebase(data) {
    if (!isFirebaseReady || !db) {
        logger.warn('Firebase Not Available Status Not Saved');
        return false;
    }
    try {
        const cleanData = deepCloneForFirebase(data);
        await db.ref('bot_status').set(cleanData);
        logger.db('Bot Status Saved To Firebase');
        return true;
    } catch (error) {
        logger.error('Error Saving Bot Status To Firebase', error);
        return false;
    }
}

async function clearStatusFromFirebase() {
    if (!isFirebaseReady || !db) return false;
    try {
        await db.ref('bot_status').remove();
        logger.db('Bot Status Cleared From Firebase');
        return true;
    } catch (error) {
        logger.error('Error Clearing Bot Status From Firebase', error);
        return false;
    }
}

module.exports.loadStatusFromFirebase = loadStatusFromFirebase;
module.exports.saveStatusToFirebase = saveStatusToFirebase;
module.exports.clearStatusFromFirebase = clearStatusFromFirebase;
