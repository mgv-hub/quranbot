const logger = require('@logging/logger');
const { ChannelType } = require('discord.js');
const { saveSetupGuildsToFirebase } = require('@database/firebase');

// Validate channel IDs in setup data and auto-correct if channels no longer exist
async function validateAndFixSetupData(guild, setupData) {
    const guildId = guild.id;
    let requiresUpdate = false;
    let correctedData = { ...setupData };

    const fetchChannelSafe = async (id) => {
        if (!id) return null;
        const cached = guild.channels.cache.get(id);
        if (cached) return cached;
        try {
            return await guild.channels.fetch(id);
        } catch (err) {
            if (err.code === 10003 || err.code === 10004) {
                return null;
            }
            // For rate limits, network errors, etc., return 'FETCH_FAILED' to prevent accidental data loss
            return 'FETCH_FAILED';
        }
    };

    // Validate category ID
    if (setupData.categoryId) {
        const category = await fetchChannelSafe(setupData.categoryId);
        if (category === 'FETCH_FAILED') return setupData; // Abort validation if fetch fails to prevent data loss
        if (!category || category.type !== ChannelType.GuildCategory) {
            const fallbackCategory = guild.channels.cache.find(
                (c) => c.name === '🕋︱القُرآن الكريم' && c.type === ChannelType.GuildCategory,
            );
            if (fallbackCategory) {
                correctedData.categoryId = fallbackCategory.id;
                requiresUpdate = true;
                logger.info('Guild ' + guildId + ' Fixed Category ID To ' + fallbackCategory.id);
            } else {
                correctedData.categoryId = null;
                requiresUpdate = true;
                logger.info('Guild ' + guildId + ' Category Not Found Cleared ID, keeping channels');
            }
        }
    }

    if (setupData.azkarChannelId) {
        const adhkarChannel = await fetchChannelSafe(setupData.azkarChannelId);
        if (adhkarChannel === 'FETCH_FAILED') return setupData;
        if (!adhkarChannel || !adhkarChannel.isTextBased()) {
            const fallbackChannel =
                guild.channels.cache.find((c) => c.name === '🌙︱الأذكار' && c.type === ChannelType.GuildText) ||
                guild.channels.cache.find((c) => c.name.includes('أذكار') && c.type === ChannelType.GuildText);
            if (fallbackChannel) {
                correctedData.azkarChannelId = fallbackChannel.id;
                requiresUpdate = true;
                logger.info('Guild ' + guildId + ' Fixed Azkar Channel ID To ' + fallbackChannel.id);
            } else {
                //  correctedData.azkarChannelId = null;
                //  requiresUpdate = true;
                logger.warn('Guild ' + guildId + ' Azkar Channel Not Found Cleared ID');
            }
        }
    }

    // Validate voice channel ID
    if (setupData.voiceChannelId) {
        const voiceChannel = await fetchChannelSafe(setupData.voiceChannelId);
        if (voiceChannel === 'FETCH_FAILED') return setupData;
        if (!voiceChannel || voiceChannel.type !== ChannelType.GuildVoice) {
            const fallbackVoice = guild.channels.cache.find(
                (c) => c.name === '🕌︱بثّ القُرآن الكريم' && c.type === ChannelType.GuildVoice,
            );
            if (fallbackVoice) {
                correctedData.voiceChannelId = fallbackVoice.id;
                requiresUpdate = true;
                logger.info('Guild ' + guildId + ' Fixed Voice Channel ID To ' + fallbackVoice.id);
            } else {
                correctedData.voiceChannelId = null;
                requiresUpdate = true;
                logger.warn('Guild ' + guildId + ' Voice Channel Not Found Cleared ID');
            }
        }
    }

    // Validate text channel ID for control panel
    if (setupData.textChannelId) {
        const textChannel = await fetchChannelSafe(setupData.textChannelId);
        if (textChannel === 'FETCH_FAILED') return setupData;
        if (!textChannel || !textChannel.isTextBased()) {
            const fallbackText = guild.channels.cache.find((c) => c.name === '📖︱تحكم البوت القرآني' && c.type === ChannelType.GuildText);
            if (fallbackText) {
                correctedData.textChannelId = fallbackText.id;
                requiresUpdate = true;
                logger.info('Guild ' + guildId + ' Fixed Text Channel ID To ' + fallbackText.id);
            } else {
                correctedData.textChannelId = null;
                requiresUpdate = true;
                logger.info('Guild ' + guildId + ' Text Channel Not Found Cleared ID');
            }
        }
    }

    if (requiresUpdate) {
        global.setupGuilds[guildId] = correctedData;
        await saveSetupGuildsToFirebase(global.setupGuilds);
        logger.info('Guild ' + guildId + ' Setup Data Updated In Firebase');
    }

    return correctedData;
}

module.exports.validateAndFixSetupData = validateAndFixSetupData;
