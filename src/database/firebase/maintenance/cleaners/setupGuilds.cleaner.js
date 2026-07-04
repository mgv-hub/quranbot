const logger = require('@logging/logger');
const { ChannelType } = require('discord.js');
const { loadSetupGuildsFromFirebase, saveSetupGuildsToFirebase } = require('@database/firebase');
const { channel_names } = require('@config/constants');

async function validateSetupData(guildId, setupData, guild) {
    let changed = false;
    let ok = true;
    const fixed = { ...setupData };

    // check category
    if (setupData.categoryId) {
        let cat = guild.channels.cache.get(setupData.categoryId) || (await guild.channels.fetch(setupData.categoryId).catch(() => null));

        if (!cat || cat.type !== ChannelType.GuildCategory) {
            const found = guild.channels.cache.find((c) => c.name === channel_names.category && c.type === ChannelType.GuildCategory);
            if (found) {
                fixed.categoryId = found.id;
                changed = true;
                logger.db('Guild ' + guildId + ' Fixed Category ID To ' + found.id);
            } else {
                fixed.categoryId = null;
                changed = true;
                logger.db('Guild ' + guildId + ' Category Deleted And Not Found');
            }
        }
    }

    // helper to validate a channel entry
    const checkCh = async (id, nameConst, typeConst, key) => {
        if (!setupData[id]) return;
        let ch = guild.channels.cache.get(setupData[id]) || (await guild.channels.fetch(setupData[id]).catch(() => null));

        if (!ch || (typeConst === ChannelType.GuildVoice ? ch.type !== typeConst : !ch.isTextBased())) {
            const found = guild.channels.cache.find((c) => c.name === channel_names[nameConst] && c.type === typeConst);
            if (found) {
                fixed[id] = found.id;
                changed = true;
                logger.db('Guild ' + guildId + ' Fixed ' + key + ' ID To ' + found.id);
            } else {
                delete fixed[id];
                changed = true;
                logger.db('Guild ' + guildId + ' ' + key + ' Channel Deleted Removed From Data');
            }
        }
    };

    // validate each channel type
    await checkCh('voiceChannelId', 'voice', ChannelType.GuildVoice, 'Voice');
    await checkCh('textChannelId', 'text', ChannelType.GuildText, 'Text');
    await checkCh('azkarChannelId', 'azkar', ChannelType.GuildText, 'Azkar');

    // fix guild name if placeholder
    if (setupData.guildName === 'Unknown' || !setupData.guildName) {
        fixed.guildName = guild.name;
        changed = true;
    }

    return { valid: ok, hasChanges: changed, data: fixed };
}

// main cleanup routine for setup guilds
async function cleanSetupGuilds(client) {
    try {
        const data = await loadSetupGuildsFromFirebase();
        if (!data || !Object.keys(data).length) {
            logger.db('No Setup Guilds Data To Clean');
            return { cleaned: 0, reason: 'No data' };
        }

        const botGuilds = new Set(client.guilds.cache.keys());
        const valid = {};
        let removed = 0;
        let updated = 0;

        for (const [gid, sData] of Object.entries(data)) {
            // skip if bot left this guild
            if (!botGuilds.has(gid)) {
                removed++;
                logger.db('Removed Setup Guild Bot Not In: ' + gid);
                continue;
            }

            const guild = client.guilds.cache.get(gid);
            if (!guild) {
                removed++;
                logger.db('Removed Setup Guild Not Found In Cache: ' + gid);
                continue;
            }

            const res = await validateSetupData(gid, sData, guild);
            if (!res.valid) {
                removed++;
                logger.db('Removed Setup Guild Invalid Category: ' + gid);
                continue;
            }

            if (res.hasChanges) {
                valid[gid] = res.data;
                updated++;
                logger.db('Updated Setup Guild Removed Deleted Channels: ' + gid);
            } else {
                valid[gid] = sData;
            }
        }

        // persist if anything changed
        if (removed > 0 || updated > 0) {
            await saveSetupGuildsToFirebase(valid);
            logger.db('Saved Cleaned Setup Guilds: ' + Object.keys(valid).length);
        }

        return { cleaned: removed, updated, remaining: Object.keys(valid).length };
    } catch (err) {
        logger.error('Error Cleaning Setup Guilds', err);
        return { cleaned: 0, error: err.message };
    }
}

module.exports.validateSetupData = validateSetupData;
module.exports.cleanSetupGuilds = cleanSetupGuilds;
