const logger = require('@infrastructure/Logging/Logger');
const { db, isFirebaseReady } = require('@infrastructure/Persistence/Firebase/FirebaseClient');
const { deepCloneForFirebase } = require('@infrastructure/Persistence/Firebase/Utils/FirebaseClone');

async function loadSetupGuildsFromFirebase() {
    if (!isFirebaseReady || !db) {
        logger.warn('Firebase Not Available Returning Empty Setup Guilds');
        return {};
    }
    try {
        const snapshot = await db.ref('setup_guilds').once('value');
        const data = snapshot.val();
        if (data) {
            logger.db('Loaded ' + Object.keys(data).length + ' Setup Guilds From Firebase');
            return data;
        }
        logger.db('No Setup Guilds Found In Firebase');
        return {};
    } catch (error) {
        logger.error('Error Loading Setup Guilds From Firebase');
        return {};
    }
}

async function saveSetupGuildsToFirebase(data) {
    if (!isFirebaseReady || !db) {
        logger.warn('Firebase Not Available Setup Guilds Not Saved');
        return false;
    }
    try {
        const cleanData = deepCloneForFirebase(data);
        await db.ref('setup_guilds').set(cleanData);
        logger.db('Saved ' + Object.keys(data).length + ' Setup Guilds To Firebase');
        return true;
    } catch (error) {
        logger.error('Error Saving Setup Guilds To Firebase', error);
        return false;
    }
}

async function loadGuildStatesFromFirebase() {
    if (!isFirebaseReady || !db) {
        logger.warn('Firebase Not Available Returning Empty Guild States');
        return {};
    }
    try {
        const snapshot = await db.ref('guild_states').once('value');
        const data = snapshot.val();
        if (data) {
            logger.db('Loaded ' + Object.keys(data).length + ' Guild States From Firebase');
            return data;
        }
        logger.db('No Guild States Found In Firebase');
        return {};
    } catch (error) {
        logger.error('Error Loading Guild States From Firebase');
        return {};
    }
}

// Simplified merge + single safe clone pass to eliminate reference leaks & stack overflows
async function updateSingleGuildStateInFirebase(guildId, cleanState) {
    if (!isFirebaseReady || !db) {
        logger.warn('Firebase Not Available, Guild State Not Updated');
        return false;
    }
    try {
        const updates = {};
        updates[`guild_states/${guildId}`] = cleanState;
        await db.ref().update(updates);
        logger.db('Updated State');
        return true;
    } catch (error) {
        logger.error('Error Updating Guild State In Firebase', error);
        return false;
    }
}

async function saveGuildStatesToFirebase(data) {
    if (!isFirebaseReady || !db) {
        logger.warn('Firebase Not Available Guild States Not Saved');
        return false;
    }
    try {
        const firebaseReadyData = deepCloneForFirebase(data);
        await db.ref('guild_states').set(firebaseReadyData);
        logger.db('Saved ' + Object.keys(data).length + ' Guild States To Firebase');
        return true;
    } catch (error) {
        logger.error('Error Saving Guild States To Firebase', error);
        return false;
    }
}

module.exports.loadSetupGuildsFromFirebase = loadSetupGuildsFromFirebase;
module.exports.saveSetupGuildsToFirebase = saveSetupGuildsToFirebase;
module.exports.loadGuildStatesFromFirebase = loadGuildStatesFromFirebase;
module.exports.saveGuildStatesToFirebase = saveGuildStatesToFirebase;
module.exports.updateSingleGuildStateInFirebase = updateSingleGuildStateInFirebase;
