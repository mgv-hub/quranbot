// const { createAudioPlayer } = require('@discordjs/voice');
const logger = require('@logging/logger');
let _store, _voice, _player, _events, _auth, _cleanup, _persistent;
function getStore() {
    if (!_store) _store = require('@state/guild-state-store');
    return _store;
}
function getVoice() {
    if (!_voice) _voice = require('@state/guild-state-voice');
    return _voice;
}
function getPlayer() {
    if (!_player) _player = require('@state/guild-state-player');
    return _player;
}
function getEvents() {
    if (!_events) _events = require('@state/guild-state-events');
    return _events;
}
function getAuth() {
    if (!_auth) _auth = require('@state/guild-state-auth');
    return _auth;
}
function getCleanup() {
    if (!_cleanup) _cleanup = require('@state/guild-state-cleanup');
    return _cleanup;
}
function getPersistent() {
    if (!_persistent) _persistent = require('@state/PersistentStateManager');
    return _persistent;
}
function getGuildState(guildId) {
    const store = getStore();
    if (!store.hasGuildState(guildId)) {
        if (!global.reciters || Object.keys(global.reciters).length === 0) {
            throw new Error('Reciters Not Loaded Yet Cannot Create Guild State');
        }
        const { createNewPlayer } = getPlayer();
        const { setupPlayerEvents } = getEvents();
        const player = createNewPlayer();
        const defaultReciter = Object.keys(global.reciters)[0] || 'reciter_1_ar';
        const newState = {
            player,
            connection: null,
            channelId: null,
            azkarChannelId: null,
            azkarTimer: null,
            currentSurah: 1,
            isPaused: true,
            pauseReason: 'initial',
            currentPage: 0,
            currentReciterPage: 0,
            currentReciter: defaultReciter,
            playbackMode: 'radio',
            currentRadioIndex: 0,
            currentRadioUrl: global.quranRadios?.[0]?.url || null,
            inactivityTimer: null,
            controlMode: 'everyone',
            lastActivity: Date.now(),
            errorCount: 0,
            humanCount: 0,
            playbackStartTime: 0,
            playedOffset: 0,
            // State preservation for independent modes
            savedQuranState: null,
            savedRadioState: null,
        };
        store.setGuildState(guildId, newState);
        setupPlayerEvents(guildId, player);
    }
    const state = store.getGuildStateById(guildId);
    const { validateAndResetPlayer } = getPlayer();
    validateAndResetPlayer(guildId, state);
    state.lastActivity = Date.now();
    return state;
}
function updatePersistentState(guildId, updates) {
    const persistent = getPersistent();
    return persistent.updateGuildState(guildId, updates);
}
let statePollInProgress = false;
setInterval(async () => {
    if (statePollInProgress) return;
    statePollInProgress = true;
    try {
        const memoryUsage = process.memoryUsage();
        const mbUsed = memoryUsage.heapUsed / 1024 / 1024;
        if (mbUsed > 1500) {
            logger.warn('High Memory Usage ' + mbUsed.toFixed(2) + ' MB Running Cleanup');
            const { cleanupDestroyedConnections } = getCleanup();
            cleanupDestroyedConnections();
            if (global.gc) global.gc();
        }
    } finally {
        statePollInProgress = false;
    }
}, 300000);

/**
setInterval(async () => {
    if (statePollInProgress) return;
    statePollInProgress = true;
    try {
        const { getGuildStatesMap } = getStore();
        const guildStates = getGuildStatesMap();
        for (const [guildId, state] of guildStates.entries()) {
            if (state.connection && !state.connection.destroyed && state.channelId) {
                const guild = global.client?.guilds?.cache?.get(guildId);
                if (guild) {
                    const voiceChannel = guild.channels.cache.get(state.channelId);
                    if (voiceChannel) {
                        const membersInChannel = voiceChannel.members.filter((m) => !m.user.bot).size;
                        state.humanCount = membersInChannel;
                        if (membersInChannel > 0 && state.isPaused && state.pauseReason === 'initial') {
                            logger.info('Guild ' + guildId + ' Users Detected Starting Playback');
                            try {
                                if (state.playbackMode === 'surah') {
                                    const resource = await global.createSurahResource(state, state.currentSurah - 1, 0, 0, false);
                                    state.player.play({ track: resource });
                                    state.isPaused = false;
                                    state.pauseReason = null;
                                } else if (state.currentRadioUrl) {
                                    const resource = await global.createRadioResource(state.currentRadioUrl, 0);
                                    state.player.play({ track: resource });
                                    state.isPaused = false;
                                    state.pauseReason = null;
                                }
                            } catch (error) {
                                logger.error('Guild ' + guildId + ' Auto Start Failed', error);
                            }
                            //if (state.connection && !state.connection.destroyed) {
                            //    state.connection.subscribe(state.player);
                            //}
                        }
                    }
                }
            }
        }
    } catch (err) {
        logger.error('Guild state polling failed', err);
    } finally {
        statePollInProgress = false;
    }
}, 10000);
 */

module.exports = {
    getGuildState,
    removeGuildState: () => getCleanup().removeGuildState,
    isAuthorized: () => getAuth().isAuthorized,
    updatePersistentState,
    cleanupGuildState: () => getCleanup().cleanupGuildState,
    canJoinVoice: () => getVoice().canJoinVoice,
    incrementVoiceConnections: () => getVoice().incrementVoiceConnections,
    decrementVoiceConnections: () => getVoice().decrementVoiceConnections,
    setupPlayerEvents: () => getEvents().setupPlayerEvents,
    validateAndResetPlayer: () => getPlayer().validateAndResetPlayer,
};
