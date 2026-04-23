require('pathlra-aliaser')();

const fs = require('fs').promises;
const pathlra = require('path');
const logger = require('@logger');

async function loadDataFromLocal() {
   try {
      const dataDir = pathlra.join(__dirname, '..', 'data');
      let localLoaded = true;
      try {
         const surahNamesData = await fs.readFile(pathlra.join(dataDir, 'surah_names_ar.json'), 'utf8');
         global.surahNames = JSON.parse(surahNamesData);
         logger.info(`Loaded ${global.surahNames.length} surah names from local file`);
      } catch (error) {
         logger.warn('No local surah name file found will load from cache');
         localLoaded = false;
      }
      try {
         const recitersData = await fs.readFile(pathlra.join(dataDir, 'reciters_ar.json'), 'utf8');
         global.reciters = JSON.parse(recitersData);
         logger.info(`Loaded ${Object.keys(global.reciters).length} reciters from local file`);
      } catch (error) {
         logger.warn('No local reader file found will load from cache');
         localLoaded = false;
      }
      try {
         const radiosData = await fs.readFile(pathlra.join(dataDir, 'radios_ar.json'), 'utf8');
         global.quranRadios = JSON.parse(radiosData);
         logger.info(`Loaded ${global.quranRadios.length} radio stations from local file`);
      } catch (error) {
         logger.warn('No local radio file found will load from cache');
         localLoaded = false;
      }
      try {
         const adhkarData = await fs.readFile(pathlra.join(dataDir, 'adhkar_ar.json'), 'utf8');
         global.azkarData = JSON.parse(adhkarData);
         logger.info(`Loaded ${global.azkarData.length} adhkar categories from local file`);
      } catch (error) {
         logger.warn('No local adhkar file found will load from remote');
         localLoaded = false;
      }
      return localLoaded;
   } catch (error) {
      logger.error('Error loading data from local files', error);
      return false;
   }
}

module.exports.loadDataFromLocal = loadDataFromLocal;
