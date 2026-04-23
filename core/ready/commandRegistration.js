require('pathlra-aliaser');
const logger = require('@logger');
const { registerCommands, applyCommandPermissions } = require('@CommandUtils-core_utils');

async function registerAllCommands(client) {
   try {
      await registerCommands();
      logger.info('Global Application Commands Registered Successfully');
   } catch (error) {
      logger.error('Failed To Register Global Commands', error);
   }
   const currentGuilds = Array.from(client.guilds.cache.values());
   logger.info('Applying Command Permissions To ' + currentGuilds.length + ' Guilds');
   for (let i = 0; i < currentGuilds.length; i++) {
      setTimeout(async () => {
         try {
            await applyCommandPermissions(currentGuilds[i]);
         } catch (error) {
            logger.error('Failed To Apply Permissions For Guild ' + currentGuilds[i].id, error);
         }
      }, i * 1000);
   }
}
module.exports.registerAllCommands = registerAllCommands;
function startMemoryCleanup() {
   setInterval(() => {
      let cleaned = 0;
      for (const [guildId, state] of global.guildStates.entries()) {
         if (state.connection?.destroyed) {
            logger.warn('Memory State Cleaned For ' + guildId);
            cleaned++;
         }
      }
      if (cleaned > 0) {
         logger.info('Cleaned Up ' + cleaned + ' Destroyed Voice Connections From Memory');
      }
   }, 3600000);
}
module.exports.startMemoryCleanup = startMemoryCleanup;
