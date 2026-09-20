const logger = require('@infrastructure/Logging/Logger');
const { db, isFirebaseReady } = require('@infrastructure/Persistence/Firebase/FirebaseClient');

async function getNotificationRolesMessageId() {
    if (!isFirebaseReady || !db) return null;
    try {
        const snap = await db.ref('notification_roles/message_id').once('value');
        return snap.val();
    } catch (err) {
        logger.error(err);
        return null;
    }
}

async function saveNotificationRolesMessageId(messageId) {
    if (!isFirebaseReady || !db) return false;
    try {
        await db.ref('notification_roles/message_id').set(messageId);
        return true;
    } catch (err) {
        logger.error(err);
        return false;
    }
}

module.exports.getNotificationRolesMessageId = getNotificationRolesMessageId;
module.exports.saveNotificationRolesMessageId = saveNotificationRolesMessageId;
