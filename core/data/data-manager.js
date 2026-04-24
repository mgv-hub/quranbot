require('pathlra-aliaser')();

const fs = require('fs').promises;
const logger = require('@logger');
const { isValidCacheData } = require('@data-utils-core_data');
const { cacheFilePath } = require('@data-constants-core_data');
const {
   fetchSurahs,
   fetchRecitersFromRemote,
   fetchRecitersFromFirebase,
   fetchReciters,
   fetchRiwayat,
   fetchMoshaf,
   fetchRadios,
   fetchTafasir,
} = require('@data-fetchers-core_data');
const { loadRemoteAzkarData } = require('@data-azkar-core_data');
const {
   loadSetupGuilds,
   saveSetupGuilds,
   updateGuildNames,
} = require('@data-guilds-core_data');
const base = 'https://hub-mgv.github.io/QuranBotData/azkar-images/';

let surahNames = [];

async function loadData() {
   try {
      let cacheData = null;
      let useRemoteFallback = false;
      let firebaseRecitersLoaded = false;
      try {
         await fs.access(cacheFilePath);
         const content = await fs.readFile(cacheFilePath, 'utf8');
         if (content.trim()) {
            cacheData = JSON.parse(content);
            if (!isValidCacheData(cacheData)) {
               logger.warn(
                  'Cache file exists but contains invalid/empty data switching to remote fallback',
               );
               useRemoteFallback = true;
            } else {
               logger.info('Loaded valid data from data_url.json cache');
            }
         } else {
            logger.warn('Cache file is empty switching to remote fallback');
            useRemoteFallback = true;
         }
      } catch (error) {
         if (error.code === 'ENOENT') {
            logger.warn('data_url.json not found will try Firebase cache first');
         } else {
            logger.warn(
               'Error reading cache file ' + error.message + ' will try Firebase cache first',
            );
         }
      }
      const allSurahs = {};
      const surahsFromApi = await fetchSurahs('ar');
      surahsFromApi.forEach((s) => {
         if (!allSurahs[s.id]) allSurahs[s.id] = s;
      });
      surahNames = Object.values(allSurahs).map((s) => s.name);
      logger.info(
         'The API successfully loaded the surah names from the languages Number of surahs ' +
            surahNames.length,
      );
      const allReciters = {};
      const recitersFromFirebase = await fetchRecitersFromFirebase();
      if (recitersFromFirebase && Object.keys(recitersFromFirebase).length > 0) {
         Object.assign(allReciters, recitersFromFirebase);
         firebaseRecitersLoaded = true;
         logger.info('Loaded reciters from Firebase cached_data PRIMARY SOURCE');
      } else if (
         !useRemoteFallback &&
         cacheData &&
         cacheData.reciters &&
         cacheData.reciters.reciters &&
         cacheData.reciters.reciters.length > 0
      ) {
         const recitersFromApi = await fetchReciters('ar');
         Object.assign(allReciters, recitersFromApi);
         logger.info('Loaded reciters from data_url.json cache');
      } else {
         logger.info(
            'Loading reciters from remote URLs FALLBACK Firebase had no reciters data',
         );
         const recitersFromRemote = await fetchRecitersFromRemote();
         Object.assign(allReciters, recitersFromRemote);
      }
      global.reciters = allReciters;
      logger.info(
         'The API components of the devices are corrected Número de lectores ' +
            Object.keys(global.reciters).length,
      );
      global.riwayat = await fetchRiwayat('ar');
      global.moshaf = await fetchMoshaf('ar');
      global.radios = await fetchRadios('ar');
      global.tafasir = await fetchTafasir('ar');
      global.azkarData = await loadRemoteAzkarData();
      global.azkarImages = [
         `${base}1%20(1).png`,
         `${base}1%20(3).png`,
         `${base}1%20(4).png`,
         `${base}1%20(5).png`,
         `${base}1%20(6).png`,
         `${base}1%20(7).png`,
         `${base}1%20(8).png`,
         `${base}1%20(9).png`,
         `${base}1%20(10).png`,
         `${base}1%20(11).png`,
         `${base}1%20(12).png`,
         `${base}1%20(13).png`,
         `${base}1%20(14).png`,
         `${base}1%20(15).png`,
         `${base}1%20(16).png`,
      ];
      logger.info(
         'Loaded ' + global.azkarImages.length + ' azkar image URLs from remote server',
      );
      const setupGuilds = await loadSetupGuilds();
      global.surahNames = surahNames;
      global.reciterNamesList = Object.values(global.reciters)
         .map((r) => r.name)
         .join(' & ');
      global.setupGuilds = setupGuilds;
      global.saveSetupGuilds = saveSetupGuilds;
      await updateGuildNames();
      await saveSetupGuilds();
   } catch (error) {
      logger.error('Critical error during data loading');
      process.exit(1);
   }
}

module.exports.loadData = loadData;
module.exports.saveSetupGuilds = saveSetupGuilds;

logger.info('on data-manager');
