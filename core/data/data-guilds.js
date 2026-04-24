require('pathlra-aliaser')();

const logger = require('@logger');
const {
   loadSetupGuildsFromFirebase,
   saveSetupGuildsToFirebase,
} = require('@firebase-core_utils');

let setupGuilds = {};

async function loadSetupGuilds() {
   setupGuilds = await loadSetupGuildsFromFirebase();
   return setupGuilds;
}

async function saveSetupGuilds() {
   await saveSetupGuildsToFirebase(global.setupGuilds);
}

async function updateGuildNames() {
   for (const [guildId, setupData] of Object.entries(global.setupGuilds)) {
      const guild = global.client?.guilds?.cache?.get(guildId);
      if (guild) {
         global.setupGuilds[guildId].guildName = guild.name;
         global.setupGuilds[guildId].ownerId = guild.ownerId;
      } else {
         if (!global.setupGuilds[guildId].guildName) {
            global.setupGuilds[guildId].guildName = 'Unknown';
         }
      }
   }
   await saveSetupGuildsToFirebase(global.setupGuilds);
   logger.info('Setup Guilds Names Updated In Firebase');
}

module.exports.loadSetupGuilds = loadSetupGuilds;
module.exports.saveSetupGuilds = saveSetupGuilds;
module.exports.updateGuildNames = updateGuildNames;
module.exports.setupGuilds = setupGuilds;
