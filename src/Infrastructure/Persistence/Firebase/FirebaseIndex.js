const client = require('@infrastructure/Persistence/Firebase/FirebaseClient');

Object.defineProperty(module.exports, 'db', {
    get: () => client.db,
    enumerable: true,
    configurable: true,
});
Object.defineProperty(module.exports, 'isFirebaseReady', {
    get: () => client.isFirebaseReady,
    enumerable: true,
    configurable: true,
});

const clone = require('@infrastructure/Persistence/Firebase/Utils/FirebaseClone');
const complaints = require('@infrastructure/Persistence/Firebase/Services/ComplaintsService');
const cooldowns = require('@infrastructure/Persistence/Firebase/Services/CooldownsService');
const guilds = require('@infrastructure/Persistence/Firebase/Services/GuildsService');
const controlIds = require('@infrastructure/Persistence/Firebase/Services/ControlIdsService');
const cache = require('@infrastructure/Persistence/Firebase/Services/CacheService');
const trackedGuilds = require('@infrastructure/Persistence/Firebase/Services/TrackedGuildsService');
const backup = require('@infrastructure/Persistence/Firebase/Services/BackupService');
const retention = require('@infrastructure/Persistence/Firebase/Services/RetentionService');
const notificationRoles = require('@infrastructure/Persistence/Firebase/Services/NotificationRolesService');
const prayerReminders = require('@infrastructure/Persistence/Firebase/Services/PrayerRemindersService');
const status = require('@infrastructure/Persistence/Firebase/Services/StatusService');

module.exports.firebaseAdminConfig = client.firebaseAdminConfig;
module.exports.initializeFirebase = client.initializeFirebase;
module.exports.max_connection_attempts = client.max_connection_attempts;
module.exports.isPlainObject = clone.isPlainObject;
module.exports.deepCloneForFirebase = clone.deepCloneForFirebase;
module.exports.saveComplaintToFirebase = complaints.saveComplaintToFirebase;
module.exports.loadUserCooldownFromFirebase = cooldowns.loadUserCooldownFromFirebase;
module.exports.saveUserCooldownToFirebase = cooldowns.saveUserCooldownToFirebase;
module.exports.loadSetupGuildsFromFirebase = guilds.loadSetupGuildsFromFirebase;
module.exports.saveSetupGuildsToFirebase = guilds.saveSetupGuildsToFirebase;
module.exports.loadGuildStatesFromFirebase = guilds.loadGuildStatesFromFirebase;
module.exports.saveGuildStatesToFirebase = guilds.saveGuildStatesToFirebase;
module.exports.loadControlIdsFromFirebase = controlIds.loadControlIdsFromFirebase;
module.exports.saveControlIdsToFirebase = controlIds.saveControlIdsToFirebase;
module.exports.saveDhikrMessageId = controlIds.saveDhikrMessageId;
module.exports.loadCachedDataFromFirebase = cache.loadCachedDataFromFirebase;
module.exports.saveCachedDataToFirebase = cache.saveCachedDataToFirebase;
module.exports.loadTrackedGuildsFromFirebase = trackedGuilds.loadTrackedGuildsFromFirebase;
module.exports.saveTrackedGuildsToFirebase = trackedGuilds.saveTrackedGuildsToFirebase;
module.exports.clearGuildData = backup.clearGuildData;
module.exports.backupAllData = backup.backupAllData;
module.exports.cleanExpiredLeftData = retention.cleanExpiredLeftData;
module.exports.markGuildAsLeft = retention.markGuildAsLeft;
module.exports.markGuildAsPresent = retention.markGuildAsPresent;
module.exports.loadPrayerRemindersFromFirebase = prayerReminders.loadPrayerRemindersFromFirebase;
module.exports.savePrayerReminderToFirebase = prayerReminders.savePrayerReminderToFirebase;
module.exports.deletePrayerReminderFromFirebase = prayerReminders.deletePrayerReminderFromFirebase;
module.exports.loadStatusFromFirebase = status.loadStatusFromFirebase;
module.exports.saveStatusToFirebase = status.saveStatusToFirebase;
module.exports.clearStatusFromFirebase = status.clearStatusFromFirebase;
