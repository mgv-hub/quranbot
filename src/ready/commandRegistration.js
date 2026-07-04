const logger = require('@logging/logger');
const { registerCommands, applyCommandPermissions } = require('@registry/commandregistry');

async function registerAllCommands(client) {
    try {
        // Register application commands globally with Discord API
        await registerCommands();
        logger.info('Global Application Commands Registered Successfully');
    } catch (error) {
        logger.error('Failed To Register Global Commands', error);
    }
    const activeGuilds = Array.from(client.guilds.cache.values());
    logger.info('Applying Command Permissions To ' + activeGuilds.length + ' Guilds');

    for (let index = 0; index < activeGuilds.length; index++) {
        setTimeout(async () => {
            try {
                await applyCommandPermissions(activeGuilds[index]);
            } catch (error) {
                logger.error('Failed To Apply Permissions For Guild ' + activeGuilds[index].id, error);
            }
        }, index * 1000);
    }
}

function startMemoryCleanup() {
    setInterval(() => {
        let cleanedCount = 0;

        for (const [guildId, guildState] of global.guildStates.entries()) {
            if (guildState.connection?.destroyed) {
                logger.warn('Memory State Cleaned For ' + guildId);
                cleanedCount++;
            }
        }

        if (cleanedCount > 0) {
            logger.info('Cleaned Up ' + cleanedCount + ' Destroyed Voice Connections From Memory');
        }
    }, 3600000);
}

module.exports.registerAllCommands = registerAllCommands;
module.exports.startMemoryCleanup = startMemoryCleanup;
