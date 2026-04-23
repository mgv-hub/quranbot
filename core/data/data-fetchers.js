require('pathlra-aliaser')();

const fetch = require('node-fetch').default;
const path = require('path');
const logger = require('@logger');
const { getBrowserHeaders, getTimeoutForRequest } = require('@httpConfig-core_utils');
const { loadCachedDataFromFirebase } = require('@firebase-core_utils');
const { loadCachedData } = require('@data-cache-core_data');
const { RECITER_URLS } = require('@data-constants-core_data');
const { parseDurationToSeconds } = require('@data-utils-core_data');

async function fetchSurahs(languageCode) {
   try {
      const cache = await loadCachedData();
      const data = cache.surah || {};
      return (data.suwar || []).map((surah) => ({
         id: surah.id,
         name: surah.name,
         start_page: surah.start_page,
         end_page: surah.end_page,
         isMeccan: surah.makkia === 1,
         type: surah.type,
         language: languageCode,
      }));
   } catch (error) {
      logger.error('Error Fetching Surahs For ' + languageCode);
      return [];
   }
}

async function fetchRecitersFromRemote() {
   const reciters = {};
   let successCount = 0;
   let failCount = 0;
   for (const url of RECITER_URLS) {
      try {
         const response = await fetch(url.trim(), {
            headers: getBrowserHeaders(),
            timeout: getTimeoutForRequest('default'),
         });
         if (!response.ok) {
            logger.warn('Failed to fetch ' + url + ' ' + response.status);
            failCount++;
            continue;
         }
         const data = await response.json();
         const key = path
            .basename(url, '.json')
            .toLowerCase()
            .replace(/\s+/g, '_')
            .replace(/[^a-z0-9_]/g, '');
         if (!data.name || !data.surahs || !Array.isArray(data.surahs)) {
            logger.warn('Invalid data structure from ' + url);
            failCount++;
            continue;
         }
         const durations = data.surahs.map((s) => {
            const durationValue = s.duration || s.time || 0;
            return parseDurationToSeconds(durationValue);
         });
         reciters[key] = {
            name: data.name,
            photo: data["Sheikh's photo"] || data.photo || '',
            links: data.surahs.map((s) => (s.link ? s.link.trim() : '')),
            durations: durations,
         };
         successCount++;
         logger.info('Loaded reciter from remote ' + key);
      } catch (error) {
         logger.warn('Error loading reciter from ' + url + ' ' + error.message);
         failCount++;
      }
   }
   logger.info('Remote reciters loaded ' + successCount + ' success ' + failCount + ' failed');
   return reciters;
}

async function fetchRecitersFromFirebase() {
   try {
      const firebaseCache = await loadCachedDataFromFirebase();
      if (!firebaseCache || !firebaseCache.reciters || !firebaseCache.reciters.reciters) {
         logger.info('No reciters data in Firebase cache');
         return null;
      }
      const reciters = {};
      const recitersList = firebaseCache.reciters.reciters || [];
      for (const reciter of recitersList) {
         if (reciter.moshaf && Array.isArray(reciter.moshaf)) {
            for (const moshaf of reciter.moshaf) {
               if (moshaf.moshaf_type === 11 && moshaf.server) {
                  const key = 'reciter_' + reciter.id + '_ar';
                  const serverUrl = moshaf.server.endsWith('/') ? moshaf.server : moshaf.server + '/';
                  const links = [];
                  const durations = Array(114).fill(0);
                  for (let i = 1; i <= 114; i++) {
                     let surahUrl = serverUrl + i.toString().padStart(3, '0') + '.mp3';
                     if (serverUrl.includes('everyayah.com')) {
                        surahUrl = serverUrl + 'Alafasy/mp3/' + i.toString() + '.mp3';
                     } else if (serverUrl.includes('download.quran.islamweb.net')) {
                        surahUrl =
                           serverUrl +
                           'AbdulBaset/Mujawwad/mp3/AbdulBaset_Mujawwad_' +
                           i.toString().padStart(3, '0') +
                           '.mp3';
                     }
                     links.push(surahUrl);
                  }
                  reciters[key] = {
                     id: reciter.id,
                     name: reciter.name.replace(/\(.*?\)/g, '').trim(),
                     rewaya: moshaf.moshaf_type,
                     photo: reciter.photo || '',
                     links: links,
                     durations: durations,
                     language: 'ar',
                  };
                  break;
               }
            }
         }
      }
      if (Object.keys(reciters).length > 0) {
         logger.info('Loaded ' + Object.keys(reciters).length + ' reciters from Firebase cache');
         return reciters;
      }
      return null;
   } catch (error) {
      logger.error('Error loading reciters from Firebase');
      return null;
   }
}

async function fetchReciters(languageCode) {
   try {
      const cache = await loadCachedData();
      const data = cache.reciters || {};
      const reciters = {};
      (data.reciters || []).forEach((reciter) => {
         const key = 'reciter_' + reciter.id + '_' + languageCode;
         const durations = reciter.moshaf
            ? reciter.moshaf.flatMap((m) => {
                 return m.surah_list.split(',').map((id) => 0);
              })
            : Array(114).fill(0);
         reciters[key] = {
            name: reciter.name,
            photo: reciter.photo || '',
            links: reciter.moshaf
               ? reciter.moshaf.flatMap((m) => {
                    const server = m.server;
                    return m.surah_list.split(',').map((id) => server + id.padStart(3, '0') + '.mp3');
                 })
               : [],
            durations: durations,
            language: languageCode,
         };
      });
      return reciters;
   } catch (error) {
      logger.error('Error fetching reciters for ' + languageCode);
      return {};
   }
}

async function fetchRiwayat(languageCode) {
   try {
      const cache = await loadCachedData();
      return cache.rewayah?.riwayat || [];
   } catch (error) {
      logger.error('Error fetching riwayat for ' + languageCode);
      return [];
   }
}

async function fetchMoshaf(languageCode) {
   try {
      const cache = await loadCachedData();
      return cache.moshaf?.moshaf || [];
   } catch (error) {
      logger.error('Error fetching moshaf for ' + languageCode);
      return [];
   }
}

async function fetchRadios(languageCode) {
   try {
      const cache = await loadCachedData();
      return cache.radios?.radios || [];
   } catch (error) {
      logger.error('Error fetching radios for ' + languageCode);
      return [];
   }
}

async function fetchTafasir(languageCode) {
   try {
      const cache = await loadCachedData();
      return cache.tafasir?.tafasir || [];
   } catch (error) {
      logger.error('Error fetching tafasir for ' + languageCode);
      return [];
   }
}

module.exports.fetchSurahs = fetchSurahs;
module.exports.fetchRecitersFromRemote = fetchRecitersFromRemote;
module.exports.fetchRecitersFromFirebase = fetchRecitersFromFirebase;
module.exports.fetchReciters = fetchReciters;
module.exports.fetchRiwayat = fetchRiwayat;
module.exports.fetchMoshaf = fetchMoshaf;
module.exports.fetchRadios = fetchRadios;
module.exports.fetchTafasir = fetchTafasir;
