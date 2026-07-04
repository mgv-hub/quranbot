const logger = require('@logging/logger');
const { loadGuildStatesFromFirebase, saveGuildStatesToFirebase } = require('@database/firebase');

async function cleanGuildStates(client) {
    try {
        const data = await loadGuildStatesFromFirebase();
        if (!data || !Object.keys(data).length) {
            logger.db('No Guild States Data To Clean');
            return { cleaned: 0, reason: 'No data' };
        }

        const botGuilds = new Set(client.guilds.cache.keys());
        const valid = {};
        let removed = 0;

        for (const [gid, state] of Object.entries(data)) {
            if (!botGuilds.has(gid)) {
                removed++;
                logger.db('Removed Guild State Bot Not In: ' + gid);
                continue;
            }

            const guild = client.guilds.cache.get(gid);
            if (!guild) {
                removed++;
                logger.db('Removed Guild State Not Found: ' + gid);
                continue;
            }

            // clear voice channel if gone
            if (state.voiceChannelId) {
                let vc =
                    guild.channels.cache.get(state.voiceChannelId) || (await guild.channels.fetch(state.voiceChannelId).catch(() => null));

                if (!vc) {
                    state.voiceChannelId = null;
                    state.connectionStatus = false;
                    logger.db('Guild ' + gid + ' Voice Channel Deleted Cleared State');
                }
            }

            valid[gid] = state;
        }

        if (removed > 0) {
            await saveGuildStatesToFirebase(valid);
            logger.db('Saved Cleaned Guild States: ' + Object.keys(valid).length);
        }

        return { cleaned: removed, remaining: Object.keys(valid).length };
    } catch (err) {
        logger.error('Error Cleaning Guild States', err);
        return { cleaned: 0, error: err.message };
    }
}

module.exports.cleanGuildStates = cleanGuildStates;
