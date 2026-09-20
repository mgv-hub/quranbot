const logger = require('@infrastructure/Logging/Logger');
const { db, isFirebaseReady } = require('@infrastructure/Persistence/Firebase/FirebaseClient');
const { deepCloneForFirebase } = require('@infrastructure/Persistence/Firebase/Utils/FirebaseClone');

async function loadPrayerRemindersFromFirebase() {
    if (!isFirebaseReady || !db) {
        logger.warn('Firebase Not Available Returning Empty Prayer Reminders');
        return {};
    }
    try {
        const snapshot = await db.ref('prayer_reminders').once('value');
        const data = snapshot.val();
        if (data) {
            logger.db('Loaded ' + Object.keys(data).length + ' Prayer Reminders From Firebase');
            return data;
        }
        return {};
    } catch (error) {
        logger.error('Error Loading Prayer Reminders From Firebase', error);
        return {};
    }
}

async function savePrayerReminderToFirebase(guildId, data) {
    if (!isFirebaseReady || !db) return false;
    try {
        const cleanData = deepCloneForFirebase(data);
        await db.ref(`prayer_reminders/${guildId}`).set(cleanData);
        logger.db('Saved Prayer Reminder For Guild ' + guildId);
        return true;
    } catch (error) {
        logger.error('Error Saving Prayer Reminder For Guild ' + guildId, error);
        return false;
    }
}

async function deletePrayerReminderFromFirebase(guildId) {
    if (!isFirebaseReady || !db) return false;
    try {
        await db.ref(`prayer_reminders/${guildId}`).remove();
        logger.db('Deleted Prayer Reminder For Guild ' + guildId);
        return true;
    } catch (error) {
        logger.error('Error Deleting Prayer Reminder For Guild ' + guildId, error);
        return false;
    }
}

module.exports.loadPrayerRemindersFromFirebase = loadPrayerRemindersFromFirebase;
module.exports.savePrayerReminderToFirebase = savePrayerReminderToFirebase;
module.exports.deletePrayerReminderFromFirebase = deletePrayerReminderFromFirebase;
