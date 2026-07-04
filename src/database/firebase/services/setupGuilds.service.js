const logger = require('@logging/logger');
const { loadSetupGuildsFromFirebase, saveSetupGuildsToFirebase } = require('@database/firebase');

async function persistSetupData() {
    try {
        const remote = await loadSetupGuildsFromFirebase();
        const local = global.setupGuilds || {};
        const merged = { ...remote };

        for (const [gid, data] of Object.entries(local)) {
            merged[gid] = { ...merged[gid], ...data };
        }
        await saveSetupGuildsToFirebase(merged);
        global.setupGuilds = merged;
    } catch (e) {
        logger.error('Setup save failed setupGuilds.service.js', e);
    }
}

module.exports.persistSetupData = persistSetupData;
