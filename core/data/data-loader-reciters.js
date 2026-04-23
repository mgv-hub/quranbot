require('pathlra-aliaser')();

const logger = require('@logger');
const { GLOBAL_CONSTANTS } = require('@data-loader-constants-core_data');
const { getCachedRecitersData } = require('@data-loader-cache-core_data');
const { validateReciterData } = require('@data-loader-validator-core_data');
const {
   formatReciterName,
   formatServerUrl,
   formatSurahUrl,
   formatDuration,
} = require('@data-loader-formatter-core_data');

async function loadReciters() {
   try {
      const cache = await getCachedRecitersData();
      const data = cache;
      global.reciters = {};
      for (const reciter of data.reciters || []) {
         if (validateReciterData(reciter)) {
            const serverUrl = formatServerUrl(reciter.server);
            const reciterKey = `reciter_${reciter.id}`;
            const links = [];
            const durations = [];
            for (let i = 1; i <= GLOBAL_CONSTANTS.TOTAL_SURAHS; i++) {
               const surahUrl = formatSurahUrl(serverUrl, i, reciter.rewaya_id);
               links.push(surahUrl.trim());
               const duration = formatDuration(i);
               durations.push(duration);
            }
            global.reciters[reciterKey] = {
               id: reciter.id,
               name: formatReciterName(reciter.name),
               rewaya: reciter.rewaya_id,
               photo: reciter.photo || '',
               links: links,
               durations: durations,
            };
         }
      }
      if (Object.keys(global.reciters).length === 0) {
         logger.warn('No reciters loaded Using empty reciters object');
      }
      logger.info(`Loaded ${Object.keys(global.reciters).length} reciters`);
      return true;
   } catch (error) {
      logger.error('Error loading reciters', error);
      global.reciters = {};
      return true;
   }
}

module.exports.loadReciters = loadReciters;
