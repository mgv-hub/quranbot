// Create the baseline state object for a guild
function createDefaultState() {
    return {
        voiceChannelId: null,
        azkarChannelId: null,
        textChannelId: null,
        categoryId: null,
        playbackMode: 'radio',
        currentReciter: 'reciter_1_ar',
        currentSurahIndex: 0,
        currentRadioIndex: 0,
        currentRadioPage: 0,
        currentReciterPage: 0,
        currentPage: 0,
        // connectionStatus: false,
        manualDisconnectFlag: false,
        timestamp: Date.now(),
        setupData: {
            categoryId: null,
            textChannelId: null,
            azkarChannelId: null,
        },
        controlMode: 'everyone',
        isPaused: true,
        pauseReason: 'initial',
        playbackStartTime: 0,
        playedOffset: 0,
        disconnectAfterCurrentTrack: false,
        azkarFail: 0,
        azkarMentionRoleId: null,
        azkarMentionEnabled: false,
        azkarMentionRoleAutoCreated: false,
        // State preservation for independent modes
        savedQuranState: null,
        savedRadioState: null,
    };
}

// Clean and merge state with defaults, filtering non-serializable values
function cleanState(state) {
    const { isPlainObject, deepCloneForFirebase } = require('@state/persist-utils');
    if (!state || !isPlainObject(state)) return createDefaultState();

    const defaultState = createDefaultState();
    const cleaned = {};

    for (const key in defaultState) {
        if (state[key] !== undefined && state[key] !== null) {
            cleaned[key] = deepCloneForFirebase(state[key]);
        } else {
            cleaned[key] = defaultState[key];
        }
    }
    for (const key in state) {
        if (!(key in cleaned) && typeof state[key] !== 'function') {
            cleaned[key] = deepCloneForFirebase(state[key]);
        }
    }

    return cleaned;
}

module.exports.createDefaultState = createDefaultState;
module.exports.cleanState = cleanState;
