const persistentStateManager = require('@state/PersistentStateManager');

function identifyRestorableGuilds(activeGuildIds) {
    const setups = global.setupGuilds || {};
    const guildsToRestoreSet = new Set();

    for (const gid of activeGuildIds) {
        if (setups[gid]?.voiceChannelId) {
            guildsToRestoreSet.add(gid);
        } else {
            const stored = persistentStateManager.getGuildState(gid);

            if (stored?.voiceChannelId) {
                guildsToRestoreSet.add(gid);
                if (!setups[gid]) setups[gid] = {};
                setups[gid].voiceChannelId = stored.voiceChannelId;
            }
        }
    }
    return Array.from(guildsToRestoreSet);
}

module.exports.identifyRestorableGuilds = identifyRestorableGuilds;
