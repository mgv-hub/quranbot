require('pathlra-aliaser')();
const { EmbedBuilder } = require('discord.js');
const {
   getCurrentDurations,
   formatDurationText,
   parseDurationToSeconds,
   getDurationForSurah,
} = require('@audioUtils-core_utils');
const logger = require('@logger');
const path = require('path');
const fs = require('fs');

const packageJsonPath = path.resolve(__dirname, '../../package.json');
try {
   packageData = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
} catch (error) {
   logger.warn('Failed to read package.json for embed footer');
}
const embedCache = new Map();

setInterval(() => {
   const now = Date.now();
   for (const [key, { timestamp, active }] of embedCache.entries()) {
      const embed_cache_ttl = 30000;
      const cacheTtl = active ? embed_cache_ttl : embed_cache_ttl * 2;
      if (now - timestamp > cacheTtl) {
         embedCache.delete(key);
      }
   }
   if (embedCache.size > 100) {
      const entries = Array.from(embedCache.entries());
      const toRemove = Math.max(1, Math.floor(entries.length / 2));
      for (let i = 0; i < toRemove; i++) {
         embedCache.delete(entries[i][0]);
      }
      logger.info('Cleaned Up Embed Cache Removed ' + toRemove + ' Items');
   }
}, 10000);

function createControlEmbed(state, guildId) {
   try {
      if (!state) {
         logger.warn('No State For Guild ' + guildId);
         return new EmbedBuilder()
            .setColor(0x1e1f22)
            .setTitle('لوحة التحكم')
            .setDescription('جاري تحميل البيانات يرجى الانتظار');
      }
      if (!global.surahNames || global.surahNames.length === 0) {
         logger.warn('SurahNames Not Loaded Yet For Guild ' + guildId);
         return new EmbedBuilder()
            .setColor(0x1e1f22)
            .setTitle('لوحة التحكم')
            .setDescription('جاري تحميل البيانات يرجى الانتظار');
      }
      if (!global.reciters || Object.keys(global.reciters).length === 0) {
         logger.warn('Reciters Not Loaded Yet For Guild ' + guildId);
         return new EmbedBuilder()
            .setColor(0x1e1f22)
            .setTitle('لوحة التحكم')
            .setDescription('جاري تحميل البيانات يرجى الانتظار');
      }
      const cacheKey =
         'control_embed_' +
         guildId +
         '_' +
         state.currentSurah +
         '_' +
         state.currentReciter +
         '_' +
         state.currentPage +
         '_' +
         state.currentReciterPage +
         '_' +
         state.currentRadioPage +
         '_' +
         state.playbackMode;
      if (embedCache.has(cacheKey)) {
         const cachedEmbed = embedCache.get(cacheKey);
         cachedEmbed.active = true;
         cachedEmbed.timestamp = Date.now();
         return cachedEmbed.embed;
      }
      const totalPages = Math.ceil(global.surahNames.length / 25);
      const totalReciterPages = Math.ceil(Object.keys(global.reciters).length / 25);
      const controlModeText =
         state.controlMode === 'everyone'
            ? 'الجميع تنقل مع تأخير 90 ثانية تحكم كامل لكل الأعضاء قرآن راديو تنقل صفحات مع تأخير 90 ثانية'
            : 'فقط الأدمنز للتحكم';
      let currentFieldValue = 'جاري التحميل';
      let reciterField = null;
      let pageField = null;
      let reciterPageField = null;
      let currentDurationText = 'غير متاح';
      let thumbnailUrl = null;
      const safeSurahIndex = Math.max(0, Math.min(state.currentSurah - 1, global.surahNames.length - 1));
      if (state.playbackMode === 'surah') {
         try {
            currentFieldValue = global.surahNames[safeSurahIndex] || 'لا شيء';
         } catch (e) {
            currentFieldValue = 'سورة ' + (safeSurahIndex + 1);
         }
         try {
            const durationInfo = getDurationForSurah(state, safeSurahIndex);
            currentDurationText = durationInfo.text;
            currentFieldValue += ' (' + currentDurationText + ')';
         } catch (e) {
            logger.debug('Error getting duration for surah ' + safeSurahIndex);
         }
         try {
            const reciterData = global.reciters[state.currentReciter] ||
               global.reciters[Object.keys(global.reciters)[0]] || {
                  name: 'غير محدد',
                  photo: '',
               };
            const reciterName = reciterData?.name || 'غير محدد';
            reciterField = { name: 'القارئ', value: reciterName, inline: true };
            thumbnailUrl = reciterData?.photo || reciterData?.["Sheikh's photo"] || '';
         } catch (e) {
            reciterField = { name: 'القارئ', value: 'غير محدد', inline: true };
         }
         pageField = {
            name: 'الصفحة السور',
            value: 'صفحة ' + Math.min(state.currentPage + 1, totalPages) + '/' + totalPages,
            inline: true,
         };
         reciterPageField = {
            name: 'الصفحة القراء',
            value: 'صفحة ' + Math.min(state.currentReciterPage + 1, totalReciterPages) + '/' + totalReciterPages,
            inline: true,
         };
      } else {
         try {
            const radioIndex = Math.max(0, Math.min(state.currentRadioIndex || 0, global.quranRadios.length - 1));
            currentFieldValue = global.quranRadios[radioIndex]?.name || 'راديو قرآن';
         } catch (e) {
            currentFieldValue = 'راديو قرآن';
         }
         const totalPages = Math.ceil(global.quranRadios.length / 25);
         const currentPage = Math.min(state.currentRadioPage || 0, totalPages - 1);
         pageField = {
            name: 'الصفحة الراديو',
            value: 'صفحة ' + (currentPage + 1) + '/' + totalPages,
            inline: true,
         };
      }
      const updateNote = packageData.lastUpdateNote;
      const lastUpdated = packageData.lastUpdated;
      const footerText =
         state.controlMode === 'everyone'
            ? `وضع التحكم: الجميع \n${lastUpdated} ${updateNote}\n_________________________________________________________________________________`
            : `وضع التحكم: الأدمنز فقط \n${lastUpdated} ${updateNote}\n_________________________________________________________________________________`;

      let embed = new EmbedBuilder()
         .setColor(0x1e1f22)
         .setTitle('لوحة التحكم')
         .setDescription('اختر السورة أو استخدم الأزرار للتحكم')
         .addFields(
            { name: 'الحالي', value: currentFieldValue, inline: true },
            ...(reciterField ? [reciterField] : []),
            {
               name: 'الحالة',
               value: state.isPaused ? 'متوقف' : 'يعمل',
               inline: true,
            },
            ...(pageField ? [pageField] : []),
            ...(reciterPageField ? [reciterPageField] : []),
            { name: 'وضع التحكم', value: controlModeText, inline: true },
         )
         .setFooter({
            text: footerText,
         });
      if (thumbnailUrl && thumbnailUrl.trim() !== '') {
         embed = embed.setThumbnail(thumbnailUrl);
      }
      embedCache.set(cacheKey, {
         embed,
         timestamp: Date.now(),
         active: true,
      });
      return embed;
   } catch (error) {
      logger.error('Error Creating Control Panel For Guild ' + guildId, error);
      return new EmbedBuilder()
         .setColor(0x1e1f22)
         .setTitle('خطأ في لوحة التحكم')
         .setDescription('حدث خطأ في تحميل البيانات يرجى استخدام control مرة أخرى')
         .setFooter({ text: 'يرجى المحاولة لاحقا' });
   }
}

function clearEmbedCache(guildId = null) {
   if (guildId) {
      for (const [key] of embedCache.entries()) {
         if (key.startsWith('control_embed_' + guildId + '_')) {
            embedCache.delete(key);
         }
      }
      logger.info('Cleared Embed Cache For Guild ' + guildId);
   } else {
      embedCache.clear();
      logger.info('Cleared All Embed Caches');
   }
}

module.exports.createControlEmbed = createControlEmbed;
module.exports.clearEmbedCache = clearEmbedCache;
module.exports.embedCache = embedCache;
