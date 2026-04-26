require('pathlra-aliaser');

const { createAudioPlayer } = require('@discordjs/voice');
const logger = require('@logger');
const {
   getGuildStatesMap,
   hasGuildState,
   setGuildState,
   getGuildStateById,
} = require('@guild-state-store-core_state');
const {
   canJoinVoice,
   incrementVoiceConnections,
   decrementVoiceConnections,
} = require('@guild-state-voice-core_state');
const { validateAndResetPlayer, createNewPlayer } = require('@guild-state-player-core_state');
const { setupPlayerEvents } = require('@guild-state-events-core_state');
const { isAuthorized } = require('@guild-state-auth-core_state');
const {
   removeGuildState,
   cleanupGuildState,
   cleanupDestroyedConnections,
} = require('@guild-state-cleanup-core_state');
const { startVoiceWatchdog } = require('@voiceWatchdog-core_state');

function getGuildState(guildId) {
   if (!hasGuildState(guildId)) {
      if (!global.reciters || Object.keys(global.reciters).length === 0) {
         throw new Error('Reciters Not Loaded Yet Cannot Create Guild State');
      }
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
         playbackMode: 'surah',
         currentRadioIndex: 0,
         currentRadioUrl: global.quranRadios?.[0]?.url || null,
         inactivityTimer: null,
         controlMode: 'admins',
         lastActivity: Date.now(),
         errorCount: 0,
         humanCount: 0,
         playbackStartTime: 0,
         playedOffset: 0,
         recoveryAttempts: 0,
      };
      setGuildState(guildId, newState);
      setupPlayerEvents(guildId, player);
   }
   const state = getGuildStateById(guildId);
   validateAndResetPlayer(guildId, state);
   state.lastActivity = Date.now();
   return state;
}

function updatePersistentState(guildId, updates) {
   const persistentStateManager = require('@PersistentStateManager-core_state');
   return persistentStateManager.updateGuildState(guildId, updates);
}

setInterval(() => {
   const memoryUsage = process.memoryUsage();
   const mbUsed = memoryUsage.heapUsed / 1024 / 1024;
   if (mbUsed > 1500) {
      logger.warn('High Memory Usage ' + mbUsed.toFixed(2) + ' MB Running Cleanup');
      cleanupDestroyedConnections();
      if (global.gc) {
         global.gc();
      }
   }
}, 300000);

setInterval(async () => {
   const guildStates = getGuildStatesMap();
   for (const [guildId, state] of guildStates.entries()) {
      if (state.connection && !state.connection.destroyed && state.channelId) {
         const guild = global.client?.guilds?.cache?.get(guildId);
         if (guild) {
            const voiceChannel = guild.channels.cache.get(state.channelId);
            if (voiceChannel) {
               const membersInChannel = voiceChannel.members.filter((m) => !m.user.bot).size;
               state.humanCount = membersInChannel;

               if (membersInChannel > 0 && state.isPaused) {
                  const autoResumeReasons = [
                     'initial',
                     'player_error',
                     'auto_resume_failed',
                     'watchdog_timeout',
                     'watchdog_error_limit',
                     'idle_timeout',
                     'buffer_timeout',
                  ];
                  const canResume = autoResumeReasons.includes(state.pauseReason);
                  const maxRetries = 3;

                  if (canResume && (state.recoveryAttempts || 0) < maxRetries) {
                     logger.info('Guild ' + guildId + ' Users Detected Starting Playback');
                     try {
                        if (state.playbackMode === 'surah') {
                           const resource = await global.createSurahResource(
                              state,
                              state.currentSurah - 1,
                              0,
                              0,
                              false,
                           );
                           state.player.play(resource);
                        } else if (state.currentRadioUrl) {
                           const resource = await global.createRadioResource(
                              state.currentRadioUrl,
                              0,
                           );
                           state.player.play(resource);
                        }
                        state.isPaused = false;
                        state.pauseReason = null;
                        state.recoveryAttempts = (state.recoveryAttempts || 0) + 1;
                        state.playbackStartTime = Date.now();
                        state.lastActivity = Date.now();
                     } catch (error) {
                        logger.error(
                           'Guild ' + guildId + ' Auto Start Failed ' + error.message,
                        );
                     }
                  }
               }

               if (state.connection && !state.connection.destroyed) {
                  state.connection.subscribe(state.player);
               }
            }
         }
      }
   }
}, 10000);

startVoiceWatchdog();

module.exports.getGuildState = getGuildState;
module.exports.removeGuildState = removeGuildState;
module.exports.isAuthorized = isAuthorized;
module.exports.updatePersistentState = updatePersistentState;
module.exports.cleanupGuildState = cleanupGuildState;
module.exports.canJoinVoice = canJoinVoice;
module.exports.incrementVoiceConnections = incrementVoiceConnections;
module.exports.decrementVoiceConnections = decrementVoiceConnections;
module.exports.setupPlayerEvents = setupPlayerEvents;
module.exports.validateAndResetPlayer = validateAndResetPlayer;
