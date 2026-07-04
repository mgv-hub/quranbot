function setupPlayerEvents(guildId, playerInstance) {
    const { attachPlayerEvents } = require('@audio').player;
    attachPlayerEvents(guildId, playerInstance);
}

module.exports = { setupPlayerEvents };
