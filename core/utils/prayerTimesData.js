require('pathlra-aliaser')();
const fs = require('fs').promises;
const pathlra = require('path');
const logger = require('@logger');

let prayerTimesData = null;
let dataLoadAttempted = false;

async function loadPrayerTimesData() {
   if (prayerTimesData) {
      return prayerTimesData;
   }

   if (dataLoadAttempted && !prayerTimesData) {
      return prayerTimesData;
   }

   dataLoadAttempted = true;

   try {
      const dataPath = pathlra.join(__dirname, '../json/prayerTimesData.json');
      const fileContent = await fs.readFile(dataPath, 'utf8');
      prayerTimesData = JSON.parse(fileContent);
      logger.info('Prayer Times Data Loaded From JSON - ' + (prayerTimesData?.countries?.length || 0) + ' countries');
      return prayerTimesData;
   } catch (error) {
      logger.error('Failed To Load Prayer Times Data', error);
      prayerTimesData = { countries: [], citiesByCountry: {}, countryTimeFormats: {} };
      return prayerTimesData;
   }
}

function getCountries() {
   return prayerTimesData?.countries || [];
}

function getCitiesByCountry() {
   return prayerTimesData?.citiesByCountry || {};
}

function getCitiesForCountry(countryCode) {
   return prayerTimesData?.citiesByCountry?.[countryCode] || [];
}

function getCountryByCode(code) {
   return prayerTimesData?.countries?.find((c) => c.code === code) || null;
}

function getTimeFormatForCountry(countryCode) {
   return prayerTimesData?.countryTimeFormats?.[countryCode] || '24';
}

function getAllTimeFormats() {
   return prayerTimesData?.countryTimeFormats || {};
}

module.exports.loadPrayerTimesData = loadPrayerTimesData;
module.exports.getCountries = getCountries;
module.exports.getCitiesByCountry = getCitiesByCountry;
module.exports.getCitiesForCountry = getCitiesForCountry;
module.exports.getCountryByCode = getCountryByCode;
module.exports.getTimeFormatForCountry = getTimeFormatForCountry;
module.exports.getAllTimeFormats = getAllTimeFormats;
