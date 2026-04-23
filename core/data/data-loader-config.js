require('pathlra-aliaser')();

const { URLs } = require('@configConstants-core_utils');

function initializeGlobalLanguages() {
   global.languages = [
      {
         id: '1',
         language: 'Arabic',
         native: 'العربية',
         ...URLs.API_ENDPOINTS,
      },
   ];
   return global.languages;
}

function getReciterUrls() {
   return URLs.RECITER_URLS;
}

function getAdhkarUrl() {
   return 'https://hub-mgv.github.io/QuranBotData/adhkar.json';
}

module.exports.initializeGlobalLanguages = initializeGlobalLanguages;
module.exports.getReciterUrls = getReciterUrls;
module.exports.getAdhkarUrl = getAdhkarUrl;
