require('pathlra-aliaser');
const {
   createAudioStreamResource,
   fetchWithRetry,
   calculateByteRange,
   getAudioDuration,
   extractSurahNumberFromUrl,
} = require('./audioResource');
const {
   getReciterLinks,
   getReciterDurations,
   isSurahAvailable,
   getAvailableSurahCount,
   findAvailableSurahForReciter,
   findWorkingReciter,
} = require('./reciterData');
const { parseDurationToSeconds, formatDurationText, getDurationForSurah } = require('./durationFormatter');

async function createSurahResource(state, index, startSeconds = 0) {
   const MAX_FALLBACK_ATTEMPTS = 5;
   let currentAttempt = 0;
   let currentIndex = index;
   let skipValidation = false;

   while (currentAttempt < MAX_FALLBACK_ATTEMPTS) {
      try {
         const links = getReciterLinks(state);
         const url = links[currentIndex];

         if (!url || url.trim() === '') {
            const availableCount = getAvailableSurahCount(state);
            const reciters = global.reciters || {};
            const reciterData = reciters[state.currentReciter];
            const reciterName = reciterData?.name || state.currentReciter;
            throw new Error(
               `هذه السورة غير متاحة لهذا القارئ. القارئ ${reciterName} لديه ${availableCount} سورة فقط من أصل 114`,
            );
         }

         if (!skipValidation) {
            const validation = await validateStreamUrl(url);
            if (!validation.valid) {
               throw new Error(`رابط السورة غير صالح حالياً: ${validation.reason}`);
            }
         }

         const resource = await createAudioStreamResource(url, startSeconds);
         return resource;
      } catch (error) {
         currentAttempt++;
         if (currentAttempt >= MAX_FALLBACK_ATTEMPTS) {
            throw error;
         }
         skipValidation = true;
         const workingReciter = findWorkingReciter(state.currentReciter);
         if (workingReciter) {
            state.currentReciter = workingReciter;
            state.currentSurah = 1;
            currentIndex = 0;
            await delay(2000);
            continue;
         }
         const availableIndex = findAvailableSurahForReciter(state, currentIndex);
         if (availableIndex !== -1 && availableIndex !== currentIndex) {
            state.currentSurah = availableIndex + 1;
            currentIndex = availableIndex;
            await delay(2000);
            continue;
         }
         throw error;
      }
   }
   throw new Error('Max fallback attempts reached');
}

async function createRadioResource(url, startSeconds = 0) {
   if (!url || !url.startsWith('http')) {
      throw new Error(`Invalid Radio URL: ${url}`);
   }
   const validation = await validateStreamUrl(url);
   if (!validation.valid) {
      throw new Error('رابط الراديو غير صالح حالياً');
   }
   return await createAudioStreamResource(url, startSeconds);
}

async function validateStreamUrl(url) {
   if (!url || !url.startsWith('http')) {
      return { valid: false, reason: 'Invalid URL' };
   }
   const { AbortController } = require('abort-controller');
   const fetch = require('node-fetch').default;

   const { getAudioStreamHeaders } = require('@httpConfig-core_utils');

   try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(url, {
         method: 'HEAD',
         signal: controller.signal,
         headers: getAudioStreamHeaders(),
      });
      clearTimeout(timeoutId);
      const isValid = response.ok && (response.status === 200 || response.status === 302);
      return {
         valid: isValid,
         reason: isValid ? 'OK' : `HTTP ${response.status}`,
      };
   } catch (error) {
      return { valid: false, reason: error.message };
   }
}

function delay(ms) {
   return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports.createSurahResource = createSurahResource;
module.exports.createRadioResource = createRadioResource;
module.exports.validateStreamUrl = validateStreamUrl;
module.exports.getReciterLinks = getReciterLinks;
module.exports.getReciterDurations = getReciterDurations;
module.exports.isSurahAvailable = isSurahAvailable;
module.exports.getAvailableSurahCount = getAvailableSurahCount;
module.exports.findAvailableSurahForReciter = findAvailableSurahForReciter;
module.exports.findWorkingReciter = findWorkingReciter;
module.exports.parseDurationToSeconds = parseDurationToSeconds;
module.exports.formatDurationText = formatDurationText;
module.exports.getDurationForSurah = getDurationForSurah;
module.exports.fetchWithRetry = fetchWithRetry;
module.exports.calculateByteRange = calculateByteRange;
module.exports.getAudioDuration = getAudioDuration;
module.exports.extractSurahNumberFromUrl = extractSurahNumberFromUrl;
