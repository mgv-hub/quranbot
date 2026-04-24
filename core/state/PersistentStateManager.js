require('pathlra-aliaser');
const logger = require('@logger');
const backupManager = require('@BackupManager-core_state').backupManager;
const { loadGuildStatesFromFirebase } = require('@firebase-core_utils');
const { isPlainObject } = require('@persist-utils-core_state');
const { createDefaultState, cleanState } = require('@persist-defaults-core_state');
const {
   saveGuildState,
   saveAllStates,
   scheduleSave,
   clearSaveTimeout,
} = require('@persist-storage-core_state');
const {
   shouldRestore,
   restoreGuildState,
   setManualDisconnect,
   clearGuildState,
   getAllStates,
} = require('@persist-restore-core_state');

class PersistentStateManager {
   constructor() {
      this.guildStates = new Map();
      this.isInitialized = false;
      this.recoveryAttempted = false;
   }

   async initialize() {
      if (this.isInitialized) return;
      await backupManager.initialize();
      try {
         const states = await loadGuildStatesFromFirebase();
         for (const [guildId, state] of Object.entries(states)) {
            if (isPlainObject(state)) {
               this.guildStates.set(guildId, cleanState(state, createDefaultState));
            }
         }
         this.isInitialized = true;
         logger.info(
            'Persistent State Manager Initialized With ' +
               this.guildStates.size +
               ' Guild States',
         );
      } catch (error) {
         logger.error('Failed To Initialize Persistent State Manager', error);
         this.isInitialized = true;
      }
   }

   getGuildState(guildId) {
      if (!this.guildStates.has(guildId)) {
         const defaultState = createDefaultState();
         this.guildStates.set(guildId, defaultState);
      }
      return this.guildStates.get(guildId);
   }

   updateGuildState(guildId, updates) {
      const state = this.getGuildState(guildId);
      const { deepMerge } = require('@persist-utils-core_state');
      deepMerge(state, updates);
      state.timestamp = Date.now();
      scheduleSave(guildId, this.guildStates, cleanState);
      return state;
   }

   async saveGuildState(guildId) {
      await saveGuildState(guildId, this.guildStates, (state) =>
         cleanState(state, createDefaultState),
      );
   }

   async saveAllStates() {
      await saveAllStates(this.guildStates, (state) => cleanState(state, createDefaultState));
   }

   setManualDisconnect(guildId, value) {
      setManualDisconnect(guildId, this.guildStates, scheduleSave, value);
   }

   shouldRestore(guildId) {
      const state = this.guildStates.get(guildId);
      return shouldRestore(state);
   }

   async restoreGuildState(guildId, client) {
      return await restoreGuildState(guildId, this.guildStates, client);
   }

   clearGuildState(guildId) {
      clearGuildState(guildId, this.guildStates, clearSaveTimeout);
   }

   getAllStates() {
      return getAllStates(this.guildStates, (state) => cleanState(state, createDefaultState));
   }
}

const persistentStateManager = new PersistentStateManager();
module.exports = persistentStateManager;
