const { EmbedBuilder } = require('discord.js');
const { getCurrentDurations, formatDurationText, parseDurationToSeconds, getDurationForSurah } = require('@audio');
const logger = require('@logging/logger');
const path = require('path');
const fs = require('fs');

// load package info for footer
const pkgPath = path.resolve(__dirname, '../../package.json');
let pkg = {};
try {
    pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
} catch {}

// embed cache + cleanup
const cache = new Map();
setInterval(() => {
    const now = Date.now();
    for (const [k, { timestamp, active }] of cache.entries()) {
        const ttl = active ? 30000 : 60000;
        if (now - timestamp > ttl) cache.delete(k);
    }
    if (cache.size > 100) {
        const entries = Array.from(cache.entries());
        for (let i = 0; i < Math.floor(entries.length / 2); i++) cache.delete(entries[i][0]);
        logger.info('Cleaned Up Embed Cache Removed ' + Math.floor(entries.length / 2) + ' Items');
    }
}, 10000);

function createControlEmbed(st, guildId) {
    try {
        if (!st || !global.surahNames?.length || !Object.keys(global.reciters || {}).length) {
            logger.warn('Missing data for guild ' + guildId);
            return new EmbedBuilder().setColor(0xfefdfe).setTitle('لوحة التحكم').setDescription('جاري تحميل البيانات يرجى الانتظار');
        }

        // cache key based on state
        const key =
            'control_embed_' +
            guildId +
            '_' +
            st.currentSurah +
            '_' +
            st.currentReciter +
            '_' +
            st.currentPage +
            '_' +
            st.currentReciterPage +
            '_' +
            st.currentRadioPage +
            '_' +
            st.playbackMode +
            '_' +
            st.controlMode;
        if (cache.has(key)) {
            const c = cache.get(key);
            c.active = true;
            c.timestamp = Date.now();
            return c.embed;
        }

        const totalSurah = Math.ceil(global.surahNames.length / 25);
        const totalRec = Math.ceil(Object.keys(global.reciters).length / 25);
        const isSurah = st.playbackMode === 'surah';
        const modeLabel = st.controlMode === 'everyone' ? 'لجميع الأعضاء (تحكم كامل)' : 'للمسؤولين فقط';
        const desc = isSurah
            ? 'اختر السورة من القائمة أدناه أو استخدم أزرار التحكم للتنقل بين السور والقراء'
            : 'اختر محطة إذاعية من القائمة أدناه أو استخدم أزرار التحكم لتبديل المحطات';

        let curVal = 'جاري التحميل',
            recField = null,
            pageField = null,
            recPageField = null,
            durText = 'غير متاح',
            thumb = null;
        const sIdx = Math.max(0, Math.min(st.currentSurah - 1, global.surahNames.length - 1));

        if (isSurah) {
            try {
                curVal = global.surahNames[sIdx] || 'لا شيء';
            } catch {
                curVal = 'سورة ' + (sIdx + 1);
            }
            try {
                const d = getDurationForSurah(st, sIdx);
                durText = d.text;
                curVal += ' (' + durText + ')';
            } catch {}
            try {
                const r = global.reciters[st.currentReciter] ||
                    global.reciters[Object.keys(global.reciters)[0]] || {
                        name: 'غير محدد',
                        photo: '',
                    };
                recField = { name: 'القارئ', value: r?.name || 'غير محدد', inline: true };
                thumb = r?.photo || r?.["Sheikh's photo"] || '';
            } catch {
                recField = { name: 'القارئ', value: 'غير محدد', inline: true };
            }
            pageField = {
                name: 'الصفحة السور',
                value: 'صفحة ' + Math.min(st.currentPage + 1, totalSurah) + '/' + totalSurah,
                inline: true,
            };
            recPageField = {
                name: 'الصفحة القراء',
                value: 'صفحة ' + Math.min(st.currentReciterPage + 1, totalRec) + '/' + totalRec,
                inline: true,
            };
        } else {
            try {
                const rIdx = Math.max(0, Math.min(st.currentRadioIndex || 0, global.quranRadios.length - 1));
                curVal = global.quranRadios[rIdx]?.name || 'اذاعة قران';
            } catch {
                curVal = 'اذاعة قران';
            }
            const totalR = Math.ceil(global.quranRadios.length / 25);
            const curR = Math.min(st.currentRadioPage || 0, totalR - 1);
            pageField = {
                name: 'الصفحة الراديو',
                value: 'صفحة ' + (curR + 1) + '/' + totalR,
                inline: true,
            };
        }
        // const footer = `${pkg.lastUpdated || 'N/A'}\n${pkg.lastUpdateNote || ''}`;
        const footer = `${pkg.lastUpdateNote || ''} | ${pkg.lastUpdated || 'N/A'}`;
        const status = st.isPaused ? 'متوقف مؤقتا' : 'يعمل الآن';

        let embed = new EmbedBuilder()
            .setColor(0xfefdfe)
            .setTitle(isSurah ? 'وضع القرآن الكريم' : 'وضع الاذاعة القرانية')
            .setDescription(desc)
            .addFields(
                { name: 'الحالي', value: curVal, inline: true },
                ...(recField ? [recField] : []),
                { name: 'الحالة', value: status, inline: true },
                ...(pageField ? [pageField] : []),
                ...(recPageField ? [recPageField] : []),
                { name: 'وضع التحكم', value: modeLabel, inline: true },
            )
            .setFooter({ text: footer });

        if (thumb?.trim()) embed = embed.setThumbnail(thumb);

        cache.set(key, { embed, timestamp: Date.now(), active: true });
        return embed;
    } catch (err) {
        logger.error('Error Creating Control Panel For Guild ' + guildId, err);
        return new EmbedBuilder()
            .setColor(0xfefdfe)
            .setTitle('خطأ في لوحة التحكم')
            .setDescription('حدث خطأ في تحميل البيانات يرجى استخدام control مرة أخرى')
            .setFooter({ text: 'يرجى المحاولة لاحقا' });
    }
}

// clear cache by guild or all
function clearEmbedCache(guildId = null) {
    if (guildId) {
        for (const [k] of cache.entries()) {
            if (k.startsWith('control_embed_' + guildId + '_')) cache.delete(k);
        }
        logger.info('Cleared Embed Cache For Guild ' + guildId);
    } else {
        cache.clear();
        logger.info('Cleared All Embed Caches');
    }
}

module.exports.createControlEmbed = createControlEmbed;
module.exports.clearEmbedCache = clearEmbedCache;
module.exports.embedCache = cache;
