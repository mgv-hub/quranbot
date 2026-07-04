let _connection, _player, _resource, _duration, _recovery, _validation;
function getConnection() {
    if (!_connection) _connection = require('./connection');
    return _connection;
}
function getPlayer() {
    if (!_player) _player = require('./player');
    return _player;
}
function getResource() {
    if (!_resource) _resource = require('./resource');
    return _resource;
}
function getDuration() {
    if (!_duration) _duration = require('./duration');
    return _duration;
}
function getRecovery() {
    if (!_recovery) _recovery = require('./recovery');
    return _recovery;
}
function getValidation() {
    if (!_validation) _validation = require('./validation');
    return _validation;
}
//Object.defineProperties(global, {
//    createSurahResource: {
//        get: () => getResource().createSurahResource,
//        configurable: true,
//        enumerable: true,
//    },
//    createRadioResource: {
//        get: () => getResource().createRadioResource,
//        configurable: true,
//        enumerable: true,
//    },
//    findWorkingReciter: {
//        get: () => getResource().findWorkingReciter,
//        configurable: true,
//        enumerable: true,
//    },
//    findAvailableSurahForReciter: {
//        get: () => getResource().findAvailableSurahForReciter,
//        configurable: true,
//        enumerable: true,
//    },
//});
module.exports = {
    get connection() {
        return getConnection();
    },
    get player() {
        return getPlayer();
    },
    get resource() {
        return getResource();
    },
    get duration() {
        return getDuration();
    },
    get recovery() {
        return getRecovery();
    },
    get validation() {
        return getValidation();
    },
    get attachPlayerEvents() {
        return getPlayer().attachPlayerEvents;
    },
    get attachManagerEvents() {
        return getPlayer().attachManagerEvents;
    },
    get createNewPlayer() {
        return getPlayer().createNewPlayer;
    },
    get resetPlayer() {
        return getPlayer().resetPlayer;
    },
    get stopPlayer() {
        return getPlayer().stopPlayer;
    },
    get createSurahResource() {
        return getResource().createSurahResource;
    },
    get createRadioResource() {
        return getResource().createRadioResource;
    },
    get findAvailableSurahForReciter() {
        return getResource().findAvailableSurahForReciter;
    },
    get findWorkingReciter() {
        return getResource().findWorkingReciter;
    },
    get validateStreamUrl() {
        return getResource().validateStreamUrl;
    },
    get parseDurationToSeconds() {
        return getDuration().parseDurationToSeconds;
    },
    get formatDurationText() {
        return getDuration().formatDurationText;
    },
    get getDurationForSurah() {
        return getDuration().getDurationForSurah;
    },
    get recoverVoiceConnection() {
        return getRecovery().recoverVoiceConnection;
    },
    get restoreGuildStates() {
        return getRecovery().restoreGuildStates;
    },
    get checkVoiceState() {
        return getValidation().checkVoiceState;
    },
    get isBotInVoice() {
        return getValidation().isBotInVoice;
    },
    get isAllowedWithoutVoice() {
        return getValidation().isAllowedWithoutVoice;
    },
    get canJoinVoice() {
        return getConnection().canJoinVoice;
    },
    get incrementVoiceConnections() {
        return getConnection().incrementVoiceConnections;
    },
    get decrementVoiceConnections() {
        return getConnection().decrementVoiceConnections;
    },
    get teardownConnection() {
        return getConnection().teardownConnection;
    },
    get syncVoiceState() {
        return getConnection().syncVoiceState;
    },
    get initializeConnection() {
        return getConnection().initializeConnection;
    },
    get isSurahAvailable() {
        return getResource().isSurahAvailable;
    },
    get getAvailableSurahCount() {
        return getResource().getAvailableSurahCount;
    },
};
