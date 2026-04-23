require('pathlra-aliaser')();
const fs = require('fs').promises;
const pathlra = require('path');
const fetch = require('node-fetch').default;
const logger = require('@logger');
const { loadCachedDataFromFirebase, saveCachedDataToFirebase } = require('@firebase-core_utils');
const { PATHS, URLs } = require('@configConstants-core_utils');

const CACHE_FILE = pathlra.join(__dirname, PATHS.CACHE_FILE);
const ENDPOINTS = URLs.API_ENDPOINTS;
const FALLBACK_DATA = {
   surah: {
      suwar: Array.from({ length: 114 }, (_, i) => ({
         id: i + 1,
         name: `سورة ${i + 1}`,
         start_page: 1,
         end_page: 1,
         makkia: i < 90,
         type: 'meccan',
      })),
   },
   reciters: {
      reciters: [],
   },
   radios: {
      radios: [],
   },
};

let cacheLoadAttempted = false;

async function fetchDataFromEndpoint(url) {
   try {
      const cleanUrl = url.trim();
      const response = await fetch(cleanUrl, {
         headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; quranbot/ +https://discord.com)',
         },
         timeout: 30000,
      });
      if (!response.ok) {
         throw new Error(`HTTP error status ${response.status}`);
      }
      const data = await response.json();
      logger.info(`Loaded data from ${cleanUrl}`);
      return data;
   } catch (error) {
      logger.error(`Error fetching data from ${url}`, error);
      return null;
   }
}

async function loadAndCacheAllData() {
   const cacheData = {};
   logger.info('Cache starting load data from API');
   for (const [key, url] of Object.entries(ENDPOINTS)) {
      logger.info(`Cache Loading ${key} data from ${url}`);
      cacheData[key] = await fetchDataFromEndpoint(url);
      if (!cacheData[key]) {
         logger.warn(`Cache Failed to load ${key} data Using fallback data`);
         cacheData[key] = FALLBACK_DATA[key] || {};
      }
   }
   await saveCachedDataToFirebase(cacheData);
   try {
      const dir = pathlra.dirname(CACHE_FILE);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(CACHE_FILE, JSON.stringify(cacheData, null, 2), 'utf8');
      logger.info(`Cache saved data to ${CACHE_FILE}`);
   } catch (error) {
      logger.warn(`Cache Failed to save locally ${error.message}`);
   }
   logger.info('Cache saved data to Firebase');
   return cacheData;
}

async function loadCachedData() {
   if (cacheLoadAttempted) {
      const data = await loadCachedDataFromFirebase();
      if (data && data.surah && data.surah.suwar && data.surah.suwar.length > 0) {
         logger.info('Cache loaded data from Firebase cached');
         return data;
      }
   }
   cacheLoadAttempted = true;
   try {
      const data = await loadCachedDataFromFirebase();
      if (data && data.surah && data.surah.suwar && data.surah.suwar.length > 0) {
         logger.info('Cache loaded data from Firebase');
         return data;
      }
      logger.warn('Cache surah data empty in Firebase reloading from API');
      return await loadAndCacheAllData();
   } catch (error) {
      logger.warn('Cache No valid cache found in Firebase Loading data from API');
      return await loadAndCacheAllData();
   }
}

async function updateCacheForEndpoint(endpointKey) {
   if (!ENDPOINTS[endpointKey]) {
      throw new Error(`Invalid endpoint key ${endpointKey}`);
   }
   let cacheData;
   try {
      cacheData = await loadCachedDataFromFirebase();
   } catch {
      cacheData = {};
   }
   logger.info(`Cache Updating ${endpointKey} data`);
   const newData = await fetchDataFromEndpoint(ENDPOINTS[endpointKey]);
   if (newData) {
      cacheData[endpointKey] = newData;
      await saveCachedDataToFirebase(cacheData);
      logger.info(`Cache updated ${endpointKey} data in cache`);
      return cacheData;
   } else {
      logger.warn(`Cache Failed to update ${endpointKey} data Keeping old data`);
      return cacheData;
   }
}

module.exports.loadCachedData = loadCachedData;
module.exports.loadAndCacheAllData = loadAndCacheAllData;
module.exports.updateCacheForEndpoint = updateCacheForEndpoint;
module.exports.CACHE_FILE = CACHE_FILE;
