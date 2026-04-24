require('pathlra-aliaser');
const logger = require('../logger');

function getReciterLinks(state) {
   const reciters = global.reciters || {};
   const reciterData = reciters[state.currentReciter];
   if (!reciterData || !reciterData.links) {
      const defaultReciter = Object.keys(reciters)[0];
      return reciters[defaultReciter]?.links || Array(114).fill('');
   }
   if (reciterData.links.length > 114) {
      return reciterData.links.slice(0, 114);
   } else if (reciterData.links.length < 114) {
      const filledLinks = [...reciterData.links];
      while (filledLinks.length < 114) {
         filledLinks.push('');
      }
      return filledLinks;
   }
   return reciterData.links;
}

function getReciterDurations(state) {
   const reciters = global.reciters || {};
   const reciterData = reciters[state.currentReciter];
   if (!reciterData || !reciterData.durations) {
      const defaultReciter = Object.keys(reciters)[0];
      return reciters[defaultReciter]?.durations || Array(114).fill(0);
   }
   if (reciterData.durations.length > 114) {
      return reciterData.durations.slice(0, 114);
   } else if (reciterData.durations.length < 114) {
      const filledDurations = [...reciterData.durations];
      while (filledDurations.length < 114) {
         filledDurations.push(0);
      }
      return filledDurations;
   }
   return reciterData.durations;
}

function isSurahAvailable(state, surahIndex) {
   const reciters = global.reciters || {};
   const reciterData = reciters[state.currentReciter];
   if (!reciterData || !reciterData.links) {
      return false;
   }
   if (surahIndex < 0 || surahIndex >= reciterData.links.length) {
      return false;
   }
   const url = reciterData.links[surahIndex];
   return url && url.trim() !== '' && url.startsWith('http');
}

function getAvailableSurahCount(state) {
   const reciters = global.reciters || {};
   const reciterData = reciters[state.currentReciter];
   if (!reciterData || !reciterData.links) {
      return 114;
   }
   let count = 0;
   for (let i = 0; i < reciterData.links.length && i < 114; i++) {
      if (reciterData.links[i] && reciterData.links[i].trim() !== '') {
         count++;
      }
   }
   return count > 0 ? count : 114;
}

function findAvailableSurahForReciter(state, excludeIndex = -1) {
   const reciters = global.reciters || {};
   const reciterData = reciters[state.currentReciter];
   if (!reciterData || !reciterData.links) {
      return -1;
   }
   const availableIndices = [];
   for (let i = 0; i < reciterData.links.length && i < 114; i++) {
      if (
         i !== excludeIndex &&
         reciterData.links[i] &&
         reciterData.links[i].trim() !== '' &&
         reciterData.links[i].startsWith('http')
      ) {
         availableIndices.push(i);
      }
   }
   if (availableIndices.length === 0) {
      return -1;
   }
   return availableIndices[Math.floor(Math.random() * availableIndices.length)];
}

function findWorkingReciter(excludeReciter = null) {
   const reciters = global.reciters || {};
   const reciterKeys = Object.keys(reciters);
   const availableReciters = [];
   for (const key of reciterKeys) {
      if (key === excludeReciter) {
         continue;
      }
      const reciterData = reciters[key];
      if (!reciterData || !reciterData.links) {
         continue;
      }
      const validLinks = reciterData.links.filter(
         (link) => link && link.trim() !== '' && link.startsWith('http'),
      );
      if (validLinks.length > 0) {
         availableReciters.push(key);
      }
   }
   if (availableReciters.length === 0) {
      return null;
   }
   return availableReciters[Math.floor(Math.random() * availableReciters.length)];
}

module.exports.getReciterLinks = getReciterLinks;
module.exports.getReciterDurations = getReciterDurations;
module.exports.isSurahAvailable = isSurahAvailable;
module.exports.getAvailableSurahCount = getAvailableSurahCount;
module.exports.findAvailableSurahForReciter = findAvailableSurahForReciter;
module.exports.findWorkingReciter = findWorkingReciter;
