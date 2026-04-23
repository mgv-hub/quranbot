require('pathlra-aliaser')();

const { AZKAR_EXPIRY_MS, AZKAR_INTERVAL_MS } = require('@azkar-config-core_state');
const { getAudioData, getMessageTimestamp } = require('@azkar-cache-core_state');
const { sendRandomAzkar } = require('@azkar-sender-core_state');
const {
   startAzkarTimerForGuild,
   stopAzkarTimerForGuild,
   resetAzkarFirstMessage,
   isAzkarTimerActive,
} = require('@azkar-timer-core_state');

function getAzkarAudioUrl(customId) {
   return getAudioData(customId);
}

function getAzkarMessageTimestamp(messageId) {
   return getMessageTimestamp(messageId);
}

module.exports.sendRandomAzkar = sendRandomAzkar;
module.exports.startAzkarTimerForGuild = startAzkarTimerForGuild;
module.exports.stopAzkarTimerForGuild = stopAzkarTimerForGuild;
module.exports.resetAzkarFirstMessage = resetAzkarFirstMessage;
module.exports.getAzkarAudioUrl = getAzkarAudioUrl;
module.exports.getAzkarMessageTimestamp = getAzkarMessageTimestamp;
module.exports.isAzkarTimerActive = isAzkarTimerActive;
module.exports.AZKAR_EXPIRY_MS = AZKAR_EXPIRY_MS;
module.exports.AZKAR_INTERVAL_MS = AZKAR_INTERVAL_MS;
