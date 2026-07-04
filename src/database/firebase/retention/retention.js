const logger = require('@logging/logger');
const { db, isFirebaseReady } = require('@database/firebase');
const { deepCloneForFirebase } = require('@database/firebase/utils/clone');
const { ChannelType } = require('discord.js');
const { channel_names } = require('@config/constants');
const retention_days = 15;
const retention_ms = retention_days * 24 * 60 * 60 * 1000;
const cleanupInterval = 24 * 60 * 60 * 1000;
const RETENTION_INDEX_PATH = 'retention_index';

function getFirebaseServices() {
    // Lazy load firebase services
    const firebase = require('@database/firebase');
    return {
        loadSetupGuildsFromFirebase: firebase.loadSetupGuildsFromFirebase,
        saveSetupGuildsToFirebase: firebase.saveSetupGuildsToFirebase,
        loadGuildStatesFromFirebase: firebase.loadGuildStatesFromFirebase,
        saveGuildStatesToFirebase: firebase.saveGuildStatesToFirebase,
        loadControlIdsFromFirebase: firebase.loadControlIdsFromFirebase,
        saveControlIdsToFirebase: firebase.saveControlIdsToFirebase,
    };
}

async function markGuildAsLeft(guildId) {
    if (!isFirebaseReady || !db) return;
    const now = Date.now();

    const updates = {};
    updates[`${RETENTION_INDEX_PATH}/${guildId}/isLeft`] = true;
    updates[`${RETENTION_INDEX_PATH}/${guildId}/leftAt`] = now;
    await db.ref().update(updates);

    if (global.guildStates) global.guildStates.delete(guildId);

    if (global.setupGuilds) delete global.setupGuilds[guildId];
    // logger.db(`Guild ${guildId} marked as left in retention index at ${now}`);
}

async function markGuildAsPresent(guildId) {
    if (!isFirebaseReady || !db) return;
    await db.ref(`${RETENTION_INDEX_PATH}/${guildId}`).remove();

    logger.db(`Guild ${guildId} marked as present (removed from retention index)`);
}

async function cleanExpiredLeftData(client) {
    if (!isFirebaseReady || !db) {
        return {
            success: false,
            reason: 'Firebase not ready',
        };
    }
    try {
        const now = Date.now();
        const expiredBefore = now - retention_ms;
        const snapshot = await db.ref(RETENTION_INDEX_PATH).once('value');
        const retentionIndex = snapshot.val() || {};
        const expiredGuilds = [];

        for (const [guildId, data] of Object.entries(retentionIndex)) {
            const isExpired = data?.isLeft && data?.leftAt && data.leftAt < expiredBefore;

            if (isExpired) {
                expiredGuilds.push(guildId);
            }
        }

        if (!expiredGuilds.length) {
            logger.db('No expired guild data found');
            return {
                success: true,
                cleaned: 0,
            };
        }

        const updates = {};

        for (const guildId of expiredGuilds) {
            updates[`setup_guilds/${guildId}`] = null;
            updates[`guild_states/${guildId}`] = null;
            updates[`${RETENTION_INDEX_PATH}/${guildId}`] = null;
        }

        const controlSnapshot = await db.ref('control_ids').once('value');
        const controlIds = controlSnapshot.val() || {};

        for (const guildId of expiredGuilds) {
            if (controlIds[guildId]) {
                updates[`control_ids/${guildId}`] = null;
            }
        }

        const trackedSnapshot = await db.ref('tracked_guilds').once('value');
        const trackedGuilds = trackedSnapshot.val() || [];
        const filteredTrackedGuilds = trackedGuilds.filter((guild) => !expiredGuilds.includes(guild.guildId));

        if (filteredTrackedGuilds.length !== trackedGuilds.length) {
            updates.tracked_guilds = deepCloneForFirebase(filteredTrackedGuilds);
        }

        if (Object.keys(updates).length) {
            await db.ref().update(updates);
        }

        if (client) {
            for (const guildId of expiredGuilds) {
                global.guildStates?.delete(guildId);

                if (global.setupGuilds) {
                    delete global.setupGuilds[guildId];
                }
            }
        }

        logger.db(`Cleaned ${expiredGuilds.length} expired guilds`);

        return {
            success: true,
            cleaned: expiredGuilds.length,
        };
    } catch (error) {
        logger.error('Failed to clean expired guild data', error);

        return {
            success: false,
            reason: error.message,
        };
    }
}

async function clearGuildData(guildId) {
    if (!isFirebaseReady || !db) {
        return false;
    }

    try {
        const updates = {
            [`setup_guilds/${guildId}`]: null,
            [`guild_states/${guildId}`]: null,
            [`${RETENTION_INDEX_PATH}/${guildId}`]: null,
        };

        const controlSnapshot = await db.ref(`control_ids/${guildId}`).once('value');

        if (controlSnapshot.exists()) {
            updates[`control_ids/${guildId}`] = null;
        }

        const trackedSnapshot = await db.ref('tracked_guilds').once('value');
        const trackedGuilds = trackedSnapshot.val() || [];
        const filteredTrackedGuilds = trackedGuilds.filter((guild) => guild.guildId !== guildId);

        if (filteredTrackedGuilds.length !== trackedGuilds.length) {
            updates.tracked_guilds = deepCloneForFirebase(filteredTrackedGuilds);
        }
        await db.ref().update(updates);
        global.guildStates?.delete(guildId);
        if (global.setupGuilds) {
            delete global.setupGuilds[guildId];
        }
        logger.db(`Cleared all stored data for guild ${guildId}`);
        return true;
    } catch (error) {
        logger.error('Failed to clear guild data', error);

        return false;
    }
}

async function isWithinRetentionGracePeriod(guildId) {
    if (!db) return false;
    const snap = await db.ref(`${RETENTION_INDEX_PATH}/${guildId}`).once('value');
    const data = snap.val();
    if (!data || !data.isLeft || !data.leftAt) return false;
    return Date.now() - data.leftAt < retention_ms;
}

async function cleanupInvalidSetupGuilds(client) {
    try {
        const { loadSetupGuildsFromFirebase, saveSetupGuildsToFirebase } = getFirebaseServices();

        const setupGuilds = await loadSetupGuildsFromFirebase();

        if (!setupGuilds || !Object.keys(setupGuilds).length) {
            return {
                cleaned: 0,
                reason: 'No setup guilds found',
            };
        }

        const botGuilds = new Set(client.guilds.cache.keys());
        const validGuilds = {};
        let removed = 0;
        let updated = 0;

        for (const [guildId, guildData] of Object.entries(setupGuilds)) {
            if (botGuilds.has(guildId)) {
                const guild = client.guilds.cache.get(guildId);

                if (!guild) {
                    removed++;
                    continue;
                }

                const ChannelSafe = async (id) => {
                    if (!id) return null;
                    const cached = guild.channels.cache.get(id);
                    if (cached) return cached;
                    try {
                        return await guild.channels.fetch(id);
                    } catch (err) {
                        if (err.code === 10003 || err.code === 10004) return null;
                        return 'FETCH_FAILED';
                    }
                };

                let changed = false;
                const fixedData = { ...guildData };

                if (guildData.categoryId) {
                    const category = await ChannelSafe(guildData.categoryId);
                    if (category === 'FETCH_FAILED') {
                        validGuilds[guildId] = guildData;
                        continue;
                    }
                    if (!category || category.type !== ChannelType.GuildCategory) {
                        const fallbackCategory = guild.channels.cache.find(
                            (channel) => channel.name === channel_names.category && channel.type === ChannelType.GuildCategory,
                        );
                        if (fallbackCategory) {
                            fixedData.categoryId = fallbackCategory.id;
                            changed = true;
                        } else {
                            fixedData.categoryId = null;
                            changed = true;
                        }
                    }
                }

                const validateChannel = async (fieldName, channelKey, expectedType) => {
                    if (!guildData[fieldName]) return;
                    const channel = await ChannelSafe(guildData[fieldName]);
                    if (channel === 'FETCH_FAILED') return 'FETCH_FAILED';

                    const invalidVoice = expectedType === ChannelType.GuildVoice && channel?.type !== expectedType;

                    const invalidText = expectedType !== ChannelType.GuildVoice && !channel?.isTextBased?.();

                    if (!channel || invalidVoice || invalidText) {
                        const fallbackChannel = guild.channels.cache.find(
                            (c) => c.name === channel_names[channelKey] && c.type === expectedType,
                        );

                        if (fallbackChannel) {
                            fixedData[fieldName] = fallbackChannel.id;
                        } else {
                            delete fixedData[fieldName];
                        }

                        changed = true;
                    }
                };

                if ((await validateChannel('voiceChannelId', 'voice', ChannelType.GuildVoice)) === 'FETCH_FAILED') {
                    validGuilds[guildId] = guildData;
                    continue;
                }
                if ((await validateChannel('textChannelId', 'text', ChannelType.GuildText)) === 'FETCH_FAILED') {
                    validGuilds[guildId] = guildData;
                    continue;
                }
                if ((await validateChannel('azkarChannelId', 'azkar', ChannelType.GuildText)) === 'FETCH_FAILED') {
                    validGuilds[guildId] = guildData;
                    continue;
                }

                if (guildData.guildName === 'Unknown' || !guildData.guildName) {
                    fixedData.guildName = guild.name;

                    changed = true;
                }

                if (changed) {
                    validGuilds[guildId] = fixedData;

                    updated++;
                } else {
                    validGuilds[guildId] = guildData;
                }
            } else {
                const keepData = await isWithinRetentionGracePeriod(guildId);

                if (keepData) {
                    validGuilds[guildId] = guildData;
                } else {
                    removed++;
                }
            }
        }

        if (removed > 0 || updated > 0) {
            await saveSetupGuildsToFirebase(validGuilds);

            logger.db(`Saved cleaned setup guilds: ${Object.keys(validGuilds).length}`);
        }

        return {
            cleaned: removed,
            updated,
            remaining: Object.keys(validGuilds).length,
        };
    } catch (error) {
        logger.error('Failed to cleanup setup guilds', error);

        return {
            cleaned: 0,
            error: error.message,
        };
    }
}

async function cleanupInvalidGuildStates(client) {
    try {
        const { loadGuildStatesFromFirebase, saveGuildStatesToFirebase } = getFirebaseServices();

        const guildStates = await loadGuildStatesFromFirebase();

        if (!guildStates || !Object.keys(guildStates).length) {
            return {
                cleaned: 0,
                reason: 'No guild states found',
            };
        }
        const botGuilds = new Set(client.guilds.cache.keys());
        const validStates = {};
        let removed = 0;
        for (const [guildId, state] of Object.entries(guildStates)) {
            if (botGuilds.has(guildId)) {
                const guild = client.guilds.cache.get(guildId);
                if (!guild) {
                    removed++;
                    continue;
                }

                if (state.voiceChannelId) {
                    let voiceChannel =
                        guild.channels.cache.get(state.voiceChannelId) ||
                        (await guild.channels.fetch(state.voiceChannelId).catch((err) => {
                            if (err.code === 10003 || err.code === 10004) return null;
                            return 'FETCH_FAILED';
                        }));

                    if (voiceChannel === 'FETCH_FAILED') {
                        validStates[guildId] = state;
                    } else if (!voiceChannel) {
                        state.voiceChannelId = null;

                        state.connectionStatus = false;
                        validStates[guildId] = state;
                    } else {
                        validStates[guildId] = state;
                    }
                } else {
                    validStates[guildId] = state;
                }
            } else {
                const keepState = await isWithinRetentionGracePeriod(guildId);
                if (keepState) {
                    validStates[guildId] = state;
                } else {
                    removed++;
                }
            }
        }

        if (removed > 0) {
            await saveGuildStatesToFirebase(validStates);
            logger.db(`Saved cleaned guild states: ${Object.keys(validStates).length}`);
        }

        return {
            cleaned: removed,
            remaining: Object.keys(validStates).length,
        };
    } catch (error) {
        logger.error('Failed to cleanup guild states', error);
        return {
            cleaned: 0,
            error: error.message,
        };
    }
}

async function cleanupInvalidControlIds(client) {
    try {
        const { loadControlIdsFromFirebase, saveControlIdsToFirebase } = getFirebaseServices();
        const data = await loadControlIdsFromFirebase();
        if (!data || !Object.keys(data).length) return { cleaned: 0, reason: 'No data' };
        const botGuilds = new Set(client.guilds.cache.keys());
        const cleaned = {};
        let removed = 0;
        for (const [gid, chData] of Object.entries(data)) {
            if (botGuilds.has(gid)) {
                const guild = client.guilds.cache.get(gid);
                if (!guild) {
                    removed++;
                    continue;
                }

                let validCh = {};
                for (const [cid, msgIds] of Object.entries(chData)) {
                    let ch = guild.channels.cache.get(cid) || (await guild.channels.fetch(cid).catch(() => null));
                    if (ch) {
                        const validMsgs = [];
                        const ids = Array.isArray(msgIds) ? msgIds : [msgIds];
                        for (const mid of ids) {
                            try {
                                const msg = await ch.messages.fetch(mid).catch(() => null);
                                if (msg) validMsgs.push(mid);
                            } catch {}
                        }
                        if (validMsgs.length) validCh[cid] = validMsgs;
                    }
                }

                if (Object.keys(validCh).length) cleaned[gid] = validCh;
            } else {
                if (await isWithinRetentionGracePeriod(gid)) {
                    cleaned[gid] = chData;
                } else {
                    removed++;
                }
            }
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

async function performMaintenance(client) {
    if (!client) {
        return {
            success: false,
            reason: 'Client not provided',
        };
    }

    const results = {
        setupGuilds: await cleanupInvalidSetupGuilds(client),
        guildStates: await cleanupInvalidGuildStates(client),
        controlIds: await cleanupInvalidControlIds(client),
        expiredData: await cleanExpiredLeftData(client),
    };

    return {
        success: true,
        results,
    };
}

let retentionInterval = null;

function startRetentionScheduler(client) {
    if (retentionInterval) {
        clearInterval(retentionInterval);
    }

    retentionInterval = setInterval(async () => {
        try {
            const result = await performMaintenance(client);
            logger.db(`Periodic retention cleanup completed: ${JSON.stringify(result)}`);
        } catch (error) {
            logger.error('Retention scheduler failed', error);
        }
    }, cleanupInterval);

    if (retentionInterval && typeof retentionInterval.unref === 'function') {
        retentionInterval.unref();
    }
}

function stopRetentionScheduler() {
    if (!retentionInterval) {
        return;
    }

    clearInterval(retentionInterval);

    retentionInterval = null;
}

module.exports.markGuildAsLeft = markGuildAsLeft;
module.exports.markGuildAsPresent = markGuildAsPresent;
module.exports.cleanExpiredLeftData = cleanExpiredLeftData;
module.exports.clearGuildData = clearGuildData;
module.exports.performMaintenance = performMaintenance;
module.exports.retention_days = retention_days;
module.exports.startRetentionScheduler = startRetentionScheduler;
module.exports.stopRetentionScheduler = stopRetentionScheduler;
