const logger = require('@infrastructure/Logging/Logger');
const persistentStateManager = require('@state/PersistentStateManager');
const { time_constants, urls } = require('@config/Constants');
const { categorizeDiscordError } = require('@modules/Azkar/Services/DiscordApiErrorClassifier');

const adhkar_base_url = urls.adhkar_base_url;
const request_timeout_ms = time_constants.request_timeout_ms;

async function sendWithRetry(ch, content, maxRetry, gid, cid) {
    try {
        const msg = await ch.send(content);
        return { success: true, message: msg, error: null, type: null };
    } catch (err) {
        const errType = categorizeDiscordError(err);
        if (errType === 'UNKNOWN_CHANNEL' || errType === 'MISSING_PERMISSIONS') {
            logger.info(`Azkar ${errType === 'MISSING_PERMISSIONS' ? 'Missing Permissions' : 'Channel Not Found'} In Channel ${cid}`);

            const { getGuildState } = require('@state/GuildStateManager');
            const st = getGuildState(gid);

            if (st) {
                if (st.azkarChannelId === cid) {
                    st.azkarChannelId = null;
                    persistentStateManager.updateGuildState(gid, { azkarChannelId: null });
                }
            }

            if (global.setupGuilds && global.setupGuilds[gid]) {
                if (global.setupGuilds[gid].azkarChannelId === cid) {
                    global.setupGuilds[gid].azkarChannelId = null;
                    const { saveSetupGuildsToFirebase } = require('@infrastructure/Persistence/Firebase/FirebaseIndex');
                    saveSetupGuildsToFirebase(global.setupGuilds).catch(() => {});
                }
            }

            return { success: false, error: err, type: errType, guildId: gid, channelId: cid };
        }
        return { success: false, error: err, type: errType, guildId: gid, channelId: cid };
    }
}

function getMentionText(gid) {
    const guildState = persistentStateManager.getGuildState(gid);
    if (guildState?.azkarMentionEnabled && guildState?.azkarMentionRoleId) {
        return `<@&${guildState.azkarMentionRoleId}>`;
    }
    return null;
}

async function sendImageAzkar(ch, imgUrl, ts, gid, maxRetry, cid) {
    try {
        const res = await fetch(imgUrl, { headers: { 'User-Agent': 'QuranBot/1.0' }, timeout: request_timeout_ms });
        if (!res.ok) return { success: false, type: 'OTHER', reason: 'HTTP ' + res.status, guildId: gid, channelId: cid };
        
        const mentionText = getMentionText(gid);
        const containerComponents = [
            { type: 10, content: `### 🕋 ذكر` },
            { type: 14, divider: true, spacing: 1 },
        ];

        if (mentionText) containerComponents.push({ type: 10, content: mentionText });
        containerComponents.push({ type: 12, items: [{ media: { url: imgUrl } }] });
        containerComponents.push({ type: 14, divider: true, spacing: 1 });

        containerComponents.push({
            type: 1, components: [
                { type: 2, custom_id: 'azkar_get_role', label: 'تفعيل المنشن', style: 2 },
                { type: 2, custom_id: 'azkar_settings', label: 'الاعدادات', style: 2 },
            ],
        });

        const components = [{ type: 17, accent_color: 0xfefdfe, components: containerComponents }];
        
        const result = await sendWithRetry(ch, { components, flags: 32768, allowed_mentions: { parse: ['roles'] } }, maxRetry, gid, cid);
        if (result.success) await incStat();

        return result;
    } catch (err) {
        logger.warn('Failed to load adhkar image ' + err.message);
        return { success: false, type: categorizeDiscordError(err), reason: err.message, guildId: gid, channelId: cid };
    }
}

async function sendAudioAzkar(ch, dhikr, text, ts, gid, maxRetry, cid) {
    if (!dhikr.audio) return { success: false, type: 'OTHER', reason: 'No audio available', guildId: gid, channelId: cid };
    const url = adhkar_base_url + dhikr.audio;
    const id = dhikr.filename || 'dhikr_' + dhikr.id;
    const customId = 'play_azkar_' + id + '_' + ts;
    
    const { trackAudioData } = require('@modules/Azkar/Services/AudioDataCacheManager');
    trackAudioData(customId, { url, filename: id, timestamp: ts });
    
    const mentionText = getMentionText(gid);
    const contentText = mentionText ? `${mentionText}\n${text}` : text;

    const components = [{
        type: 17, accent_color: 0xfefdfe, components: [
            { type: 10, content: `### 🕋 ذكر` },
            { type: 14, divider: true, spacing: 1 },
            { type: 10, content: contentText },
            { type: 14, divider: false, spacing: 2 },
            { type: 10, content: '> **ملاحظة**\nللاستماع إلى الذكر بطريقة أوضح وأدق، يُرجى الضغط على زر **استماع**.\nوقد يساعد ذلك على فهم الذكر وقراءته بالشكل الصحيح.' },
            { type: 14, divider: true, spacing: 1 },
            { type: 1, components: [
                { type: 2, custom_id: customId, label: 'استماع', style: 2 },
                { type: 2, custom_id: 'azkar_get_role', label: 'تفعيل المنشن', style: 2 },
                { type: 2, custom_id: 'azkar_settings', label: 'الاعدادات', style: 2 },
            ]},
        ],
    }];
    
    const result = await sendWithRetry(ch, { components, flags: 32768, allowed_mentions: { parse: ['roles'] } }, maxRetry, gid, cid);
    if (result.success) await incStat();

    return result;
}

async function sendCategoryAudioAzkar(ch, cat, text, ts, gid, maxRetry, cid) {
    if (!cat.audio) return { success: false, type: 'OTHER', reason: 'No category audio available', guildId: gid, channelId: cid };

    const url = adhkar_base_url + cat.audio;
    const id = cat.filename || 'category_' + cat.id;
    const customId = 'play_azkar_category_' + id + '_' + ts;
    
    const { trackAudioData } = require('@modules/Azkar/Services/AudioDataCacheManager');
    trackAudioData(customId, { url, filename: id, timestamp: ts });
    
    const mentionText = getMentionText(gid);
    const contentText = mentionText ? `${mentionText}\n${text}` : text;

    const components = [{
        type: 17, accent_color: 0xfefdfe, components: [
            { type: 10, content: `### 🕋 ذكر` },
            { type: 14, divider: true, spacing: 1 },
            { type: 10, content: contentText },
            { type: 14, divider: false, spacing: 2 },
            { type: 10, content: '> **ملاحظة**\nللاستماع إلى الذكر بطريقة أوضح وأدق، يُرجى الضغط على زر **استماع**.\nوقد يساعد ذلك على فهم الذكر وقراءته بالشكل الصحيح.' },
            { type: 14, divider: true, spacing: 1 },
            { type: 1, components: [
                { type: 2, custom_id: customId, label: 'استماع للقسم', style: 2 },
                { type: 2, custom_id: 'azkar_get_role', label: 'تفعيل المنشن', style: 2 },
                { type: 2, custom_id: 'azkar_settings', label: 'الاعدادات', style: 2 },
            ]},
        ],
    }];
    
    const result = await sendWithRetry(ch, { components, flags: 32768, allowed_mentions: { parse: ['roles'] } }, maxRetry, gid, cid);
    if (result.success) await incStat();

    return result;
}

async function incStat() {
    try {
        const { incrementStat } = require('@statistics/StatisticsTracker');
        if (typeof incrementStat === 'function') incrementStat('azkarSent', 1);
    } catch {
        logger.debug('Statistics tracking not available for azkar');
    }
}

module.exports.sendWithRetry = sendWithRetry;
module.exports.getMentionText = getMentionText;
module.exports.sendImageAzkar = sendImageAzkar;
module.exports.sendAudioAzkar = sendAudioAzkar;
module.exports.sendCategoryAudioAzkar = sendCategoryAudioAzkar;
