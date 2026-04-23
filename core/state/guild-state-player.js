require('pathlra-aliaser');

const { createAudioPlayer } = require('@discordjs/voice');
const logger = require('@logger');

const INACTIVITY_THRESHOLD_MS = 30 * 60 * 1000;

function validateAndResetPlayer(guildId, state) {
   if (!state || !state.player) {
      return false;
   }
   const player = state.player;
   const currentTime = Date.now();
   const lastActivityGap = currentTime - state.lastActivity;
   const isLongInactivity = lastActivityGap > INACTIVITY_THRESHOLD_MS;

   if (isLongInactivity) {
      logger.info('Guild ' + guildId + ' Long Inactivity Detected Resetting Player');
      try {
         player.stop();
         player.removeAllListeners();
         const newPlayer = createAudioPlayer({
            behaviors: {
               noSubscriberTimeout: 60000,
               maxMissedFrames: 500,
            },
         });
         state.player = newPlayer;
         state.errorCount = 0;
         state.isPaused = true;
         state.pauseReason = 'player_reset';

         if (state.connection && !state.connection.destroyed) {
            state.connection.subscribe(newPlayer);
            logger.info('Guild ' + guildId + ' Player Resubscribed To Connection');
         }

         logger.info('Guild ' + guildId + ' Player Reset Successfully');
         return true;
      } catch (error) {
         logger.error('Guild ' + guildId + ' Player Reset Failed', error);
         return false;
      }
   }
   return true;
}

function createNewPlayer() {
   return createAudioPlayer({
      behaviors: {
         noSubscriberTimeout: 60000,
         maxMissedFrames: 500,
      },
   });
}

module.exports.validateAndResetPlayer = validateAndResetPlayer;
module.exports.createNewPlayer = createNewPlayer;
module.exports.INACTIVITY_THRESHOLD_MS = INACTIVITY_THRESHOLD_MS;
