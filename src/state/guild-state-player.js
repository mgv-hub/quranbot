// const { createAudioPlayer } = require('@discordjs/voice');
const logger = require('@logging/logger');
const inactivity_threshold_ms = 30 * 60 * 1000;
function createNewPlayer() {
    //return createAudioPlayer({
    //    behaviors: {
    //        noSubscriberTimeout: 60000,
    //        maxMissedFrames: 500,
    //    },
    //});
    return null;
}
function validateAndResetPlayer(guildId, state) {
    if (!state || !state.player) {
        return false;
    }
    const player = state.player;
    /**
      const currentTime = Date.now();
      const lastActivityGap = currentTime - state.lastActivity;
      const isLongInactivity = lastActivityGap > inactivity_threshold_ms;
      if (isLongInactivity) {
            logger.info('Guild ' + guildId + ' Long Inactivity Detected Resetting Player');
            try {
               state.errorCount = 0;
               state.isPaused = true;
               state.pauseReason = 'player_reset';
               //if (state.connection && !state.connection.destroyed) {
               //   state.connection.subscribe(newPlayer);
               //   logger.info('Guild ' + guildId + ' Player Resubscribed To Connection');
               //}
               logger.info('Guild ' + guildId + ' Player Reset Successfully');
               return true;
            } catch (error) {
               logger.error('Guild ' + guildId + ' Player Reset Failed', error);
               return false;
            }
      }
      return true;
   */
}
module.exports.validateAndResetPlayer = validateAndResetPlayer;
module.exports.createNewPlayer = createNewPlayer;
module.exports.inactivity_threshold_ms = inactivity_threshold_ms;
