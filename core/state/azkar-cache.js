require('pathlra-aliaser')();

const azkarFirstMessage = new Map();
const azkarAudioData = new Map();
const azkarMessageTimestamps = new Map();

function setFirstMessage(guildId, value) {
   azkarFirstMessage.set(guildId, value);
}

function getFirstMessage(guildId) {
   return azkarFirstMessage.get(guildId);
}

function deleteFirstMessage(guildId) {
   return azkarFirstMessage.delete(guildId);
}

function setAudioData(customId, data) {
   azkarAudioData.set(customId, data);
}

function getAudioData(customId) {
   return azkarAudioData.get(customId);
}

function deleteAudioData(customId) {
   return azkarAudioData.delete(customId);
}

function setMessageTimestamp(messageId, timestamp) {
   azkarMessageTimestamps.set(messageId, timestamp);
}

function getMessageTimestamp(messageId) {
   return azkarMessageTimestamps.get(messageId);
}

function deleteMessageTimestamp(messageId) {
   return azkarMessageTimestamps.delete(messageId);
}

function clearAllCaches() {
   azkarFirstMessage.clear();
   azkarAudioData.clear();
   azkarMessageTimestamps.clear();
}

module.exports.setFirstMessage = setFirstMessage;
module.exports.getFirstMessage = getFirstMessage;
module.exports.deleteFirstMessage = deleteFirstMessage;
module.exports.setAudioData = setAudioData;
module.exports.getAudioData = getAudioData;
module.exports.deleteAudioData = deleteAudioData;
module.exports.setMessageTimestamp = setMessageTimestamp;
module.exports.getMessageTimestamp = getMessageTimestamp;
module.exports.deleteMessageTimestamp = deleteMessageTimestamp;
module.exports.clearAllCaches = clearAllCaches;
