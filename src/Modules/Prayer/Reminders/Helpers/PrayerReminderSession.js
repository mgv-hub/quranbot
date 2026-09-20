const sessionData = new Map();

function getSession(guildId) {
    if (!sessionData.has(guildId)) {
        sessionData.set(guildId, {
            step: 'init',
            countryCode: null,
            countryName: null,
            cityName: null,
            lat: null,
            lng: null,
            method: 2,
            prayers: [],
            channelId: null,
            roles: [],
            mentionEveryone: false,
            mentionHere: false,
            isEdit: false,
        });
    }
    return sessionData.get(guildId);
}

function clearSession(guildId) {
    sessionData.delete(guildId);
}

module.exports.getSession = getSession;
module.exports.clearSession = clearSession;
