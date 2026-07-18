const logger = require('@logging/logger');
const { loadGuildStatesFromFirebase } = require('@database/firebase');
const { isPlainObject } = require('@state/persist-utils');
const { createDefaultState, cleanState } = require('@state/persist-defaults');
const { saveGuildState, saveAllStates, scheduleSave, clearSaveTimeout } = require('@state/persist-storage');
const { shouldRestore, restoreGuildState, setManualDisconnect, clearGuildState, getAllStates } = require('@state/persist-restore');

// const redis = require('@database/redis');

class PersistentStateManager {
    constructor() {
        this.guildStates = new Map();
        this.isInitialized = false;
        this.recoveryAttempted = false;
    }

    async initialize() {
        if (this.isInitialized) return;
        try {
            const states = await loadGuildStatesFromFirebase();
            for (const [guildId, state] of Object.entries(states)) {
                if (isPlainObject(state)) {
                    const cleaned = cleanState(state, createDefaultState);
                    this.guildStates.set(guildId, cleaned);
                    //   if (redis.isRedisReady) {
                    //       await redis.set(`quranbot:guild:${guildId}`, JSON.stringify(cleaned));
                    //   }
                }
            }
            this.isInitialized = true;
            logger.info('Persistent State Manager Initialized With ' + this.guildStates.size + ' Guild States');
            // if (redis.isRedisReady) {
            //     for (const [guildId, state] of this.guildStates.entries()) {
            //         redis.set(`quranbot:guild:${guildId}`, cleanState(state, createDefaultState)).catch((err) => {
            //             logger.debug(`Redis pre-warm failed for guild ${guildId}`, err);
            //         });
            //     }
            // }
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
        const { deepMerge } = require('@state/persist-utils');
        deepMerge(state, updates);
        state.timestamp = Date.now();
        scheduleSave(guildId, this.guildStates, cleanState);
        //   if (redis.isRedisReady) {
        //       redis.set(`quranbot:guild:${guildId}`, cleanState(state, createDefaultState)).catch((err) => {
        //           logger.debug(`Redis update failed for guild ${guildId}`, err);
        //       });
        //   }
        return state;
    }

    async saveGuildState(guildId) {
        await saveGuildState(guildId, this.guildStates, (state) => cleanState(state, createDefaultState));
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
        //   if (redis.isRedisReady) {
        //       redis.del(`quranbot:guild:${guildId}`).catch((err) => {
        //           logger.debug(`Redis delete failed for guild ${guildId}`, err);
        //       });
        //   }
    }

    getAllStates() {
        return getAllStates(this.guildStates, (state) => cleanState(state, createDefaultState));
    }
}

const persistentStateManager = new PersistentStateManager();
module.exports = persistentStateManager;
