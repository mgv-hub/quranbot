require('pathlra-aliaser');

const logger = require('@logger');
const { saveGuildStatesToFirebase, loadGuildStatesFromFirebase } = require('@firebase-core_utils');
const { isPlainObject, deepCloneForFirebase, deepMerge } = require('@persist-utils-core_state');

const SAVE_DEBOUNCE_MS = 60000;
const SAVE_THROTTLE_MS = 10000;
const SAVE_ALL_THROTTLE_MS = 15000;

let lastSaveTime = 0;
const saveTimeouts = new Map();

async function saveGuildState(guildId, guildStates, cleanStateFn) {
   const isInitialized = true;
   if (!isInitialized) return;
   const now = Date.now();
   if (now - lastSaveTime < SAVE_THROTTLE_MS) {
      return;
   }
   lastSaveTime = now;
   try {
      const currentFirebaseData = await loadGuildStatesFromFirebase();
      const localState = guildStates.get(guildId);
      if (!localState) return;
      const cleanLocalState = cleanStateFn(localState);
      if (!currentFirebaseData[guildId]) {
         currentFirebaseData[guildId] = {};
      }
      deepMerge(currentFirebaseData[guildId], cleanLocalState);
      currentFirebaseData[guildId].timestamp = Date.now();
      const firebaseReadyData = deepCloneForFirebase(currentFirebaseData);
      await saveGuildStatesToFirebase(firebaseReadyData);
      logger.info('Saved State For Guild ' + guildId);
   } catch (error) {
      logger.error('Failed To Save State For Guild ' + guildId, error);
   }
}

async function saveAllStates(guildStates, cleanStateFn) {
   const isInitialized = true;
   if (!isInitialized) return;
   const now = Date.now();
   if (now - lastSaveTime < SAVE_ALL_THROTTLE_MS) {
      return;
   }
   lastSaveTime = now;
   try {
      const currentFirebaseData = await loadGuildStatesFromFirebase();
      for (const [guildId, localState] of guildStates.entries()) {
         const cleanLocalState = cleanStateFn(localState);
         if (!currentFirebaseData[guildId]) {
            currentFirebaseData[guildId] = {};
         }
         deepMerge(currentFirebaseData[guildId], cleanLocalState);
         currentFirebaseData[guildId].timestamp = Date.now();
      }
      const firebaseReadyData = deepCloneForFirebase(currentFirebaseData);
      await saveGuildStatesToFirebase(firebaseReadyData);
      logger.info('Saved All ' + guildStates.size + ' Guild States');
   } catch (error) {
      logger.error('Failed To Save All Guild States', error);
   }
}

function scheduleSave(guildId, guildStates, cleanStateFn) {
   if (saveTimeouts.has(guildId)) {
      clearTimeout(saveTimeouts.get(guildId));
   }
   const timeout = setTimeout(async () => {
      await saveGuildState(guildId, guildStates, cleanStateFn);
      saveTimeouts.delete(guildId);
   }, SAVE_DEBOUNCE_MS);
   saveTimeouts.set(guildId, timeout);
}

function clearSaveTimeout(guildId) {
   if (saveTimeouts.has(guildId)) {
      clearTimeout(saveTimeouts.get(guildId));
      saveTimeouts.delete(guildId);
   }
}

module.exports.saveGuildState = saveGuildState;
module.exports.saveAllStates = saveAllStates;
module.exports.scheduleSave = scheduleSave;
module.exports.clearSaveTimeout = clearSaveTimeout;
module.exports.SAVE_DEBOUNCE_MS = SAVE_DEBOUNCE_MS;
