const logger = require('@logging/logger');
const { loadSetupGuildsFromFirebase, saveSetupGuildsToFirebase } = require('@database/firebase');

// Local cache for guild setup configurations
let setupGuilds = {};

// Load guild setup data from Firebase into local memory
async function loadSetupGuilds() {
    setupGuilds = await loadSetupGuildsFromFirebase();
    return setupGuilds;
}

// Persist current global setupGuilds state to Firebase
async function saveSetupGuilds() {
    await saveSetupGuildsToFirebase(global.setupGuilds);
}

// Sync guild names and owner IDs from Discord cache to Firebase storage
async function updateGuildNames() {
    for (const [guildId, setupData] of Object.entries(global.setupGuilds)) {
        const guild = global.client?.guilds?.cache?.get(guildId);

        if (guild) {
            // Update with live guild metadata when available
            global.setupGuilds[guildId].guildName = guild.name;
            global.setupGuilds[guildId].ownerId = guild.ownerId;
        } else {
            // Fallback placeholder for unavailable guilds
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
