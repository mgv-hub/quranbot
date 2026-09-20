const { getGuildState } = require('@state/GuildStateManager');
const logger = require('@infrastructure/Logging/Logger');
const { createControlEmbed } = require('@infrastructure/Discord/UI/Embeds');
const { createReciterRow, createSelectRow, createButtonRow, createNavigationRow, createRadioRow } = require('@infrastructure/Discord/UI/Components');
const { saveControlId } = require('@trackers/ControlIdsTracker');
const { saveSetupGuildsToFirebase } = require('@infrastructure/Persistence/Firebase/FirebaseIndex');
const { createCategory, createVoiceChannel, createTextChannel, createAzkarChannel } = require('@modules/Setup/Services/ChannelCreator');
const { ChannelType } = require('discord.js');
const auditLogger = require('@infrastructure/Logging/AuditLogger');

let startAzkarTimerForGuild;

try {
    ({ startAzkarTimerForGuild } = require('@modules/Azkar/AzkarModule'));
} catch (err) {
    logger.error(err);

    startAzkarTimerForGuild = (gid, cid) => {
        logger.warn('Fallback azkar active for guild' + gid);

        const st = getGuildState(gid);
        if (st.azkarTimer) return;
        st.azkarChannelId = cid;

        st.azkarTimer = setInterval(() => {
            const ch = global.client.channels.cache.get(cid);
            if (ch) ch.send('🕋 ذكر لا يمكن توليد الصور حالياً');
        }, 10000);
    };
}

async function safelyDeleteBotChannels(guild, oldSetup, gid) {
    const channelsToDelete = [];
    const blockedDeletions = [];

    if (oldSetup.voiceChannelId) channelsToDelete.push({ id: oldSetup.voiceChannelId, type: 'voice' });
    if (oldSetup.textChannelId) channelsToDelete.push({ id: oldSetup.textChannelId, type: 'text' });
    if (oldSetup.azkarChannelId) channelsToDelete.push({ id: oldSetup.azkarChannelId, type: 'azkar' });

    const deletedChannels = [];

    for (const chInfo of channelsToDelete) {
        if (!chInfo.id) continue;

        const ch = guild.channels.cache.get(chInfo.id) || (await guild.channels.fetch(chInfo.id).catch(() => null));

        if (!ch) {
            continue;
        }

        const isOwnedByBot = (chInfo.type === 'voice' && ch.id === oldSetup.voiceChannelId) ||
            (chInfo.type === 'text' && ch.id === oldSetup.textChannelId) ||
            (chInfo.type === 'azkar' && ch.id === oldSetup.azkarChannelId);

        if (!isOwnedByBot) {
            auditLogger.logBlockedDeletion(guild, ch.id, ch.name, 'Channel ID not registered in bot setup data');
            blockedDeletions.push({ id: ch.id, name: ch.name, type: chInfo.type });
            continue;
        }

        try {
            await ch.delete('Quran bot re-setup - owned channel');
            deletedChannels.push({ id: ch.id, name: ch.name, type: chInfo.type });
            auditLogger.logChannelDeletion(guild, 'DELETE', {
                channelId: ch.id,
                channelName: ch.name,
                channelType: chInfo.type,
            });

            await new Promise((r) => setTimeout(r, 800));
        } catch (e) {
            logger.error(`Channel delete failed ${ch.id} (${chInfo.type})`, e);
            auditLogger.logBlockedDeletion(guild, ch.id, ch.name, `Deletion failed ${e.message}`);
        }
    }

    if (oldSetup.categoryId) {
        const cat = guild.channels.cache.get(oldSetup.categoryId) || (await guild.channels.fetch(oldSetup.categoryId).catch(() => null));

        if (cat && cat.type === ChannelType.GuildCategory) {
            const botChildIds = new Set([
                oldSetup.voiceChannelId,
                oldSetup.textChannelId,
                oldSetup.azkarChannelId,
            ].filter(Boolean));

            const hasNonBotChannels = Array.from(cat.children.cache.values()).some(child => !botChildIds.has(child.id));

            if (hasNonBotChannels) {
                logger.info(`Category ${cat.id} contains non-bot channels Preserving category and leaving all channels as they are`);
            } else {
                try {
                    await cat.delete('Quran bot re-setup - empty category');
                    auditLogger.logChannelDeletion(guild, 'DELETE_CATEGORY', {
                        channelId: cat.id,
                        channelName: cat.name,
                        reason: 'Bot re-setup - empty category after deleting bot channels',
                    });
                    await new Promise((r) => setTimeout(r, 800));
                } catch (e) {
                    logger.error(`Category delete failed ${oldSetup.categoryId}`, e);
                }
            }
        }
    }

    return { deletedChannels, blockedDeletions };
}

async function setupQuranCategory(guild, ix, opts = {}) {
    // Core function to create or reuse Quran category and channels, update permissions, and store setup state. Returns created channels for confirmation message
    const { channelWillBeDeleted = false } = opts;
    const gid = guild.id;
    const st = getGuildState(gid);

    st.isPaused = true;
    st.pauseReason = 'manual';
    st.playbackMode = 'radio';

    if (st.connection && !st.connection.destroyed) {
        try {
            st.connection.unsubscribe(st.player);
        } catch (e) {
            logger.info('Unsubscribe skip in ' + gid, e);
        }
        st.connection = null;
    }

    st.player = null;
    st.voiceChannelId = null;

    if (st.azkarTimer) {
        clearInterval(st.azkarTimer);
        st.azkarTimer = null;
        st.azkarChannelId = null;
    }

    const isReSetup = !!global.setupGuilds?.[gid];
    const oldSetup = isReSetup ? { ...global.setupGuilds[gid] } : null;
    let deletionResult = { deletedChannels: [], blockedDeletions: [] };

    if (isReSetup) {
        auditLogger.logSetupOperation(guild, 'RE_SETUP_START', oldSetup, null, 'User initiated re-setup');
        deletionResult = await safelyDeleteBotChannels(guild, oldSetup, gid);

        if (deletionResult.blockedDeletions.length > 0) {
            logger.warn(`Guild ${gid}: ${deletionResult.blockedDeletions.length} channels were protected from deletion`);
        }
    }

    try {
        const cat = await createCategory(guild, ix, isReSetup);
        const voice = await createVoiceChannel(guild, cat, ix, isReSetup);
        const text = await createTextChannel(guild, cat, ix, isReSetup);
        const azkar = await createAzkarChannel(guild, cat, ix, isReSetup);

        auditLogger.logChannelCreation(guild, 'CREATE_CATEGORY', {
            channelId: cat.id,
            channelName: cat.name,
            reason: 'Bot setup',
        });
        auditLogger.logChannelCreation(guild, 'CREATE_VOICE', {
            channelId: voice.id,
            channelName: voice.name,
            reason: 'Bot setup',
        });
        auditLogger.logChannelCreation(guild, 'CREATE_TEXT', {
            channelId: text.id,
            channelName: text.name,
            reason: 'Bot setup',
        });
        auditLogger.logChannelCreation(guild, 'CREATE_AZKAR', {
            channelId: azkar.id,
            channelName: azkar.name,
            reason: 'Bot setup',
        });

        if (!global.setupGuilds) global.setupGuilds = {};
        const newSetup = {
            // Store setup data in global state for quick access and persistence
            categoryId: cat.id,
            voiceChannelId: voice.id,
            textChannelId: text.id,
            azkarChannelId: azkar.id,
            // leftAt: null,
            // isLeft: false,
        };

        global.setupGuilds[gid] = newSetup;
        auditLogger.logSetupOperation(guild, isReSetup ? 'RE_SETUP_COMPLETE' : 'INITIAL_SETUP_COMPLETE', oldSetup, newSetup, isReSetup ? 'Re-setup completed' : 'Initial setup completed');

        st.azkarChannelId = azkar.id;
        startAzkarTimerForGuild(gid, azkar.id, true);
        await saveSetupGuildsToFirebase(global.setupGuilds);

        const embed = createControlEmbed(st, gid);
        const rows = [];

        if (st.playbackMode === 'surah') {
            rows.push(createReciterRow(st), createSelectRow(st));
        } else {
            rows.push(createRadioRow(st));
        }

        rows.push(createButtonRow(st), ...createNavigationRow(st, gid));
        const msg = await text.send({
            content: 'تم ' + (isReSetup ? 'إعادة ' : '') + 'إعداد فئة القرآن بواسطة أحد مسؤولي هذا الخادم. استخدم اللوحة أدناه.',
            embeds: [embed],
            components: rows,
        });

        await saveControlId(gid, text.id, msg.id);

        return {
            category: cat,
            voiceChannel: voice,
            textChannel: text,
            azkarChannel: azkar,
            deletionResult: deletionResult,
        };
    } catch (err) {
        if (!err.message?.includes('Missing Permissions') && !err.message?.includes('Missing Access') && err.code !== 50013) {
            logger.error(err);
        }
        throw err;
    }
}

module.exports.setupQuranCategory = setupQuranCategory;
