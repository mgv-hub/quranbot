require('pathlra-aliaser')();

const { GLOBAL_CONSTANTS } = require('@data-loader-constants-core_data');

function validateSurahId(surahId) {
   return surahId >= 1 && surahId <= GLOBAL_CONSTANTS.TOTAL_SURAHS;
}

function validateSurahList(surahs) {
   if (!Array.isArray(surahs)) return false;
   return surahs.every((s) => s.id && validateSurahId(s.id));
}

function validateReciterData(reciter) {
   return reciter.rewaya_id && reciter.server;
}

function validateRadioData(radio) {
   return radio.url && radio.url.length > 0;
}

function validateAdhkarData(data) {
   return Array.isArray(data) && data.length > 0;
}

function normalizeSurahCount(surahNames) {
   if (!surahNames || surahNames.length > GLOBAL_CONSTANTS.TOTAL_SURAHS) {
      return surahNames ? surahNames.slice(0, GLOBAL_CONSTANTS.TOTAL_SURAHS) : [];
   }
   if (surahNames.length < GLOBAL_CONSTANTS.TOTAL_SURAHS) {
      const completed = [...surahNames];
      while (completed.length < GLOBAL_CONSTANTS.TOTAL_SURAHS) {
         completed.push(`${GLOBAL_CONSTANTS.DEFAULT_SURAH_NAME_PREFIX}${completed.length + 1}`);
      }
      return completed;
   }
   return surahNames;
}

module.exports.validateSurahId = validateSurahId;
module.exports.validateSurahList = validateSurahList;
module.exports.validateReciterData = validateReciterData;
module.exports.validateRadioData = validateRadioData;
module.exports.validateAdhkarData = validateAdhkarData;
module.exports.normalizeSurahCount = normalizeSurahCount;
