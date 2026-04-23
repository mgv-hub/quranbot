require('pathlra-aliaser')();

const logger = require('@logger');
const { GLOBAL_CONSTANTS } = require('@data-loader-constants-core_data');
const { getCachedSurahData } = require('@data-loader-cache-core_data');
const { validateSurahList, normalizeSurahCount } = require('@data-loader-validator-core_data');

async function loadSurahNames() {
   try {
      const cache = await getCachedSurahData();
      const data = cache;
      const validSurahs = (data.suwar || [])
         .filter((surah) => surah.id >= 1 && surah.id <= GLOBAL_CONSTANTS.TOTAL_SURAHS)
         .sort((a, b) => a.id - b.id);
      if (validSurahs.length !== GLOBAL_CONSTANTS.TOTAL_SURAHS) {
         logger.warn(
            `${validSurahs.length} Surah loaded instead of ${GLOBAL_CONSTANTS.TOTAL_SURAHS} Using default names`,
         );
         global.surahNames = Array.from(
            { length: GLOBAL_CONSTANTS.TOTAL_SURAHS },
            (_, i) => `${GLOBAL_CONSTANTS.DEFAULT_SURAH_NAME_PREFIX}${i + 1}`,
         );
      } else {
         global.surahNames = validSurahs.map((surah) => surah.name);
      }
      logger.info(`Loaded ${global.surahNames.length} surah names`);
      return true;
   } catch (error) {
      logger.error('Error loading surah names', error);
      global.surahNames = Array.from(
         { length: GLOBAL_CONSTANTS.TOTAL_SURAHS },
         (_, i) => `${GLOBAL_CONSTANTS.DEFAULT_SURAH_NAME_PREFIX}${i + 1}`,
      );
      return true;
   }
}

module.exports.loadSurahNames = loadSurahNames;
