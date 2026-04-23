require('pathlra-aliaser');

const { createAudioPlayer } = require('@discordjs/voice');
const logger = require('@logger');
const { setupPlayerEvents } = require('@GuildStateManager-core_state');
const { PLAYER_CONFIG } = require('@sys-config-core_interactions_buttons');

async function resetPlayerState(state, guildId) {
   if (!state || !state.player) {
      return false;
   }
   try {
      state.player.stop();
      state.player.removeAllListeners();
      const newPlayer = createAudioPlayer({
         behaviors: {
            noSubscriberTimeout: PLAYER_CONFIG.NO_SUBSCRIBER_TIMEOUT,
            maxMissedFrames: PLAYER_CONFIG.MAX_MISSED_FRAMES,
         },
      });
      state.player = newPlayer;
      state.errorCount = 0;
      state.isPaused = true;
      state.pauseReason = 'player_reset';
      setupPlayerEvents(guildId, newPlayer);
      logger.info('Guild ' + guildId + ' Player State Reset');
      return true;
   } catch (error) {
      logger.error('Guild ' + guildId + ' Player Reset Failed', error);
      return false;
   }
}

function stopPlayer(state) {
   if (state && state.player) {
      state.player.stop();
   }
}

module.exports.resetPlayerState = resetPlayerState;
module.exports.stopPlayer = stopPlayer;
