const { ChannelType } = require('discord.js');
const logger = require('@logging/logger');
const { loadTrackedGuildsFromFirebase, saveTrackedGuildsToFirebase } = require('@database/firebase');
const retentiondb = require('@database/firebase/retention/retention');

const botClient = global.client;
let trackedGuildsList = [];
let _initialized = false;

async function loadTrackedGuilds() {
    try {
        const fetchedData = await loadTrackedGuildsFromFirebase();
        trackedGuildsList = Array.isArray(fetchedData) ? fetchedData : [];
        logger.info('Tracked Guilds Loaded From Firebase');
    } catch (err) {
        logger.error('Failed To Load Tracked Guilds From Firebase');
        trackedGuildsList = [];
    }
}

async function saveTrackedGuilds() {
    try {
        await saveTrackedGuildsToFirebase(trackedGuildsList);
        logger.info('Tracked Guilds Saved To Firebase');
    } catch (err) {
        logger.error('Failed To Save Tracked Guilds To Firebase');
    }
}

async function cleanupTrackedGuilds() {
    try {
        const originalCount = trackedGuildsList.length;
        const currentGuildIds = new Set(botClient.guilds.cache.keys());
        trackedGuildsList = trackedGuildsList.filter((entry) => currentGuildIds.has(entry.guildId));
        const removedCount = originalCount - trackedGuildsList.length;
        if (removedCount > 0) {
            await saveTrackedGuilds();
            logger.info(`Cleaned Up ${removedCount} Guilds Bot Is No Longer In`);
        } else {
            logger.info('No Cleanup Needed All Tracked Guilds Are Valid');
        }
    } catch (err) {
        logger.error('Failed To Cleanup Tracked Guilds');
    }
}

async function syncTrackedGuilds() {
    try {
        await cleanupTrackedGuilds();
        let newlyAddedCount = 0;
        for (const guild of botClient.guilds.cache.values()) {
            const alreadyTracked = trackedGuildsList.some((entry) => entry.guildId === guild.id);
            if (!alreadyTracked) {
                let guildOwner = null;
                try {
                    guildOwner = await guild.fetchOwner();
                } catch (e) {
                    logger.warn(`Could Not Fetch Owner For Guild ${guild.id}`);
                }
                const guildEntry = {
                    guildId: guild.id,
                    guildName: guild.name,
                    ownerId: guildOwner?.id || 'unknown',
                    ownerUsername: guildOwner?.user?.username || 'unknown',
                    ownerGlobalName: guildOwner?.user?.globalName || guildOwner?.user?.username || 'unknown',
                    invite: null,
                    memberCount: guild.memberCount,
                    createdAt: new Date().toISOString(),
                };
                trackedGuildsList.push(guildEntry);
                newlyAddedCount++;
                logger.info(`Added Existing Guild To Tracking ${guild.name} ${guild.id}`);
            }
        }
        if (newlyAddedCount > 0) {
            await saveTrackedGuilds();
            logger.info(`Sync Complete Added ${newlyAddedCount} Existing Guilds To Tracking`);
        } else {
            logger.info('Sync Complete All Guilds Already Tracked');
        }
    } catch (err) {
        logger.error('Failed To Sync Tracked Guilds');
    }
}

async function initialize() {
    if (_initialized) return;
    await loadTrackedGuilds();
    _initialized = true;
}

botClient.on('guildCreate', async (guild) => {
    try {
        const guildOwner = await guild.fetchOwner();
        const newGuildEntry = {
            guildId: guild.id,
            guildName: guild.name,
            ownerId: guildOwner.id,
            ownerUsername: guildOwner.user.username,
            ownerGlobalName: guildOwner.user.globalName || guildOwner.user.username,
            invite: null,
            memberCount: guild.memberCount,
            createdAt: new Date().toISOString(),
        };
        trackedGuildsList.push(newGuildEntry);
        await saveTrackedGuilds();
        logger.info(`Added New Guild ${guild.name} ${guild.id}`);
    } catch (err) {
        logger.error('Failed To Track New Guild');
    }
});

botClient.on('guildDelete', async (guild) => {
    await retentiondb.markGuildAsLeft(guild.id);
    // logger.info(`Bot left guild ${guild.name} (${guild.id}). Tracked data retained for 15 days.`);
});

if (process.env.NODE_ENV !== 'test' && process.env.SKIP_AUTO_INIT !== 'true') {
    loadTrackedGuilds();
    botClient.once('clientReady', () => {
        setTimeout(() => {
            syncTrackedGuilds();
        }, 5000);
    });
}

Object.defineProperty(module.exports, 'trackedGuilds', {
    get: () => trackedGuildsList,
    enumerable: true,
    configurable: true,
});
module.exports.saveTrackedGuilds = saveTrackedGuilds;
module.exports.loadTrackedGuilds = loadTrackedGuilds;
module.exports.syncTrackedGuilds = syncTrackedGuilds;
module.exports.cleanupTrackedGuilds = cleanupTrackedGuilds;
module.exports.initialize = initialize;
