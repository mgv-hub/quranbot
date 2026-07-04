const client = require('./client');

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

const clone = require('./utils/clone');
const complaints = require('./services/complaints.service');
const cooldowns = require('./services/cooldowns.service');
const guilds = require('./services/guilds.service');
const controlIds = require('./services/controlIds.service');
const cache = require('./services/cache.service');
const trackedGuilds = require('./services/trackedGuilds.service');
const backup = require('./services/backup.service');
const retention = require('./services/retention.service');
const notificationRoles = require('./services/notificationRoles.service');

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
