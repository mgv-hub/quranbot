const logger = require('@infrastructure/Logging/Logger');
const { db, isFirebaseReady } = require('@infrastructure/Persistence/Firebase/FirebaseClient');

async function loadUserCooldownFromFirebase(userId) {
    if (!isFirebaseReady || !db) return null;
    try {
        const snapshot = await db.ref('complaint_cooldowns/' + userId).once('value');
        return snapshot.val();
    } catch (error) {
        logger.warn('Firebase Cooldown Read Failed');
        return null;
    }
}

async function saveUserCooldownToFirebase(userId, timestamp) {
    if (!isFirebaseReady || !db) return false;
    try {
        await db.ref('complaint_cooldowns/' + userId).set({
            lastSubmission: timestamp,
            cooldownHours: 24,
        });
        return true;
    } catch (error) {
        logger.warn('Firebase Cooldown Save Failed');
        return false;
    }
}

module.exports.loadUserCooldownFromFirebase = loadUserCooldownFromFirebase;
module.exports.saveUserCooldownToFirebase = saveUserCooldownToFirebase;
