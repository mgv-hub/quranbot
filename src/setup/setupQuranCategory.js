const { getGuildState } = require('../state/GuildStateManager');
const logger = require('@logging/logger');
const { createControlEmbed } = require('@ui/embeds');
const { createReciterRow, createSelectRow, createButtonRow, createNavigationRow, createRadioRow } = require('@ui/components');
const { saveControlId } = require('@database/trackers/controlIds');
const { saveSetupGuildsToFirebase } = require('@database/firebase');
const { createCategory, createVoiceChannel, createTextChannel, createAzkarChannel } = require('./channelCreator');

let startAzkarTimerForGuild;

try {
    ({ startAzkarTimerForGuild } = require('../state/azkarManager'));
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
    if (isReSetup) {
        const old = global.setupGuilds[gid];
        const toDelete = [old.voiceChannelId, old.textChannelId, old.azkarChannelId];
        for (const id of toDelete) {
            if (!id) continue;

            try {
                const ch = guild.channels.cache.get(id) || (await guild.channels.fetch(id).catch(() => null));
                if (ch) {
                    await ch.delete('Quran bot re-setup');
                    await new Promise((r) => setTimeout(r, 800));
                }
            } catch (e) {
                logger.error('Channel delete failed ' + id, e);
            }
        }

        if (old.categoryId) {
            try {
                const cat = guild.channels.cache.get(old.categoryId) || (await guild.channels.fetch(old.categoryId).catch(() => null));
                if (cat) {
                    for (const [, child] of cat.children.cache) {
                        await child.delete('Re-setup child cleanup').catch(() => {});
                    }
                    await new Promise((r) => setTimeout(r, 500));
                    await cat.delete('Quranbot re-setup');
                    await new Promise((r) => setTimeout(r, 800));
                }
            } catch (e) {
                logger.error('Category delete failed in ' + gid, e);
            }
        }
    }

    try {
        const cat = await createCategory(guild, ix, isReSetup);
        const voice = await createVoiceChannel(guild, cat, ix, isReSetup);
        const text = await createTextChannel(guild, cat, ix, isReSetup);
        const azkar = await createAzkarChannel(guild, cat, ix, isReSetup);

        if (!global.setupGuilds) global.setupGuilds = {};
        global.setupGuilds[gid] = {
            // Store setup data in global state for quick access and persistence
            categoryId: cat.id,
            voiceChannelId: voice.id,
            textChannelId: text.id,
            azkarChannelId: azkar.id,
            // leftAt: null,
            // isLeft: false,
        };

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

        return { category: cat, voiceChannel: voice, textChannel: text, azkarChannel: azkar };
    } catch (err) {
        if (!err.message?.includes('Missing Permissions') && !err.message?.includes('Missing Access') && err.code !== 50013) {
            logger.error(err);
        }
        throw err;
    }
}

module.exports.setupQuranCategory = setupQuranCategory;
