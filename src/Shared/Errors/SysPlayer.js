const { resetPlayer, stopPlayer } = require('@modules/Audio/AudioModule');
const logger = require('@infrastructure/Logging/Logger');

async function resetPlayerState(guildState, guildId) {
    return await resetPlayer(guildId, guildState);
}

module.exports.resetPlayerState = resetPlayerState;
module.exports.stopPlayer = stopPlayer;
