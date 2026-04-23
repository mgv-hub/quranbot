require('pathlra-aliaser')();

function isValidCacheData(data) {
   if (!data || typeof data !== 'object') return false;
   if (!data.surah || !data.surah.suwar || data.surah.suwar.length === 0) return false;
   if (!data.reciters || !data.reciters.reciters || data.reciters.reciters.length === 0) return false;
   return true;
}

function parseDurationToSeconds(duration) {
   if (typeof duration === 'number') {
      return duration;
   }
   if (typeof duration === 'string') {
      const parts = duration.split(':').map((p) => parseInt(p, 10));
      if (parts.length === 2) {
         return parts[0] * 60 + (parts[1] || 0);
      }
      if (parts.length === 3) {
         return parts[0] * 3600 + parts[1] * 60 + (parts[2] || 0);
      }
      const num = parseInt(duration, 10);
      if (!isNaN(num)) {
         return num;
      }
   }
   return 0;
}

function formatDurationText(seconds) {
   if (!seconds || seconds <= 0) {
      return 'غير متاح';
   }
   const h = Math.floor(seconds / 3600);
   const m = Math.floor((seconds % 3600) / 60);
   const s = seconds % 60;
   let text = '';
   if (h > 0) {
      text += h + ' ساعة ';
   }
   if (m > 0) {
      text += m + ' دقيقة ';
   }
   if (s > 0 || text === '') {
      text += s + ' ثانية';
   }
   return text.trim();
}

module.exports.isValidCacheData = isValidCacheData;
module.exports.parseDurationToSeconds = parseDurationToSeconds;
module.exports.formatDurationText = formatDurationText;
