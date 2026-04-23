require('pathlra-aliaser');

function canJoinVoice() {
   if (!global.MAX_VOICE_CONNECTIONS_PER_SHARD) return true;
   if (!global.activeVoiceConnections) global.activeVoiceConnections = 0;
   return global.activeVoiceConnections < global.MAX_VOICE_CONNECTIONS_PER_SHARD;
}

function incrementVoiceConnections() {
   if (!global.activeVoiceConnections) global.activeVoiceConnections = 0;
   global.activeVoiceConnections++;
}

function decrementVoiceConnections() {
   if (!global.activeVoiceConnections) global.activeVoiceConnections = 0;
   if (global.activeVoiceConnections > 0) {
      global.activeVoiceConnections--;
   }
}

function getActiveVoiceConnections() {
   return global.activeVoiceConnections || 0;
}

module.exports.canJoinVoice = canJoinVoice;
module.exports.incrementVoiceConnections = incrementVoiceConnections;
module.exports.decrementVoiceConnections = decrementVoiceConnections;
module.exports.getActiveVoiceConnections = getActiveVoiceConnections;
