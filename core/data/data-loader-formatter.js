require('pathlra-aliaser')();

const { GLOBAL_CONSTANTS } = require('@data-loader-constants-core_data');

function formatReciterName(name) {
   if (!name) return '';
   return name.replace(/\(.*?\)/g, '').trim();
}

function formatServerUrl(server) {
   if (!server) return '';
   return server.endsWith('/') ? server : server + '/';
}

function formatSurahUrl(serverUrl, surahNumber, reciterType) {
   const padded = surahNumber.toString().padStart(3, '0');
   if (serverUrl.includes('everyayah.com')) {
      return `${serverUrl}Alafasy/mp3/${surahNumber}.mp3`;
   } else if (serverUrl.includes('download.quran.islamweb.net')) {
      return `${serverUrl}AbdulBaset/Mujawwad/mp3/AbdulBaset_Mujawwad_${padded}.mp3`;
   }
   return `${serverUrl}${padded}.mp3`;
}

function formatDuration(surahNumber) {
   const baseDuration = GLOBAL_CONSTANTS.BASE_DURATION_MS;
   const estimatedDuration =
      baseDuration * (1 + surahNumber * GLOBAL_CONSTANTS.DURATION_MULTIPLIER);
   const minutes = Math.floor(estimatedDuration / 60000);
   const seconds = Math.floor((estimatedDuration % 60000) / 1000);
   return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function formatRadioUrl(url) {
   if (!url) return '';
   return url.trim();
}

module.exports.formatReciterName = formatReciterName;
module.exports.formatServerUrl = formatServerUrl;
module.exports.formatSurahUrl = formatSurahUrl;
module.exports.formatDuration = formatDuration;
module.exports.formatRadioUrl = formatRadioUrl;
