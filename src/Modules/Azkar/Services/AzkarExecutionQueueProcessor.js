const logger = require('@infrastructure/Logging/Logger');
const { clean_Dhikr } = require('@shared/Helpers/AzkarHelper');
const { time_constants } = require('@config/Constants');
const { sendImageAzkar, sendAudioAzkar, sendCategoryAudioAzkar } = require('@modules/Azkar/Services/AzkarMessageDispatcher');

const azkar_max_retry_attempts = time_constants.azkar_max_retry_attempts;
const fallback_azkar_data = [
    {
        id: 1,
        category: 'تسبيح',
        audio: '/audio/ar_7esn_AlMoslem_by_Doors_028.mp3',
        filename: 'ar_7esn_AlMoslem_by_Doors_028',
        array: [{ id: 1, text: 'سبحان الله وبحمده', count: 100, audio: '/audio/91.mp3', filename: '91' }],
    },
];

const azkarSendQueue = [];
let isProcessingQueue = false;

async function Azkarqueue() {
    if (isProcessingQueue || azkarSendQueue.length === 0) return;
    isProcessingQueue = true;
    while (azkarSendQueue.length > 0) {
        const task = azkarSendQueue.shift();
        try {
            await executeAzkarSend(task.cid, task.gid, task.maxRetry, task.forceImg);
        } catch (err) {
            logger.error('Azkar queue ' + task.gid, err);
        }
        await new Promise((resolve) => setTimeout(resolve, 2200));
    }
    isProcessingQueue = false;
}

function queueAzkarSend(cid, gid, maxRetry = 5, forceImg = false) {
    azkarSendQueue.push({ cid, gid, maxRetry, forceImg });
    Azkarqueue();
}

async function executeAzkarSend(cid, gid, maxRetry = azkar_max_retry_attempts, forceImg = false) {
    const { getGuildState } = require('@state/GuildStateManager');
    const st = getGuildState(gid);
    if (!st || st.azkarChannelId !== cid) {
        return { success: false, reason: 'Channel ID changed or guild state not found' };
    }
    let ch = global.client.channels.cache.get(cid);

    if (!ch) {
        try {
            ch = await global.client.channels.fetch(cid);
        } catch (err) {
            const { categorizeDiscordError } = require('@modules/Azkar/Services/DiscordApiErrorClassifier');
            const errType = categorizeDiscordError(err);
            if (errType === 'UNKNOWN_CHANNEL' || errType === 'MISSING_PERMISSIONS') {
                logger.info(`Azkar ${errType === 'MISSING_PERMISSIONS' ? 'Missing Permissions' : 'Channel Not Found'} In Channel ${cid}`);
                const persistentStateManager = require('@state/PersistentStateManager');

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
            }
            return { success: false, reason: 'Channel fetch failed' };
        }
    }

    if (!ch || !ch.isTextBased?.()) {
        return { success: false, reason: 'Channel not found or invalid locally' };
    }

    let data = global.azkarData || [];
    if (!Array.isArray(data) || !data.length) {
        logger.warn('Azkar No Data For Guild ' + gid + ' Using Fallback');
        data = fallback_azkar_data;
    }

    const cat = data[Math.floor(Math.random() * data.length)];
    if (!cat?.array?.length) return { success: false, reason: 'No valid azkar category' };
    const dhikr = cat.array[Math.floor(Math.random() * cat.array.length)];
    if (!dhikr) return { success: false, reason: 'No valid dhikr' };

    const ts = Date.now();
    const text = clean_Dhikr(dhikr.text || 'لا يوجد');
    const useImg = forceImg || (global.azkarImages?.length && Math.random() > 0.5);

    if (useImg && global.azkarImages?.length) {
        const img = global.azkarImages[Math.floor(Math.random() * global.azkarImages.length)];
        const res = await sendImageAzkar(ch, img, ts, gid, maxRetry, cid);
        if (res.success) return { success: true, type: 'image' };
    }

    if (dhikr.audio) {
        const res = await sendAudioAzkar(ch, dhikr, text, ts, gid, maxRetry, cid);
        if (res.success) return { success: true, type: 'audio' };
    }

    if (cat.audio && !dhikr.audio) {
        const res = await sendCategoryAudioAzkar(ch, cat, text, ts, gid, maxRetry, cid);
        if (res.success) return { success: true, type: 'category_audio' };
    }

    return { success: false, reason: 'All send methods failed' };
}

module.exports.queueAzkarSend = queueAzkarSend;
module.exports.executeAzkarSend = executeAzkarSend;
