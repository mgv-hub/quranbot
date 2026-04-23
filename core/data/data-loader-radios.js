require('pathlra-aliaser')();

const logger = require('@logger');
const { getCachedRadiosData } = require('@data-loader-cache-core_data');
const { validateRadioData, formatRadioUrl } = require('@data-loader-validator-core_data');

async function loadQuranRadios() {
   try {
      const cache = await getCachedRadiosData();
      const data = cache;
      global.quranRadios = (data.radios || [])
         .map((radio) => ({
            name: radio.name,
            url: formatRadioUrl(radio.url),
         }))
         .filter((radio) => validateRadioData(radio));
      if (global.quranRadios.length === 0) {
         logger.warn('No radios loaded from cache');
      }
      logger.info(`Loaded ${global.quranRadios.length} radio stations`);
      return true;
   } catch (error) {
      logger.error('Error loading Quran radios', error);
      global.quranRadios = [];
      return true;
   }
}

module.exports.loadQuranRadios = loadQuranRadios;
