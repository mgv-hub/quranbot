require('pathlra-aliaser')();
const admin = require('firebase-admin');
const logger = require('@logger');
require('../package/Envira/src/lib/main');

const firebaseAdminConfig = {
   type: process.env.FIREBASE_ADMIN_TYPE,
   project_id: process.env.FIREBASE_ADMIN_PROJECT_ID,
   private_key_id: process.env.FIREBASE_ADMIN_PRIVATE_KEY_ID,
   databaseURL: process.env.FIREBASE_DATABASE_URL,
   private_key: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
   client_id: process.env.FIREBASE_ADMIN_CLIENT_ID,
   client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
   auth_uri: process.env.FIREBASE_ADMIN_AUTH_URI,
   token_uri: process.env.FIREBASE_ADMIN_TOKEN_URI,
   auth_provider_x509_cert_url: process.env.FIREBASE_ADMIN_AUTH_PROVIDER_X509_CERT_URL,
   client_x509_cert_url: process.env.FIREBASE_ADMIN_CLIENT_X509_CERT_URL,
};

let db = null;
let isFirebaseReady = false;
let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 5;

function isPlainObject(obj) {
   return (
      obj !== null &&
      typeof obj === 'object' &&
      !Array.isArray(obj) &&
      Object.getPrototypeOf(obj) === Object.prototype
   );
}

function deepCloneForFirebase(obj) {
   if (obj === null || typeof obj !== 'object') {
      return obj;
   }
   if (Array.isArray(obj)) {
      return obj.map((item) => deepCloneForFirebase(item));
   }
   if (isPlainObject(obj)) {
      const cloned = {};
      for (const [key, value] of Object.entries(obj)) {
         if (typeof value !== 'function' && !(value instanceof Promise)) {
            cloned[key] = deepCloneForFirebase(value);
         }
      }
      return cloned;
   }
   return String(obj);
}

async function initializeFirebase() {
   if (isFirebaseReady && db) {
      return true;
   }
   try {
      if (!admin.apps.length) {
         admin.initializeApp({
            credential: admin.credential.cert(firebaseAdminConfig),
            databaseURL: firebaseAdminConfig.databaseURL,
         });
      }
      db = admin.database();
      isFirebaseReady = true;
      logger.info('Firebase Admin Realtime Database Initialized Successfully');
      logger.info('Connected To ' + firebaseAdminConfig.databaseURL);
      return true;
   } catch (error) {
      connectionAttempts++;
      logger.error(
         'Firebase Admin Initialization Failed Attempt ' +
            connectionAttempts +
            '/' +
            MAX_CONNECTION_ATTEMPTS,
      );
      if (connectionAttempts < MAX_CONNECTION_ATTEMPTS) {
         await new Promise((resolve) => setTimeout(resolve, 2000 * connectionAttempts));
         return await initializeFirebase();
      }
      return false;
   }
}

initializeFirebase();

async function saveComplaintToFirebase(complaint) {
   if (!isFirebaseReady || !db) {
      logger.warn('Firebase Not Available Complaint Not Saved');
      return false;
   }
   try {
      const newComplaintRef = db.ref('complaints').push();
      const cleanComplaint = deepCloneForFirebase({
         ...complaint,
         complaintId: newComplaintRef.key,
         submittedAt: admin.database.ServerValue.TIMESTAMP,
      });
      await newComplaintRef.set(cleanComplaint);
      logger.info('Complaint Saved To Firebase With ID ' + newComplaintRef.key);
      return true;
   } catch (error) {
      logger.error('Error Saving Complaint To Firebase');
      return false;
   }
}

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

async function loadSetupGuildsFromFirebase() {
   if (!isFirebaseReady || !db) {
      logger.warn('Firebase Not Available Returning Empty Setup Guilds');
      return {};
   }
   try {
      const snapshot = await db.ref('setup_guilds').once('value');
      const data = snapshot.val();
      if (data) {
         logger.info('Loaded ' + Object.keys(data).length + ' Setup Guilds From Firebase');
         return data;
      }
      logger.info('No Setup Guilds Found In Firebase');
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
      const currentData = await loadSetupGuildsFromFirebase();
      const cleanData = deepCloneForFirebase({ ...currentData });
      for (const [guildId, state] of Object.entries(data)) {
         if (!cleanData[guildId]) {
            cleanData[guildId] = {};
         }
         for (const [key, value] of Object.entries(state)) {
            if (value !== undefined && value !== null) {
               cleanData[guildId][key] = deepCloneForFirebase(value);
            }
         }
      }
      await db.ref('setup_guilds').set(cleanData);
      logger.info('Saved ' + Object.keys(data).length + ' Setup Guilds To Firebase');
      return true;
   } catch (error) {
      logger.error('Error Saving Setup Guilds To Firebase');
      return false;
   }
}

async function loadControlIdsFromFirebase() {
   if (!isFirebaseReady || !db) {
      logger.warn('Firebase Not Available Returning Empty Control Ids');
      return {};
   }
   try {
      const snapshot = await db.ref('control_ids').once('value');
      const data = snapshot.val();
      if (data) {
         return data;
      }
      logger.info('No Control Ids Found In Firebase');
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
      return true;
   } catch (error) {
      logger.error('Error Saving Control Ids To Firebase');
      return false;
   }
}

async function loadCachedDataFromFirebase() {
   if (!isFirebaseReady || !db) {
      logger.warn('Firebase Not Available Returning Empty Cached Data');
      return {};
   }
   try {
      const snapshot = await db.ref('cached_data').once('value');
      const data = snapshot.val();
      if (data) {
         logger.info('Cached Data Loaded From Firebase');
         return data;
      }
      logger.info('No Cached Data Found In Firebase');
      return {};
   } catch (error) {
      logger.error('Error Loading Cached Data From Firebase');
      return {};
   }
}

async function saveCachedDataToFirebase(data) {
   if (!isFirebaseReady || !db) {
      logger.warn('Firebase Not Available Cached Data Not Saved');
      return false;
   }
   try {
      const cleanData = deepCloneForFirebase(data);
      await db.ref('cached_data').set(cleanData);
      logger.info('Cached Data Saved To Firebase');
      return true;
   } catch (error) {
      logger.error('Error Saving Cached Data To Firebase');
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
         logger.info('Loaded ' + Object.keys(data).length + ' Guild States From Firebase');
         return data;
      }
      logger.info('No Guild States Found In Firebase');
      return {};
   } catch (error) {
      logger.error('Error Loading Guild States From Firebase');
      return {};
   }
}

async function saveGuildStatesToFirebase(data) {
   if (!isFirebaseReady || !db) {
      logger.warn('Firebase Not Available Guild States Not Saved');
      return false;
   }
   try {
      const currentData = await loadGuildStatesFromFirebase();
      const cleanData = deepCloneForFirebase({ ...currentData });
      for (const [guildId, state] of Object.entries(data)) {
         if (!cleanData[guildId]) {
            cleanData[guildId] = {};
         }
         for (const [key, value] of Object.entries(state)) {
            if (value !== undefined && value !== null) {
               cleanData[guildId][key] = deepCloneForFirebase(value);
            }
         }
      }
      const firebaseReadyData = deepCloneForFirebase(cleanData);
      await db.ref('guild_states').set(firebaseReadyData);
      logger.info('Saved ' + Object.keys(data).length + ' Guild States To Firebase');
      return true;
   } catch (error) {
      logger.error('Error Saving Guild States To Firebase');
      return false;
   }
}

async function loadTrackedGuildsFromFirebase() {
   if (!isFirebaseReady || !db) {
      logger.warn('Firebase Not Available Returning Empty Tracked Guilds');
      return [];
   }
   try {
      const snapshot = await db.ref('tracked_guilds').once('value');
      const data = snapshot.val();
      if (data && Array.isArray(data)) {
         logger.info('Tracked Guilds Loaded From Firebase ' + data.length + ' Guilds');
         return data;
      }
      logger.info('No Tracked Guilds Found In Firebase');
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
      logger.info(
         'Tracked Guilds Saved To Firebase ' +
            (Array.isArray(data) ? data.length : 0) +
            ' Guilds',
      );
      return true;
   } catch (error) {
      logger.error('Error Saving Tracked Guilds To Firebase');
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

async function clearGuildData(guildId) {
   logger.warn(
      'Clear Guild Data Called For ' + guildId + ' Operation Blocked To Preserve Data',
   );
   return false;
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
      logger.info('Full Backup Created Successfully');
      return true;
   } catch (error) {
      logger.error('Error Creating Full Backup');
      return false;
   }
}

module.exports.db = db;
module.exports.isFirebaseReady = isFirebaseReady;
module.exports.saveComplaintToFirebase = saveComplaintToFirebase;
module.exports.loadUserCooldownFromFirebase = loadUserCooldownFromFirebase;
module.exports.saveUserCooldownToFirebase = saveUserCooldownToFirebase;
module.exports.loadSetupGuildsFromFirebase = loadSetupGuildsFromFirebase;
module.exports.saveSetupGuildsToFirebase = saveSetupGuildsToFirebase;
module.exports.loadControlIdsFromFirebase = loadControlIdsFromFirebase;
module.exports.saveControlIdsToFirebase = saveControlIdsToFirebase;
module.exports.loadCachedDataFromFirebase = loadCachedDataFromFirebase;
module.exports.saveCachedDataToFirebase = saveCachedDataToFirebase;
module.exports.loadGuildStatesFromFirebase = loadGuildStatesFromFirebase;
module.exports.saveGuildStatesToFirebase = saveGuildStatesToFirebase;
module.exports.loadTrackedGuildsFromFirebase = loadTrackedGuildsFromFirebase;
module.exports.saveTrackedGuildsToFirebase = saveTrackedGuildsToFirebase;
module.exports.saveDhikrMessageId = saveDhikrMessageId;
module.exports.clearGuildData = clearGuildData;
module.exports.backupAllData = backupAllData;
module.exports.firebaseAdminConfig = firebaseAdminConfig;
module.exports.initializeFirebase = initializeFirebase;
