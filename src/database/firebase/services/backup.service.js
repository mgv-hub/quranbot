const logger = require('@logging/logger');
const { db, isFirebaseReady } = require('@database/firebase/client');
const { deepCloneForFirebase } = require('@database/firebase/utils/clone');
const {
    loadSetupGuildsFromFirebase,
    loadGuildStatesFromFirebase,
    loadControlIdsFromFirebase,
} = require('@database/firebase/services/guilds.service');
const retentiondb = require('@database/firebase/retention/retention');

async function clearGuildData(guildId) {
    return await retentiondb.clearGuildData(guildId);
}

async function backupAllData() {
    if (!isFirebaseReady || !db) {
        logger.warn('Firebase Not Available Cannot Backup Data');
        return false;
    }
    try {
        const setupGuilds = await loadSetupGuildsFromFirebase();
        const guildStates = await loadGuildStatesFromFirebase();
        const controlIds = await loadControlIdsFromFirebase();
        const dhikrSnapshot = await db.ref('dhikr_data').once('value');
        const dhikrData = dhikrSnapshot.val();
        const backupData = {
            setupGuilds: setupGuilds,
            guildStates: guildStates,
            controlIds: controlIds,
            dhikrData: dhikrData,
            timestamp: Date.now(),
        };
        const firebaseReadyData = deepCloneForFirebase(backupData);
        await db.ref('backup/last').set(firebaseReadyData);
        logger.db('Full Backup Created Successfully');
        return true;
    } catch (error) {
        logger.error('Error Creating Full Backup');
        return false;
    }
}
module.exports.clearGuildData = clearGuildData;
module.exports.backupAllData = backupAllData;
