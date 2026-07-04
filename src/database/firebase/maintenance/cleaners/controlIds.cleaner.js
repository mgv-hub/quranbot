const logger = require('@logging/logger');
const { loadControlIdsFromFirebase, saveControlIdsToFirebase } = require('@database/firebase');

async function cleanControlIds(client) {
    try {
        const data = await loadControlIdsFromFirebase();
        if (!data || !Object.keys(data).length) {
            logger.db('No Control IDs Data To Clean');
            return { cleaned: 0, reason: 'No data' };
        }

        const botGuilds = new Set(client.guilds.cache.keys());
        const cleaned = {};
        let removed = 0;

        for (const [gid, chData] of Object.entries(data)) {
            // skip if bot left this guild
            if (!botGuilds.has(gid)) {
                removed++;
                logger.db('Removed Control IDs Bot Not In Guild: ' + gid);
                continue;
            }

            const guild = client.guilds.cache.get(gid);
            if (!guild) {
                removed++;
                logger.db('Removed Control IDs Guild Not Found: ' + gid);
                continue;
            }

            const validCh = {};

            for (const [cid, msgIds] of Object.entries(chData)) {
                let ch = guild.channels.cache.get(cid) || (await guild.channels.fetch(cid).catch(() => null));

                if (ch) {
                    const validMsgs = [];
                    const ids = Array.isArray(msgIds) ? msgIds : [msgIds];

                    for (const mid of ids) {
                        try {
                            const msg = await ch.messages.fetch(mid).catch(() => null);
                            if (msg) validMsgs.push(mid);
                        } catch {
                            logger.debug('Message Not Found: ' + mid);
                        }
                    }

                    if (validMsgs.length) validCh[cid] = validMsgs;
                }
            }

            if (Object.keys(validCh).length) cleaned[gid] = validCh;
        }

        if (removed > 0 || JSON.stringify(cleaned) !== JSON.stringify(data)) {
            await saveControlIdsToFirebase(cleaned);
            logger.db('Saved Cleaned Control IDs');
        }

        return { cleaned: removed, remaining: Object.keys(cleaned).length };
    } catch (err) {
        logger.error('Error Cleaning Control IDs', err);
        return { cleaned: 0, error: err.message };
    }
}

module.exports.cleanControlIds = cleanControlIds;
