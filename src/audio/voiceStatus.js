const { PermissionsBitField } = require('discord.js');
const logger = require('@logging/logger');
const { emoji } = require('@helpers/emojis');

const queue = new Map();
const rateLimits = new Map();
const statusCache = new Map();
let processing = false;

setInterval(() => {
    const now = Date.now();
    for (const [channelId, limit] of rateLimits.entries()) {
        if (now > limit) rateLimits.delete(channelId);
    }
    statusCache.clear();
}, 3600000);

async function procesqueue() {
    if (processing || queue.size === 0) return;
    processing = true;

    while (queue.size > 0) {
        const [channelId, item] = queue.entries().next().value;
        queue.delete(channelId);

        const { statusText, client } = item;
        const rateLimit = rateLimits.get(channelId);
        if (rateLimit && Date.now() < rateLimit) {
            await new Promise((resolve) => setTimeout(resolve, rateLimit - Date.now()));
        }

        try {
            await setVoiceChannelStatus(channelId, statusText, client);
            statusCache.set(channelId, statusText);
            await new Promise((resolve) => setTimeout(resolve, 2000));
        } catch (error) {
            if (error.status === 429) {
                const retryAfter = (error.retryAfter || 60) * 1000;
                rateLimits.set(channelId, Date.now() + retryAfter);
                queue.set(channelId, item);
                await new Promise((resolve) => setTimeout(resolve, retryAfter));
            } else if (error.code !== 50013 && error.status !== 403) {
                logger.error(`Failed to set voice ${channelId} ${error.message}`);
            }
        }
    }
    processing = false;
}

async function setVoiceChannelStatus(channelId, statusText, client) {
    if (!client?.rest) throw new Error('Client REST');
    const status = statusText ? String(statusText).substring(0, 500) : '';
    await client.rest.put(`/channels/${channelId}/voice-status`, {
        body: { status },
        auth: true,
    });
}

function canSetVoiceStatus(channel, botMember) {
    if (!channel || !botMember) return false;
    const perms = channel.permissionsFor(botMember);
    if (!perms) return false;
    if (perms.has(PermissionsBitField.Flags.ManageChannels)) return true;
    if (PermissionsBitField.Flags.SetVoiceChannelStatus && perms.has(PermissionsBitField.Flags.SetVoiceChannelStatus)) {
        return true;
    }
    return false;
}

function generateStatusText(guildState) {
    if (!guildState) return '';

    if (guildState.isPaused) {
        return `${emoji.pause} متوقف مؤقتاً`;
    }

    if (guildState.playbackMode === 'surah') {
        const surahIndex = Math.max(0, (guildState.currentSurah || 1) - 1);
        const surahName = global.surahNames?.[surahIndex] || `سورة ${guildState.currentSurah}`;
        const reciterData = global.reciters?.[guildState.currentReciter];
        const reciterName = reciterData?.name || 'قارئ غير محدد';
        return `${emoji.headphones} ${surahName} | ${reciterName}`;
    }

    if (guildState.playbackMode === 'radio') {
        const radioIndex = guildState.currentRadioIndex || 0;
        const radioData = global.quranRadios?.[radioIndex];
        const radioName = radioData?.name || 'إذاعة قرآنية';
        return `${emoji.radio} ${radioName}`;
    }
    return `${emoji.headphones} بث قرآني`;
}

async function updateVoiceStatus(guildId, guildState, client) {
    if (!guildState?.channelId || !client) return;

    const channel =
        client.channels.cache.get(guildState.channelId) || (await client.channels.fetch(guildState.channelId).catch(() => null));
    if (!channel) return;

    const botMember = channel.guild?.members.me;
    if (!canSetVoiceStatus(channel, botMember)) return;

    const statusText = generateStatusText(guildState);
    if (statusCache.get(guildState.channelId) === statusText) return;

    queue.set(guildState.channelId, { statusText, client });
    procesqueue();
}

module.exports.canSetVoiceStatus = canSetVoiceStatus;
module.exports.generateStatusText = generateStatusText;
module.exports.updateVoiceStatus = updateVoiceStatus;
module.exports.setVoiceChannelStatus = setVoiceChannelStatus;
