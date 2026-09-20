function setupPlayerEvents(guildId, playerInstance) {
    const { attachPlayerEvents } = require('@modules/Audio/AudioModule').player;
    attachPlayerEvents(guildId, playerInstance);
}

module.exports = { setupPlayerEvents };
