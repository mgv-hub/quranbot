const audioData = new Map();

function setAudioData(id, data) {
    audioData.set(id, data);
}

function getAudioData(id) {
    return audioData.get(id);
}

function deleteAudioData(id) {
    return audioData.delete(id);
}

function trackAudioData(id, data) {
    setAudioData(id, data);
    setTimeout(() => deleteAudioData(id), 10000);
}

function getAzkarAudioUrl(customId) {
    return getAudioData(customId);
}

module.exports.setAudioData = setAudioData;
module.exports.getAudioData = getAudioData;
module.exports.deleteAudioData = deleteAudioData;
module.exports.trackAudioData = trackAudioData;
module.exports.getAzkarAudioUrl = getAzkarAudioUrl;
