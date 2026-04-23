require('pathlra-aliaser')();
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, set, get, push, serverTimestamp, remove, update } = require('firebase/database');
const logger = require('@logger');
require('../package/Envira/src/lib/main');
const firebaseConfig = {
   apiKey: process.env.FIREBASE_API_KEY,
   authDomain: process.env.FIREBASE_AUTH_DOMAIN,
   databaseURL: process.env.FIREBASE_DATABASE_URL,
   projectId: process.env.FIREBASE_PROJECT_ID,
   storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
   messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
   appId: process.env.FIREBASE_APP_ID,
   measurementId: process.env.FIREBASE_MEASUREMENT_ID,
};
let db = null;
let isFirebaseReady = false;
let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 5;
function isPlainObject(obj) {
   return (
      obj !== null && typeof obj === 'object' && !Array.isArray(obj) && Object.getPrototypeOf(obj) === Object.prototype
   );
}
function deepCloneForFirebase(obj) {
   if (obj === null || typeof obj !== 'object') return obj;
   if (Array.isArray(obj)) return obj.map((item) => deepCloneForFirebase(item));
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
   if (isFirebaseReady && db) return true;
   try {
      const app = initializeApp(firebaseConfig);
      db = getDatabase(app);
      isFirebaseReady = true;
      logger.info('Firebase Realtime Database Initialized Successfully');
      logger.info('Connected To ' + firebaseConfig.databaseURL);
      return true;
   } catch (error) {
      connectionAttempts++;
      logger.error('Firebase Initialization Failed Attempt ' + connectionAttempts + '/' + MAX_CONNECTION_ATTEMPTS);
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
      const newComplaintRef = push(ref(db, 'complaints'));
      const cleanComplaint = deepCloneForFirebase({
         ...complaint,
         complaintId: newComplaintRef.key,
         submittedAt: serverTimestamp(),
      });
      await set(newComplaintRef, cleanComplaint);
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
      const snapshot = await get(ref(db, 'complaint_cooldowns/' + userId));
      return snapshot.val();
   } catch (error) {
      logger.warn('Firebase Cooldown Read Failed');
      return null;
   }
}
async function saveUserCooldownToFirebase(userId, timestamp) {
   if (!isFirebaseReady || !db) return false;
   try {
      await set(ref(db, 'complaint_cooldowns/' + userId), { lastSubmission: timestamp, cooldownHours: 24 });
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
      const snapshot = await get(ref(db, 'setup_guilds'));
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
         if (!cleanData[guildId]) cleanData[guildId] = {};
         for (const [key, value] of Object.entries(state)) {
            if (value !== undefined && value !== null) cleanData[guildId][key] = deepCloneForFirebase(value);
         }
      }
      await set(ref(db, 'setup_guilds'), cleanData);
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
      const snapshot = await get(ref(db, 'control_ids'));
      const data = snapshot.val();
      if (data) return data;
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
      await set(ref(db, 'control_ids'), cleanData);
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
      const snapshot = await get(ref(db, 'cached_data'));
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
      await set(ref(db, 'cached_data'), cleanData);
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
      const snapshot = await get(ref(db, 'guild_states'));
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
         if (!cleanData[guildId]) cleanData[guildId] = {};
         for (const [key, value] of Object.entries(state)) {
            if (value !== undefined && value !== null) cleanData[guildId][key] = deepCloneForFirebase(value);
         }
      }
      const firebaseReadyData = deepCloneForFirebase(cleanData);
      await set(ref(db, 'guild_states'), firebaseReadyData);
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
      const snapshot = await get(ref(db, 'tracked_guilds'));
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
      await set(ref(db, 'tracked_guilds'), cleanData);
      logger.info('Tracked Guilds Saved To Firebase ' + (Array.isArray(data) ? data.length : 0) + ' Guilds');
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
      if (!currentData[guildId]) currentData[guildId] = {};
      if (!currentData[guildId][channelId]) currentData[guildId][channelId] = [];
      currentData[guildId][channelId].push(messageId);
      const cleanData = deepCloneForFirebase(currentData);
      await set(ref(db, 'control_ids'), cleanData);
      logger.info('Saved Dhikr Message Id For Guild ' + guildId);
      return true;
   } catch (error) {
      logger.error('Error Saving Dhikr Message Id To Firebase');
      return false;
   }
}
async function clearGuildData(guildId) {
   logger.warn('Clear Guild Data Called For ' + guildId + ' Operation Blocked To Preserve Data');
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
      const dhikrData = await get(ref(db, 'dhikr_data')).then((s) => s.val());
      const backupData = { setupGuilds, guildStates, controlIds, dhikrData, timestamp: Date.now() };
      const firebaseReadyData = deepCloneForFirebase(backupData);
      await set(ref(db, 'backup/last'), firebaseReadyData);
      logger.info('Full Backup Created Successfully');
      return true;
   } catch (error) {
      logger.error('Error Creating Full Backup');
      return false;
   }
}
async function loadLogChannelsFromFirebase() {
   if (!isFirebaseReady || !db) {
      logger.warn('Firebase Not Available Returning Empty Log Channels');
      return {};
   }
   try {
      const snapshot = await get(ref(db, 'log_channels'));
      const data = snapshot.val();
      if (data) {
         logger.info('Loaded ' + Object.keys(data).length + ' Log Channels From Firebase');
         return data;
      }
      logger.info('No Log Channels Found In Firebase');
      return {};
   } catch (error) {
      logger.error('Error Loading Log Channels From Firebase');
      return {};
   }
}
async function saveLogChannelsToFirebase(data) {
   if (!isFirebaseReady || !db) {
      logger.warn('Firebase Not Available Log Channels Not Saved');
      return false;
   }
   try {
      const cleanData = deepCloneForFirebase(data);
      await set(ref(db, 'log_channels'), cleanData);
      logger.info('Saved ' + Object.keys(data).length + ' Log Channels To Firebase');
      return true;
   } catch (error) {
      logger.error('Error Saving Log Channels To Firebase');
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
module.exports.firebaseConfig = firebaseConfig;
module.exports.initializeFirebase = initializeFirebase;
module.exports.loadLogChannelsFromFirebase = loadLogChannelsFromFirebase;
module.exports.saveLogChannelsToFirebase = saveLogChannelsToFirebase;
