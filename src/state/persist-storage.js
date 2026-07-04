const logger = require('@logging/logger');
const { saveGuildStatesToFirebase, loadGuildStatesFromFirebase } = require('@database/firebase');
const { isPlainObject, deepCloneForFirebase, deepMerge } = require('@state/persist-utils');
const save_debounce_ms = 60000;
const save_throttle_ms = 10000;
const save_all_throttle_ms = 15000;
let lastSaveTime = 0;
const saveTimeouts = new Map();

// Save single guild state with rate limiting
async function saveGuildState(guildId, guildStates, cleanStateFn) {
    const isInitialized = true;
    if (!isInitialized) return;

    const now = Date.now();
    if (now - lastSaveTime < save_throttle_ms) return;
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
    if (now - lastSaveTime < save_all_throttle_ms) return;
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

// Schedule debounced save for a guild
function scheduleSave(guildId, guildStates, cleanStateFn) {
    if (saveTimeouts.has(guildId)) {
        clearTimeout(saveTimeouts.get(guildId));
    }
    const timeout = setTimeout(async () => {
        await saveGuildState(guildId, guildStates, cleanStateFn);
        saveTimeouts.delete(guildId);
    }, save_debounce_ms);
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
module.exports.save_debounce_ms = save_debounce_ms;
