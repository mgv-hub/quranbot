require('pathlra-aliaser');

const { PLAYER_CONFIG } = require('@sys-config-core_interactions_buttons');

function getAvailableSurahIndex(state, maxAttempts = PLAYER_CONFIG.MAX_SURAH_ATTEMPTS) {
   const reciterData = global.reciters[state.currentReciter];
   if (!reciterData || !reciterData.links) {
      return Math.floor(Math.random() * 114) + 1;
   }
   const links = reciterData.links;
   const availableIndices = [];
   for (let i = 0; i < links.length; i++) {
      if (links[i] && links[i].trim() !== '' && links[i].startsWith('http')) {
         availableIndices.push(i + 1);
      }
   }
   if (availableIndices.length === 0) return 1;
   for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const randomIndex = Math.floor(Math.random() * availableIndices.length);
      const surahNumber = availableIndices[randomIndex];
      if (surahNumber <= 114) {
         return surahNumber;
      }
   }
   return availableIndices[0];
}

function getReciterInfo(reciterKey) {
   const reciterData = global.reciters[reciterKey];
   if (!reciterData) {
      return { name: 'غير محدد', availableCount: 114 };
   }
   const name = reciterData?.name || reciterKey;
   const availableCount =
      reciterData?.links?.filter((l) => l && l.trim() !== '' && l.startsWith('http'))?.length || 114;
   return { name, availableCount };
}

module.exports.getAvailableSurahIndex = getAvailableSurahIndex;
module.exports.getReciterInfo = getReciterInfo;
