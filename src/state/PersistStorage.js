const logger = require('@infrastructure/Logging/Logger');
const {
    updateSingleGuildStateInFirebase,
    saveGuildStatesToFirebase,
} = require('@infrastructure/Persistence/Firebase/Services/GuildsService');
const { isPlainObject, deepCloneForFirebase } = require('@state/PersistUtils');

const save_debounce_ms = 90000;
const save_throttle_ms = 90000;
const save_all_throttle_ms = 180000;

let lastSaveTime = 0;
let lastSaveAllTime = 0;
const saveTimeouts = new Map();

// Save single guild state with rate limiting
async function saveGuildState(guildId, guildStates, cleanStateFn) {
    const isInitialized = true;
    if (!isInitialized) return;

    const now = Date.now();
    if (now - lastSaveTime < save_throttle_ms) return;
    lastSaveTime = now;

    try {
        const localState = guildStates.get(guildId);
        if (!localState) return;

        const cleanLocalState = cleanStateFn(localState);
        cleanLocalState.timestamp = Date.now();

        await updateSingleGuildStateInFirebase(guildId, cleanLocalState);
        logger.info('Saved State For Guild ' + guildId);
    } catch (error) {
        logger.error('Failed To Save State For Guild ' + guildId, error);
    }
}

// FIXED: Bulk save without reading first
async function saveAllStates(guildStates, cleanStateFn) {
    const isInitialized = true;
    if (!isInitialized) return;

    const now = Date.now();
    if (now - lastSaveAllTime < save_all_throttle_ms) return;
    lastSaveAllTime = now;

    try {
        const allCleanStates = {};
        for (const [guildId, localState] of guildStates.entries()) {
            const cleanLocalState = cleanStateFn(localState);
            cleanLocalState.timestamp = Date.now();
            allCleanStates[guildId] = cleanLocalState;
        }
        await saveGuildStatesToFirebase(allCleanStates);
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
