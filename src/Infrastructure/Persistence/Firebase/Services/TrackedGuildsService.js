const logger = require('@infrastructure/Logging/Logger');
const { db, isFirebaseReady } = require('@infrastructure/Persistence/Firebase/FirebaseClient');
const { deepCloneForFirebase } = require('@infrastructure/Persistence/Firebase/Utils/FirebaseClone');

async function loadTrackedGuildsFromFirebase() {
    if (!isFirebaseReady || !db) {
        logger.warn('Firebase Not Available Returning Empty Tracked Guilds');
        return [];
    }
    try {
        const snapshot = await db.ref('tracked_guilds').once('value');
        const data = snapshot.val();
        if (data && Array.isArray(data)) {
            logger.db('Tracked Guilds Loaded From Firebase ' + data.length + ' Guilds');
            return data;
        }
        logger.db('No Tracked Guilds Found In Firebase');
        return [];
    } catch (error) {
        logger.error('Error Loading Tracked Guilds From Firebase');
        return [];
    }
}

async function saveTrackedGuildsToFirebase(data) {
    if (!isFirebaseReady || !db) {
        logger.warn('Firebase Not Available Tracked Guilds Not Saved');
        return false;
    }
    try {
        const cleanData = deepCloneForFirebase(Array.isArray(data) ? data : []);
        await db.ref('tracked_guilds').set(cleanData);
        logger.db('Tracked Guilds Saved To Firebase ' + (Array.isArray(data) ? data.length : 0) + ' Guilds');
        return true;
    } catch (error) {
        logger.error('Error Saving Tracked Guilds To Firebase');
        return false;
    }
}

module.exports.loadTrackedGuildsFromFirebase = loadTrackedGuildsFromFirebase;
module.exports.saveTrackedGuildsToFirebase = saveTrackedGuildsToFirebase;
