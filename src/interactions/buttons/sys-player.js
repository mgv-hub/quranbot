const { resetPlayer, stopPlayer } = require('@audio');
const logger = require('@logging/logger');

async function resetPlayerState(guildState, guildId) {
    return await resetPlayer(guildId, guildState);
}

module.exports.resetPlayerState = resetPlayerState;
module.exports.stopPlayer = stopPlayer;
